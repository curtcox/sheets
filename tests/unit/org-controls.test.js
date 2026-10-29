import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderOrg, renderOrgWithInputs } from "../../src/formats/org/index.js";
import { loadOrgInputs } from "../../src/formats/org/inputs.js";
import { recalculateOrg } from "../../src/formats/org/engine.js";
import {
  applyControlEdit,
  controlText,
  shiftControls,
  sliderBounds,
  sliderText,
  CONTROL_LIMITS,
} from "../../src/controls.js";
import { readURL, writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";

const fixture = () => readFile(new URL("../fixtures/org/controls.org", import.meta.url), "utf8");
const rows = (result) => result.tables.flatMap(({ table }) => table.rows);
const control = (result, name) => result.controls.find((item) => item.id === `org-constant:${name}`);
const set = (src, item, value) => applyControlEdit(src, item.edit, controlText(item, value));

test("control keywords are inert: results match Emacs with and without them", async () => {
  const src = await fixture(),
    reference = JSON.parse(await readFile(new URL("../fixtures/org/reference.json", import.meta.url), "utf8")),
    stripped = src.split("\n").filter((line) => !/^#\+SHEETS_CONTROL:/i.test(line)).join("\n");
  for (const profile of [undefined, "org-emacs-v1"]) {
    const result = recalculateOrg(src, { profile });
    assert.deepEqual(rows(result), reference["controls.org"]);
    assert.deepEqual(rows(result), rows(recalculateOrg(stripped, { profile })));
    assert.deepEqual(result.diagnostics, []);
    assert.equal(result.source.split("\n").filter((line) => line.startsWith("#+SHEETS_CONTROL:")).length, 4);
  }
});

test("constant controls describe kinds, labels and exact source spans", async () => {
  const result = renderOrg(await fixture());
  assert.deepEqual(result.controls.map(({ id, kind, label, value, line }) => [id, kind, label, value, line]), [
    ["org-constant:price", "slider", "Monthly price ($)", "25", 3],
    ["org-constant:annual", "checkbox", "Bill annually", "1", 4],
    ["org-constant:users", "text", "$users", "120", 5],
    ["org-constant:rate", "slider", "$rate", "0.035", 6],
  ]);
  assert.deepEqual(control(result, "price").edit, { line: 2, column: 19, length: 2, text: "25" });
  assert.deepEqual(control(result, "rate").edit, { line: 2, column: 46, length: 5, text: "0.035" });
  assert.deepEqual([control(result, "rate").min, control(result, "rate").max, control(result, "rate").step], ["0", "0.1", "0.005"]);
  assert.match(result.html, /<input type="range" data-control="org-constant:price" min="5" max="100" step="5" value="25">/);
  assert.match(result.html, /<input type="checkbox" data-control="org-constant:annual" checked>/);
  assert.match(result.html, /<input type="text" data-control="org-constant:users" value="120"[^>]*inputmode="decimal"/);
  // Controls render where they are declared, before the table.
  assert.ok(result.html.indexOf('data-control="org-constant:rate"') < result.html.indexOf('aria-label="Org table"'));
  assert.equal((result.html.match(/data-control="/g) || []).length, 4);
  assert.ok(!result.html.includes("SHEETS_CONTROL"));
});

test("writing a control changes only its value and recalculates like a hand edit", async () => {
  let src = await fixture();
  const first = renderOrg(src);
  // As in the app: spans after an edited token on the same line move with it.
  let controls = first.controls;
  const write = (name, value) => {
    const item = controls.find((entry) => entry.id === `org-constant:${name}`),
      text = controlText(item, value);
    src = applyControlEdit(src, item.edit, text);
    controls = shiftControls(controls, item.edit, text);
  };
  write("price", "47");
  assert.equal(src.split("\n")[1], "#+CONSTANTS: price=45 annual=1 users=120 rate=0.035");
  write("annual", false);
  write("users", " 1000 ");
  write("rate", "0.0349999");
  assert.equal(controls.find((entry) => entry.id === "org-constant:rate").edit.column, 47);
  const expected = (await fixture()).replace("price=25 annual=1 users=120 rate=0.035", "price=45 annual=0 users=1000 rate=0.035");
  assert.equal(src, expected);
  assert.deepEqual(rows(recalculateOrg(src)), rows(recalculateOrg(expected)));
  assert.deepEqual(rows(recalculateOrg(src))[1], ["#", "45000", "1575.00"]);
  assert.throws(() => set(src, control(first, "price"), "50"), /source changed/);
});

test("slider text snaps to the declared grid with exact decimals", () => {
  const rate = sliderBounds("0", "0.1", "0.005");
  assert.equal(sliderText(rate, "0.030000000000000002"), "0.030");
  assert.equal(sliderText(rate, "1"), "0.100");
  assert.equal(sliderText(rate, "-4"), "0.000");
  assert.equal(sliderText(sliderBounds("-10", "10", "0.5"), "-0.2"), "0.0");
  assert.equal(sliderText(sliderBounds("0", "10", "3"), "10"), "9");
  assert.equal(sliderText(sliderBounds("1", "5"), "2.6"), "3");
  for (const [args, message] of [
    [["5", "5"], /less than/],
    [["0", "1", "0"], /greater than zero/],
    [["0", "1e3"], /decimal number/],
    [["0", "2000000", "1"], /at most 1,000,000 steps/],
  ])
    assert.throws(() => sliderBounds(...args), message);
  assert.throws(() => sliderText(rate, "abc"), /number/);
});

test("text and checkbox input is validated before it reaches the source", () => {
  const src = "#+CONSTANTS: users=120 on=0\n#+SHEETS_CONTROL: users text\n#+SHEETS_CONTROL: on checkbox\n",
    result = renderOrg(src),
    users = control(result, "users");
  for (const value of ["", "12 000", "1,000", "abc", "1\n2", "9".repeat(CONTROL_LIMITS.text + 1)])
    assert.throws(() => controlText(users, value), value);
  assert.equal(controlText(control(result, "on"), true), "1");
  assert.equal(controlText(control(result, "on"), false), "0");
  assert.match(result.html, /data-control="org-constant:on">/);
});

test("invalid controls report source-line diagnostics and render nothing", () => {
  const cases = [
    ["missing slider", "#+SHEETS_CONTROL: price slider", /need a range/],
    ["unknown kind", "#+SHEETS_CONTROL: price dial", /Unsupported control kind dial/],
    ["date kind", "#+SHEETS_CONTROL: price date", /Date controls need Org date arithmetic/],
    ["field", "#+SHEETS_CONTROL: @2$1 text", /Table-field controls are not supported yet/],
    ["shared", "#+SHEETS_CONTROL: base.price text", /Shared inputs are read-only/],
    ["undefined", "#+SHEETS_CONTROL: missing text", /No file constant \$missing/],
    ["range on text", "#+SHEETS_CONTROL: price text 0..1", /Text controls take no range/],
    ["bad option", "#+SHEETS_CONTROL: price slider 0..9 width 3", /Unexpected control option width/],
    ["open label", '#+SHEETS_CONTROL: price text label "Price', /Close the quoted label/],
    ["long label", `#+SHEETS_CONTROL: price text label "${"x".repeat(201)}"`, /limited to 200/],
    ["checkbox value", "#+SHEETS_CONTROL: price checkbox", /needs the value 0 or 1/],
    ["empty", "#+SHEETS_CONTROL:", /Use SHEETS_CONTROL/],
  ];
  for (const [name, line, message] of cases) {
    const result = renderOrg(`#+CONSTANTS: price=25\n${line}\n`);
    assert.equal(result.controls.length, 0, name);
    assert.equal(result.diagnostics.length, 1, name);
    assert.equal(result.diagnostics[0].line, 2, name);
    assert.match(result.diagnostics[0].message, message, name);
    assert.ok(!result.html.includes("data-control"), name);
  }
  const duplicate = renderOrg("#+CONSTANTS: price=25\n#+SHEETS_CONTROL: price text\n| 0 |\n#+SHEETS_CONTROL: price slider 0..9\n");
  assert.deepEqual(duplicate.controls.map(({ kind }) => kind), ["text"]);
  assert.deepEqual(duplicate.diagnostics, [
    { line: 4, message: "SHEETS_CONTROL: Duplicate control for $price; the first one is used." },
  ]);
  const outside = renderOrg("#+CONSTANTS: price=250\n#+SHEETS_CONTROL: price slider 0..100\n");
  assert.equal(outside.controls.length, 1);
  assert.deepEqual(outside.diagnostics, [
    { line: 2, severity: "warning", message: "$price = 250 is outside the slider range 0..100." },
  ]);
  const unsupported = renderOrg("#+CONSTANTS: price=a\n#+SHEETS_CONTROL: price text\n");
  assert.match(unsupported.diagnostics.at(-1).message, /not a supported numeric constant/);
});

test("controls obey AST ownership, last-declaration precedence and the control limit", () => {
  for (const kind of ["SRC org", "EXAMPLE", "EXPORT html", "COMMENT"]) {
    const src = `#+CONSTANTS: price=1\n#+BEGIN_${kind}\n#+SHEETS_CONTROL: price text\n#+END_${kind.split(" ")[0]}\n`;
    assert.deepEqual(renderOrg(src).controls, [], kind);
  }
  const later = renderOrg("#+CONSTANTS: price=1 price=2\n#+sheets_control: price TEXT\n#+CONSTANTS: price=3\n");
  assert.deepEqual(control(later, "price").edit, { line: 3, column: 19, length: 1, text: "3" });
  const names = Array.from({ length: CONTROL_LIMITS.controls + 1 }, (_, i) => `c${i}`),
    many = renderOrg(`#+CONSTANTS: ${names.map((name) => `${name}=1`).join(" ")}\n${names.map((name) => `#+SHEETS_CONTROL: ${name} checkbox`).join("\n")}\n`);
  assert.equal(many.controls.length, CONTROL_LIMITS.controls);
  assert.match(many.diagnostics.at(-1).message, /at most 64 controls/);
});

test("labels and values are escaped, and BOM/CRLF sources keep exact edit offsets", () => {
  const hostile = renderOrg('#+CONSTANTS: x=1\n#+SHEETS_CONTROL: x checkbox label "<img src=x onerror=alert(1)>"\n');
  assert.ok(hostile.html.includes("&lt;img src=x onerror=alert(1)&gt;"));
  const src = "﻿#+CONSTANTS: price=25\r\n#+SHEETS_CONTROL: price slider 0..100\r\n| 0 |\r\n#+TBLFM: $1=$price*2\r\n",
    result = renderOrg(src),
    next = set(src, control(result, "price"), "60");
  assert.equal(next, src.replace("price=25", "price=60"));
  assert.deepEqual(rows(recalculateOrg(next)), [["120"]]);
});

test("control values are ordinary source, so links and saved documents keep the scenario", async () => {
  const src = set(await fixture(), control(renderOrg(await fixture()), "price"), "80");
  assert.equal(readURL(writeURL("https://curtcox.github.io/sheets/", { src, format: "org" })).src, src);
  const saved = HashBinDocuments.parse(HashBinDocuments.serialize({ src, type: "org", view: "preview" }));
  assert.equal(saved.src, src);
  assert.equal(control(renderOrg(saved.src), "price").value, "80");
});

test("gallery what-if models answer the questions their prose poses", async () => {
  const example = (name) => readFile(new URL(`../../examples/org/${name}.org`, import.meta.url), "utf8");
  // Move controls exactly as the preview does, then read labelled result rows.
  const scenario = async (src, values = {}) => {
    let controls = renderOrg(src).controls;
    for (const [name, value] of Object.entries(values)) {
      const item = controls.find((entry) => entry.id === `org-constant:${name}`),
        text = controlText(item, value);
      src = applyControlEdit(src, item.edit, text);
      controls = shiftControls(controls, item.edit, text);
    }
    const result = recalculateOrg(src, { inputs: await loadOrgInputs(src) });
    assert.deepEqual(result.diagnostics, []);
    return (label, column = 1) => Number(rows(result).find((row) => row[0] === label)[column]);
  };
  for (const name of ["what-if", "mortgage", "hire"]) {
    const kinds = renderOrg(await example(name)).controls.map(({ kind }) => kind);
    assert.deepEqual(new Set(kinds), new Set(["slider", "checkbox", "text"]), name);
  }

  const billing = await example("what-if"), lead = "Annual minus monthly";
  assert.ok((await scenario(billing, { churn: "3" }))(lead) < 0);
  assert.ok((await scenario(billing, { churn: "3.5" }))(lead) > 0);
  assert.ok((await scenario(billing, { free: false }))(lead) > 0);
  assert.equal((await scenario(billing, { users: "800" }))("Annual, paid up front"), 2 * (await scenario(billing))("Annual, paid up front"));

  const house = await example("mortgage"), base = await scenario(house), pmi = "Mortgage insurance (under 20% down)";
  assert.ok(base(pmi) > 0);
  assert.equal((await scenario(house, { down: "20" }))(pmi), 0);
  const shorter = await scenario(house, { years: "15" });
  assert.ok(Math.abs(shorter("Monthly payment") - base("Monthly payment") - 970) < 5);
  assert.ok(shorter("Total interest") < base("Total interest") / 2);
  const quote = await scenario(house, { escrow: false });
  assert.equal(quote("Property tax") + quote("Home insurance"), 0);
  assert.equal(base("0", 2), base("Principal and interest"));

  const hire = await example("hire");
  assert.match((await renderOrgWithInputs(hire)).html, /Shared inputs/);
  const ratio = async (values) => {
    const at = await scenario(hire, values);
    return at("Total", 1) / at("Total", 2);
  };
  assert.ok((await ratio({ start: "11" })) > (await ratio({ start: "1" })));
  assert.ok((await ratio({ agency: false })) < (await ratio({})));
  const even = (await scenario(hire))("Break-even contractor rate ($ an hour)"),
    year = await scenario(hire, { hourly: String(even) });
  // The rate is rounded to cents: within half a cent over 30 hours for 46 weeks.
  assert.ok(Math.abs(year("Contractor at this rate and these hours") - year("Employee pay, benefits and tax")) <= 30 * 46 * 0.005);
});
