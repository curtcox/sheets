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
