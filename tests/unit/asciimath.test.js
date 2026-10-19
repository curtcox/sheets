import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Parser from "../../vendor/asciimath2tex.js";
import { renderAsciiMath } from "../../src/formats/asciimath/index.js";
import {
  ASCIIMATH_FORMULAS as formulas,
  ASCIIMATH_PROSE as prose,
  resolveDocument,
} from "../../src/compatibility-profiles.js";
import { readURL, writeURL, readOverrides } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";
import { buildShareLink } from "../../src/share-links.js";
const parser = new Parser();
const corpus = JSON.parse(
  await readFile(
    new URL("../fixtures/asciimath/upstream-corpus.json", import.meta.url),
  ),
);
const codes = (html) =>
  [...html.matchAll(/<code>([\s\S]*?)<\/code>/g)].map((m) =>
    m[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'"),
  );

test("AsciiMath preserves all pinned translations and classifies existing upstream discrepancies", () => {
  const mismatches = [],
    warnings = [],
    errors = [];
  for (const fixture of corpus.cases) {
    const tex = parser.parse(fixture.source),
      result = renderAsciiMath(fixture.source, { profile: formulas });
    assert.equal(
      codes(result.html)[0],
      tex,
      `Show TeX changed the pinned translation: ${fixture.id}`,
    );
    if (tex !== fixture.expected)
      mismatches.push({
        id: fixture.id,
        input: fixture.source,
        expected: fixture.expected,
        actual: tex,
      });
    if (result.diagnostics.some((d) => d.severity === "warning"))
      warnings.push(fixture.id);
    if (result.diagnostics.some((d) => d.severity === "error"))
      errors.push(fixture.id);
  }
  assert.deepEqual(
    mismatches,
    corpus.deviations.map(({ reason, ...fixture }) => fixture),
  );
  assert.deepEqual(warnings, [426, 427]); // upstream's intentional incomplete 3/ and 2^
  assert.deepEqual(errors, [
    ...Array.from({ length: 8 }, (_, i) => i + 35),
    ...Array.from({ length: 8 }, (_, i) => i + 268),
  ]);
});

test("AsciiMath modes remain explicit when source resembles Markdown or gains prose", () => {
  const source = "sqrt(9)\n# Heading\n\nAn explanation with $x^2$";
  const formula = renderAsciiMath(source, { profile: formulas }),
    mixed = renderAsciiMath(source, { profile: prose });
  assert.equal((formula.html.match(/Show TeX/g) || []).length, 3);
  assert.ok(!formula.html.includes("<h1>"));
  assert.match(mixed.html, /<h1>Heading<\/h1>/);
  assert.match(mixed.html, /<p>sqrt\(9\)<\/p>/);
  assert.equal((mixed.html.match(/Show TeX/g) || []).length, 1);
  assert.equal(
    renderAsciiMath("sqrt(9)").html,
    renderAsciiMath("sqrt(9)", { profile: formulas }).html,
  );
  assert.equal(renderAsciiMath(source).html, mixed.html);
  assert.throws(
    () => renderAsciiMath("x", { profile: "calca-blocks-v1" }),
    /requires calca/,
  );
});

test("AsciiMath warnings have exact lines and columns without rejecting permissive notation", () => {
  const source = "\n  sqrt(\n\nx/\nx_\nx^\n  root(3)\ntext(hello";
  const result = renderAsciiMath(source, { profile: formulas });
  assert.deepEqual(
    result.diagnostics.map((d) => [d.line, d.column, d.severity]),
    [
      [2, 6, "warning"],
      [4, 1, "warning"],
      [5, 1, "warning"],
      [6, 1, "warning"],
      [7, 2, "warning"],
      [8, 0, "warning"],
    ],
  );
  assert.equal(codes(result.html).length, 6);
  for (const source of [
    "[0,1)",
    "(0,1]",
    "{: x :}",
    "(x",
    "|x|",
    "lim_(x rarr 2^-) f(x)",
    "text(a(b)",
    '"(not a group)"',
    "sqrt",
    "root",
    "sin",
    "[(1,2),(3,4)]",
  ])
    assert.deepEqual(
      renderAsciiMath(source, { profile: formulas }).diagnostics,
      [],
      source,
    );
});

test("AsciiMath maps inline, quote/list, table, display, fenced, repeated, Unicode and footnote formulas", () => {
  const source =
    "# H\n\n😀 `$x^$` then $x^$\n\n> quote $x/$\n\n- $root(3)$\n\n| A | B |\n|-|-|\n| escaped\\| $x^$ | escaped\\| $x^$ |\n\n$$\nx/\n$$\n\n> ```asciimath\n>\n>   x^\n> ```\n\n[^n]: $x/$\n\nFootnote[^n]";
  const result = renderAsciiMath(source, { profile: prose });
  assert.deepEqual(
    result.diagnostics.map((d) => [d.line, d.column]),
    [
      [3, 17],
      [5, 10],
      [7, 3],
      [11, 14],
      [11, 31],
      [14, 1],
      [19, 5],
      [22, 8],
    ],
  );
  assert.equal(
    renderAsciiMath("`$x/$`\n\n```text\nx/\n```\n\n<div>\n$x/$\n</div>", {
      profile: prose,
    }).diagnostics.length,
    0,
  );
});

test("AsciiMath typesetting errors report the formula location and leave later output available", () => {
  const result = renderAsciiMath(
    "# H\n\n    code\n\nBefore $twoheadrightarrowtail$ after.\n\n$sqrt(9)$",
    { profile: prose },
  );
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].line, 5);
  assert.equal(result.diagnostics[0].column, 8);
  assert.match(result.diagnostics[0].message, /Unsupported function/);
  assert.match(result.html, /<msqrt>/);
});

