import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createScopedCalca } from "../../src/formats/calca/scoped.js";
import { createCalca } from "../../src/formats/calca/engine.js";
import { renderCalca } from "../../src/formats/calca/index.js";
import {
  CALCA_SCOPES,
  CALCA_BLOCKS,
} from "../../src/compatibility-profiles.js";
const render = (source) => renderCalca(source, { profile: CALCA_SCOPES });
function context(...lines) {
  const run = createScopedCalca();
  lines.forEach((line, i) => run(line, { line: i + 1, query: false }));
  return run;
}

test("Calca's published heading example preserves parent/child and sibling availability", () => {
  const fixture = JSON.parse(
    readFileSync(new URL("../fixtures/calca/scopes.json", import.meta.url)),
  );
  const result = render(fixture.source);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.recalculatedSource, fixture.expected);
});
test("scopes follow parsed ATX/Setext headings and preserve source locations", () => {
  const source =
    "    rootValue=2\n\nFirst\n=====\n\n    localValue=3\n\n## Child\n\n```calca\n# Literal heading\nrootValue+localValue =>\n```\n\nSecond\n======\n\nlocalValue =>\nrootValue =>\nmissingValue+1 =>";
  const result = render(source);
  assert.match(result.recalculatedSource, /rootValue\+localValue => 5/);
  assert.match(result.recalculatedSource, /localValue => localValue/);
  assert.match(result.recalculatedSource, /rootValue => 2/);
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].line, 20);
  assert.match(result.diagnostics[0].message, /Symbolic dependencies/);
  assert.match(render("rootValue =>").recalculatedSource, /=> rootValue/);
});
test("immutable definitions reject contradictory redefinitions without overwriting parents", () => {
  const run = context("value=2");
  assert.throws(
    () => run("value=3", { line: 7 }),
    /Conflicting relations at lines 1, 7/,
  );
  assert.throws(() => run("value"), /Conflicting relations/);
  assert.equal(run("2+2"), 4);
  const child = context("value=2");
  child.heading(1);
  assert.throws(() => child("value=3"), /Conflicting relations/);
  child.heading(1);
  assert.equal(child("value"), 2);
  assert.equal(context("value=2", "value=2")("value"), 2);
});
test("deferred values and function dependencies use the query's visible scope", () => {
  const run = context("total=rate*count", "f(x)=x*rate", "rate=3", "count=4");
  assert.equal(run("total"), 12);
  assert.equal(run("f(5)"), 15);
  const scoped = context("total=rate*2", "f(x)=x+rate");
  scoped.heading(1);
  scoped("rate=3", { query: false });
  assert.equal(scoped("total"), 6);
  assert.equal(scoped("f(5)"), 8);
  scoped.heading(1);
  scoped("rate=5", { query: false });
  assert.equal(scoped("total"), 10);
  assert.equal(scoped("f(5)"), 10);
  const sequential = createScopedCalca();
  assert.equal(sequential("futureValue"), "futureValue");
  sequential("futureValue=4", { query: false });
  assert.equal(sequential("futureValue"), 4);
});
test("reverse definitions and all connected constraints determine the accepted roots", () => {
  assert.equal(context("tempF=1.8*tempC+32", "tempF=212")("tempC"), 100);
  assert.equal(
    context("height=2*width", "area=height*width", "area=18")("width").length,
    2,
  );
  for (const equations of [
    ["width^2=4", "width+1=3"],
    ["width+1=3", "width^2=4"],
  ])
    assert.equal(context(...equations)("width"), 2);
  assert.deepEqual(context("width^2=4")("width"), [-2, 2]);
  for (const coefficient of [1, 1e-20]) {
    const roots = context(`${coefficient}*(width^2-5*width+6)=0`)("width");
    assert.equal(roots.length, 2);
    assert.ok(Math.abs(roots[0] - 2) < 1e-12 && Math.abs(roots[1] - 3) < 1e-12);
  }
  assert.equal(
    context("f(x)=x^2-5*x+6", "f(width)=0", "width+1=4")("width"),
    3,
  );
  assert.deepEqual(context("width^2+1=0")("width"), []);
  assert.ok(
    Math.abs(
      context("width^2-5*width+6=0", "width^2-3*width+2=0")("width") - 2,
    ) < 1e-12,
  );
  for (const equations of [
    ["width+1=4", "width+1=9"],
    ["width^3=8", "width+1=4"],
    ["width^2=4", "width^2=9"],
  ]) {
    const run = context(...equations);
    assert.throws(() => run("width"), /Conflicting relations/);
    assert.equal(run("2+2"), 4);
  }
});
test("relations in siblings are isolated and tiny contradictions are not rounded away", () => {
  const run = context("height=2*width");
  run.heading(1);
  run("height=6", { query: false });
  assert.equal(run("width"), 3);
  run.heading(2);
  assert.equal(run("width"), 3);
  run.heading(1);
  run("height=10", { query: false });
  assert.equal(run("width"), 5);
  assert.throws(
    () => context("smallValue=0", "smallValue=1e-20"),
    /Conflicting relations/,
  );
  assert.throws(
    () => context("cancelledValue=1e20-1e20", "cancelledValue=1"),
    /Conflicting relations/,
  );
  assert.equal(context("value=0.1+0.2", "value=0.3")("value"), 0.1 + 0.2);
});
test("unsupported systems, symbolic expressions, units and function inversion report diagnostics", () => {
  for (const equations of [
    ["width^3=8"],
    ["sin(width)+1=1"],
    ["width+height=3"],
    ["width*1 km=2 km"],
    ["f(x)=2*x", "f(width)=4"],
  ])
    assert.throws(
      () => context(...equations)("width"),
      /unsupported|not supported|polynomials only|Undefined symbol/i,
    );
  assert.throws(() => context("width=height+1")("width"), /not supported/);
  assert.throws(() => context("width=width")("width"), /Circular/);
  assert.throws(() => context("a=b+1", "b=a+1"), /Circular/);
  assert.throws(() => context("width+1=width+1")("width"), /Infinitely many/);
  assert.throws(() => context("width^2=4")("width+1"), /query width directly/);
});
test("scoped definitions retain expression safety and bounded work", () => {
  for (const source of [
    'value=import("bad")',
    "value=({a:1})",
    "value=1:10",
    "value=(other=3)",
    "constructor=3",
    "f(x)=f(x)",
    "f(evaluate)=1",
  ])
    assert.throws(() => context(source));
  const capped = createScopedCalca();
  for (let i = 0; i < 256; i++) capped(`v${i}=1`, { query: false });
  assert.throws(() => capped("lastValue=1"), /256 definitions/);
  const deep = createScopedCalca();
  for (let i = 0; i < 40; i++) deep(`v${i}=v${i + 1}+1`, { query: false });
  assert.throws(() => deep("v0"), /depth exceeds 32/);
  assert.equal(deep("2+2"), 4);
});
test("legacy and structured-block profiles retain reassignment and unscoped results", () => {
  const source =
    "# First\n\n```calca\nvalue=2\nvalue=3\n```\n\n# Second\n\nvalue =>";
  for (const profile of [undefined, CALCA_BLOCKS]) {
    const result = renderCalca(source, { profile });
    assert.deepEqual(result.diagnostics, []);
    assert.match(result.recalculatedSource, /value => 3/);
  }
  const scoped = render(source);
  assert.equal(scoped.diagnostics.length, 1);
  assert.equal(scoped.diagnostics[0].line, 5);
  assert.match(scoped.recalculatedSource, /value => value/);
});
test("indirect built-in function calls cannot bypass the shared expression allowlist", () => {
  for (const make of [createCalca, createScopedCalca]) {
    const run = make();
    run("g(x)=x", { query: false });
    run('f(g)=g("2+2")', { query: false });
    for (const name of [
      "evaluate",
      "parse",
      "compile",
      "config",
      "import",
      "map",
      "parser",
    ])
      assert.throws(() => run(`f(${name})`), /Reserved|Unsupported function/);
    run("count=4", { query: false });
    assert.equal(run("count+1"), 5);
    assert.equal(run("sin(pi/2)"), 1);
  }
});
