import { test } from "node:test";
import assert from "node:assert/strict";
import { createCalca } from "../../src/formats/calca/engine.js";
import { renderCalca } from "../../src/formats/calca/index.js";

function calculate(...lines) {
  const run = createCalca();
  return lines.map((line) => run(line));
}
test("Calca solves linear equations, implicit multiplication and both sides", () => {
  assert.equal(calculate("2x + 3 = x + 11", "x").at(-1), 8);
  assert.equal(calculate("3 * (x - 2) / 2 = 9", "x").at(-1), 8);
  assert.equal(calculate("sqrt(9)*x = 12", "x").at(-1), 4);
  assert.equal(calculate("pi*x = 2*pi", "x").at(-1), 2);
});
test("Calca expands definitions and solves a definition in reverse", () => {
  assert.equal(
    calculate("tempF = 1.8*tempC + 32", "tempF = 212", "tempC").at(-1),
    100,
  );
  assert.equal(
    calculate("double = 2*x", "total = double+3", "total = 11", "x").at(-1),
    4,
  );
  assert.equal(calculate("total = 2*x+3", "x = 4", "total").at(-1), 11);
});
test("Calca uses current explicit values and the latest usable equation", () => {
  assert.equal(calculate("rate=2", "rate*x=10", "x", "rate=5", "x").at(-1), 2);
  assert.equal(calculate("x+1=4", "x+1=9", "x").at(-1), 8);
  assert.equal(calculate("x+1=4", "x^3=8", "x").at(-1), 3);
  assert.equal(calculate("x+1=4", "x=20", "x").at(-1), 20);
});
test("Calca returns sorted distinct real roots and handles degeneracy", () => {
  const pair = calculate("x^2-5*x+6=0", "x").at(-1);
  assert.ok(Math.abs(pair[0] - 2) < 1e-12 && Math.abs(pair[1] - 3) < 1e-12);
  assert.deepEqual(calculate("x^2=4", "x").at(-1), [-2, 2]);
  assert.equal(calculate("x^2-4*x+4=0", "x").at(-1), 2);
  assert.equal(calculate("0*x^2+2*x=8", "x").at(-1), 4);
  assert.deepEqual(calculate("x^2+1=0", "x").at(-1), []);
  assert.deepEqual(calculate("x=x+1", "x").at(-1), []);
  assert.throws(() => calculate("x=x", "x"), /Infinitely many solutions/);
});
test("Calca avoids cancellation and overflow in quadratic roots", () => {
  const [small, large] = calculate("x^2-1e16*x+1=0", "x").at(-1);
  assert.ok(Math.abs(small / 1e-16 - 1) < 1e-12);
  assert.ok(Math.abs(large / 1e16 - 1) < 1e-12);
  const result = calculate("1e200*x^2-5e200*x+6e200=0", "x").at(-1);
  assert.ok(Math.abs(result[0] - 2) < 1e-12 && Math.abs(result[1] - 3) < 1e-12);
  assert.equal(calculate("1e-20*x=2e-20", "x").at(-1), 2);
  assert.throws(() => calculate("x^2+1e-200*x=0", "x"), /numeric precision/);
  assert.throws(
    () => calculate("1e-300*x^2+1e300*x+1=0", "x"),
    /numeric precision/,
  );
});
test("Calca does not silently choose one of multiple roots in expressions", () => {
  assert.throws(
    () => calculate("x^2=4", "x+1"),
    /2 real solutions; query x directly/,
  );
  assert.throws(() => calculate("x^2+1=0", "x+1"), /0 real solutions/);
  assert.equal(calculate("x+1=4", "x+10").at(-1), 13);
});
test("Calca reports unsupported equations without treating them as solutions", () => {
  for (const equation of [
    "x^3=8",
    "sin(x)+1=1",
    "1/x=2",
    "x^0.5=2",
    "x + unknown=2",
    "x*1 km=2 km",
  ])
    assert.throws(
      () => calculate(equation, "x"),
      /polynomials only|Undefined symbol/,
    );
  assert.throws(
    () => calculate("x^3=8", "missing+3"),
    /Undefined symbol missing/,
  );
});
test("Calca keeps functions, matrices, comparisons, strings and units", () => {
  assert.equal(
    calculate("price=24", "tax=.08", "f(x)=x*(1+tax)", "f(price)").at(-1),
    25.92,
  );
  assert.equal(calculate('label="a=b"', "label").at(-1), "a=b");
  assert.equal(calculate("2==2").at(-1), true);
  assert.equal(calculate("2<=3").at(-1), true);
  const result = renderCalca("5 km in m =>\n[1,2;3,4]*[2;1] =>");
  assert.equal(result.diagnostics.length, 0);
  assert.match(result.recalculatedSource, /5000 m/);
  assert.match(result.recalculatedSource, /\[\[4\], \[10\]\]/);
});
test("Calca equations retain expression security guards on both sides", () => {
  for (const line of [
    "x.foo=2",
    'x=import("bad")',
    "x=({a:1})",
    "x=1:100",
    "constructor=x",
    "x=(y=3)",
    "x=1=2",
  ])
    assert.throws(() => calculate(line));
});
test("Calca bounds circular definitions, equation count and expansion", () => {
  assert.throws(
    () =>
      calculate(
        "leftValue=rightValue+1",
        "rightValue=leftValue+1",
        "leftValue",
      ),
    /Circular|Infinitely|0 real solutions/,
  );
  const run = createCalca();
  for (let i = 0; i < 256; i++) run("x+1=2");
  assert.throws(() => run("x+2=3"), /256 equations/);
  const deep = createCalca();
  deep("v0=x");
  for (let i = 1; i < 40; i++) deep(`v${i}=v${i - 1}+1`);
  deep("v39=100");
  assert.throws(() => deep("x"), /complex|deep/);
  const branching = createCalca();
  branching("v0=seedValue");
  branching("v1=seedValue");
  for (let i = 2; i < 25; i++) branching(`v${i}=v${i - 1}+v${i - 2}`);
  branching("seedValue=1");
  assert.throws(() => branching("v24"), /too complex/);
  assert.equal(branching("2+2"), 4);
});
test("Calca diagnostics identify the query line, continue, and reset each render", () => {
  const source = "```calca\nx^3=8\nx =>\n2+2 =>\n```";
  const result = renderCalca(source);
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].line, 3);
  assert.match(result.recalculatedSource, /2\+2 => 4/);
  assert.equal(renderCalca("```\nx+1=4\nx =>\n```").diagnostics.length, 0);
  assert.match(
    renderCalca("x =>").diagnostics[0].message,
    /Undefined symbol x/,
  );
});