for (const profile of [formulas, prose])
  test(`AsciiMath ${profile} survives URLs, saved content, Auto and explicit overrides`, () => {
    const base = "https://curtcox.github.io/sheets/index.html",
      src = "# Unicode 😀\n\nsqrt(9)";
    for (const format of ["auto", "asciimath"])
      for (const view of ["split", "source", "preview"]) {
        const link = writeURL(base, { src, format, view, profile });
        assert.deepEqual(readURL(link), {
          src,
          format,
          view,
          profile,
          kind: "source",
        });
        assert.equal(
          new URL(
            buildShareLink(link, { src, format, view, profile }),
          ).searchParams.get("profile"),
          profile,
        );
      }
    const payload = HashBinDocuments.serialize({
      src,
      type: "asciimath",
      view: "source",
      profile,
    });
    assert.equal(JSON.parse(payload).version, 2);
    const saved = HashBinDocuments.parse(payload);
    assert.deepEqual(resolveDocument(saved), {
      src,
      format: "asciimath",
      view: "source",
      profile,
    });
    assert.equal(resolveDocument(saved, { format: "gfm" }).profile, undefined);
    assert.equal(
      resolveDocument(saved, {
        profile: profile === formulas ? prose : formulas,
      }).profile,
      profile === formulas ? prose : formulas,
    );
    assert.equal(
      HashBinDocuments.parse(
        HashBinDocuments.serialize({ src, type: "asciimath" }),
      ).profile,
      undefined,
    );
    const link = writeURL(base, {
      format: "asciimath",
      profile,
      cid: "AAAAAAAA",
    });
    assert.equal(readURL(link).kind, "hashbin");
    assert.deepEqual(readOverrides(link), { format: "asciimath", profile });
    assert.throws(
      () => writeURL(base, { src, format: "gfm", profile }),
      /requires asciimath/,
    );
    assert.throws(
      () => HashBinDocuments.serialize({ src, type: "calca", profile }),
      /requires asciimath/,
    );
    assert.throws(
      () => readURL(base + "?format=asciimath&profile=future-asciimath"),
      /Unsupported compatibility profile/,
    );
  });
