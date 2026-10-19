import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMarkdown,
  renderMarkdown,
} from "../../src/formats/gfm/markdown.js";
import { readExamples, specExamples } from "../../scripts/conformance.mjs";

test("GFM corpus preserves upstream extension and disabled flags", async () => {
  const examples = await readExamples();
  assert.deepEqual(examples[620].flags, ["autolink"]);
  assert.deepEqual(examples[651].flags, ["tagfilter"]);
  assert.deepEqual(examples[278].flags, ["disabled"]);
  assert.equal(
    specExamples(
      "```````````````````````````````` example\nx\n.\ny\n````````````````````````````````",
    )[0].flags.length,
    0,
  );
});

test("shared GFM fixes preserve literal code, source maps and intervening emphasis", async () => {
  const examples = await readExamples();
  for (const id of [
    199, 398, 426, 434, 435, 436, 441, 473, 474, 475, 477, 621, 622, 623, 624,
    627, 652,
  ]) {
    const example = examples[id - 1];
    assert.equal(
      renderMarkdown(example.source, { presentation: false }).html,
      example.expected,
      `GFM example ${id}`,
    );
  }
  const md = createMarkdown();
  const tokens = md.parse(
    "****bold****\n\n| left | right |\n| :--- | ---: |\n| a | b |\n",
    {},
  );
  assert.deepEqual(tokens[0].map, [0, 1]);
  assert.equal(
    tokens[1].children.filter((t) => t.type === "strong_open").length,
    2,
  );
  assert.equal(
    tokens[1].children.filter((t) => t.type === "strong_open" && t.hidden)
      .length,
    1,
  );
  const source =
    "`www.example.com`\n\n```text\n<title>literal</title>\n```\n\n[www.example.com](https://example.org)\n\nwww.\n\nexample.com\n";
  const html = renderMarkdown(source).html;
  assert.match(html, /<code>www.example.com<\/code>/);
  assert.match(html, /&lt;title&gt;literal&lt;\/title&gt;/);
  assert.equal((html.match(/<a /g) || []).length, 1);
  assert.match(html, /<p>www\.<\/p>/);
  assert.match(html, /<p>example.com<\/p>/);
});

test("tagfilter escapes only GFM raw-text tag names, case-insensitively", () => {
  for (const tag of [
    "title",
    "textarea",
    "style",
    "xmp",
    "iframe",
    "noembed",
    "noframes",
    "script",
    "plaintext",
  ]) {
    const html = renderMarkdown(
      `<${tag.toUpperCase()} data-x="1">visible</${tag}>`,
    ).html;
    assert.ok(
      html.includes(`&lt;${tag.toUpperCase()} data-x="1">visible&lt;/${tag}>`),
      html,
    );
  }
  assert.match(
    renderMarkdown("<scripture>text</scripture>").html,
    /<scripture>/,
  );
  assert.match(
    renderMarkdown("<strong>kept</strong>").html,
    /<strong>kept<\/strong>/,
  );
  assert.equal(
    renderMarkdown("<title>visible</title>\n", {
      presentation: false,
      extensions: [],
    }).html,
    "<title>visible</title>\n",
  );
});

test("GFM autolink boundaries match the pinned native reference", async () => {
  const { readFile } = await import("node:fs/promises");
  const fixture = JSON.parse(
    await readFile(
      new URL("../fixtures/gfm-autolinks.json", import.meta.url),
      "utf8",
    ),
  );
  for (const example of fixture.cases.filter(
    (e) => !fixture.knownDeviations.some((gap) => gap.id === e.id),
  ))
    assert.equal(
      renderMarkdown(example.source, { presentation: false }).html,
      example.expected,
      example.id,
    );
});

test("broader native autolink differences stay explicitly audited", async () => {
  const { readFile } = await import("node:fs/promises");
  const fixture = JSON.parse(
    await readFile(
      new URL("../fixtures/gfm-autolinks.json", import.meta.url),
      "utf8",
    ),
  );
  const differences = fixture.cases
    .filter(
      (e) =>
        renderMarkdown(e.source, { presentation: false }).html !== e.expected,
    )
    .map((e) => e.id);
  assert.deepEqual(
    differences,
    fixture.knownDeviations.map((gap) => gap.id),
  );
});

test("canonical task HTML keeps checkbox state while production keeps CSS hooks", () => {
  const source = "- [x] Done\n- [ ] Next\n";
  const canonical = renderMarkdown(source, { presentation: false }).html;
  const production = renderMarkdown(source).html;
  assert.equal(
    canonical,
    '<ul>\n<li><input checked="" disabled="" type="checkbox"> Done</li>\n<li><input disabled="" type="checkbox"> Next</li>\n</ul>\n',
  );
  assert.ok(production.includes('class="contains-task-list"'));
  assert.ok(
    production.includes(
      'class="task-list-item-checkbox" checked="" disabled=""',
    ),
  );
  const html = '<input class="task-list-item-checkbox" type="checkbox">\n';
  assert.ok(
    renderMarkdown(html, { presentation: false }).html.includes(
      'class="task-list-item-checkbox"',
    ),
  );
});

test("GFM empty expected output stays empty and empty blockquotes retain a newline", async () => {
  const examples = await readExamples();
  for (const id of [176, 188]) {
    assert.equal(examples[id - 1].expected, "");
    assert.equal(renderMarkdown(examples[id - 1].source).html, "");
  }
  for (const id of [187, 217, 218])
    assert.equal(
      renderMarkdown(examples[id - 1].source).html,
      examples[id - 1].expected,
    );
});

test("automatic link recognition keeps a bounded candidate and explicit links stay complete", () => {
  const url = "https://example.com/" + "a".repeat(30_000);
  const md = createMarkdown();
  const tokens = md.parse(url, {})[1].children;
  assert.equal(tokens.filter((t) => t.type === "link_open").length, 1);
  assert.ok(
    tokens.find((t) => t.type === "link_open").attrGet("href").length < 10_020,
  );
  assert.equal(
    tokens
      .filter((t) => t.type === "text")
      .map((t) => t.content)
      .join(""),
    url,
  );
  assert.ok(
    renderMarkdown(`[Full link](<${url}>)`).html.includes(`href="${url}"`),
  );
});
