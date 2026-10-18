import { test, expect } from "@playwright/test";
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
  );
async function open(page, format) {
  await page.goto(`/?example=${format}-basic`);
  await ready(page);
  expect(
    await page.evaluate(() => ace.edit("editor").session.getMode().$id),
  ).toBe(`ace/mode/${format}`);
}
const tokenize = (page, source) =>
  page.evaluate((source) => {
    const tokenizer = ace.edit("editor").session.getMode().getTokenizer();
    let state = "start";
    return source.split("\n").map((line) => {
      const result = tokenizer.getLineTokens(line, state);
      state = result.state;
      if (result.tokens.map((token) => token.value).join("") !== line)
        throw new Error("Tokenizer changed source text");
      return result.tokens;
    });
  }, source);
const has = (tokens, type, value) =>
  tokens.some((token) => token.type === type && token.value.includes(value));

test("Beancount highlights accounts, amounts, metadata and tags while strings protect comments", async ({
  page,
}) => {
  await open(page, "beancount");
  const lines = await tokenize(
    page,
    '2026-01-02 * "Pay ; #work" #salary ^payroll\n  Assets:Bank -1,234.50 USD ; deposit\n  reference: "January"',
  );
  expect(has(lines[0], "constant.numeric.date", "2026-01-02")).toBe(true);
  expect(has(lines[0], "string", "Pay ; #work")).toBe(true);
  expect(has(lines[0], "entity.name.tag", "#salary")).toBe(true);
  expect(has(lines[0], "entity.name.tag", "^payroll")).toBe(true);
  expect(has(lines[1], "variable", "Assets:Bank")).toBe(true);
  expect(has(lines[1], "constant.numeric", "-1,234.50")).toBe(true);
  expect(has(lines[1], "support.type", "USD")).toBe(true);
  expect(has(lines[1], "comment", "; deposit")).toBe(true);
  expect(has(lines[2], "variable.parameter", "reference:")).toBe(true);
});

test("Numbat highlights declarations, conversions, Unicode identifiers and escaped strings", async ({
  page,
}) => {
  await open(page, "numbat");
  const lines = await tokenize(
    page,
    'let α = 1.2e-3 m\nfn speed(t) = α / t -> m/s # rate\n"text # and \\"quotes\\"" # comment\nunit sheetstep = 1.7018 m',
  );
  expect(has(lines[0], "keyword", "let")).toBe(true);
  expect(has(lines[0], "variable", "α")).toBe(true);
  expect(has(lines[0], "constant.numeric", "1.2e-3")).toBe(true);
  expect(has(lines[1], "keyword", "fn")).toBe(true);
  expect(has(lines[1], "keyword.operator", "->")).toBe(true);
  expect(has(lines[1], "comment", "# rate")).toBe(true);
  expect(has(lines[2], "string", "text # and")).toBe(true);
  expect(has(lines[2], "constant.language.escape", '\\"')).toBe(true);
  expect(has(lines[2], "comment", "# comment")).toBe(true);
  expect(has(lines[3], "keyword", "unit")).toBe(true);
});

test("Org formula and source block states end before subsequent headings and tables", async ({
  page,
}) => {
  await open(page, "org");
  const lines = await tokenize(
    page,
    "#+tblfm: $3=vsum(@2$1..@>$1);%.2f\n* Results\n#+begin_src text\n* Not a heading in code\n#+end_src\n** More results\n| 12 | 4 |",
  );
  expect(has(lines[0], "keyword", "#+tblfm:")).toBe(true);
  expect(has(lines[0], "variable", "$3")).toBe(true);
  expect(has(lines[0], "support.function", "vsum")).toBe(true);
  expect(has(lines[1], "markup.heading", "* Results")).toBe(true);
  expect(has(lines[3], "markup.raw", "* Not a heading in code")).toBe(true);
  expect(has(lines[5], "markup.heading", "** More results")).toBe(true);
  expect(has(lines[6], "constant.numeric", "12")).toBe(true);
  expect(has(lines[6], "punctuation.operator", "|")).toBe(true);
});

test("Hurmet calculation cells return to Markdown and fenced code stays literal", async ({
  page,
}) => {
  await open(page, "hurmet");
  const lines = await tokenize(
    page,
    "# Heading\n\n- Area ¢` a^2 = ? ` and **bold**.\n\n¢¢\nx = 2 'm'\nx^2 = ??\n¢¢\n\nAfter ¢ x = 3 ¢ prose.\n\n```text\n¢` x = 2 `\n```",
  );
  expect(has(lines[0], "markup.heading.1", "#")).toBe(true);
  expect(has(lines[2], "constant.numeric", "2")).toBe(true);
  expect(has(lines[2], "string.strong", "**bold**")).toBe(true);
  expect(has(lines[5], "constant.numeric", "2")).toBe(true);
  expect(has(lines[5], "string", "'m'")).toBe(true);
  expect(has(lines[6], "keyword.operator", "??")).toBe(true);
  expect(has(lines[9], "constant.numeric", "3")).toBe(true);
  expect(lines[9].at(-1).type).toMatch(/^text(?:\.|$)/);
  expect(lines[12].every((token) => token.type === "support.function")).toBe(
    true,
  );
});

test("automatic detection and manual changes switch editor modes without changing source", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const source = "let length = 3 m";
  await page.locator("#format").selectOption("auto");
  await page.evaluate(
    (source) => ace.edit("editor").setValue(source, -1),
    source,
  );
  await ready(page);
  expect(
    await page.evaluate(() => ace.edit("editor").session.getMode().$id),
  ).toBe("ace/mode/numbat");
  await page.locator("#format").selectOption("org");
  await page.locator("#format").selectOption("hurmet");
  await page.locator("#format").selectOption("text");
  await ready(page);
  expect(
    await page.evaluate(() => ace.edit("editor").session.getMode().$id),
  ).toBe("ace/mode/text");
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  await page.locator("#format").selectOption("numbat");
  await ready(page);
  expect(await page.locator("#editor .ace_keyword").first().textContent()).toBe(
    "let",
  );
});

test("a delayed Hurmet editor module cannot override a newer format", async ({
  page,
}) => {
  await open(page, "org");
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  await page.route("**/mode-markdown.js", async (route) => {
    await gate;
    await route.continue();
  });
  const requested = page.waitForRequest("**/mode-markdown.js");
  await page.locator("#format").selectOption("hurmet");
  await requested;
  await page.locator("#format").selectOption("text");
  await ready(page);
  const loaded = page.waitForResponse("**/mode-markdown.js");
  release();
  await loaded;
  await page.waitForFunction(() => Boolean(ace.require("ace/mode/markdown")));
  expect(
    await page.evaluate(() => ace.edit("editor").session.getMode().$id),
  ).toBe("ace/mode/text");
  await expect(page.locator("#render-status")).toHaveText("Ready · Plain text");
  await page.locator("#format").selectOption("hurmet");
  await ready(page);
  expect(
    await page.evaluate(() => ace.edit("editor").session.getMode().$id),
  ).toBe("ace/mode/hurmet");
});
