import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { recalculateOrg } from "../../src/formats/org/engine.js";
import { renderOrg } from "../../src/formats/org/index.js";
import {
  addOptions,
  dataRows,
  dumpTSV,
  emulateOrgPlot,
  gridData,
  gridDump,
  lispJSON,
  plotSets,
  radarAxes,
  orgPlot,
  pastedOrgPlots,
  plotKeywords,
  readLisp,
  sym,
} from "../../src/formats/org/plot.js";

const directory = new URL("../fixtures/org-plot/", import.meta.url);
const reference = JSON.parse(await readFile(new URL("reference.json", directory), "utf8"));
const fixtures = (await readdir(directory)).filter((name) => name.endsWith(".org")).sort();
const source = (name) => readFile(new URL(name, directory), "utf8");
// Each harness record names the table's first line; locate the same table here.
async function tablesOf(name, src) {
  src ??= await source(name);
  const lines = src.split("\n"), byLine = new Map();
  for (const { start, table } of recalculateOrg(src).tables) byLine.set(start + 1, { table, keywords: plotKeywords(lines, start) });
  return byLine;
}
// $Settings lines from org-plot's radar setup file: "axis" min max ticks.
const radarSettings = ({ setup }) =>
  [...setup.split("$Settings <<EOD\n")[1].matchAll(/^"(.*)" (\S+) (\S+) (\S+)$/gm)].map((m) => [m[1], Number(m[2]), Number(m[3]), Number(m[4])]);
const emacsMode = ({ options }) =>
  options.timeind ? "time" : options.textind || options.with === "histograms" ? "category" : options.ind === 0 ? "row" : "linear";
const emacsColumns = ({ plots }) => plots.map((line) => Number(/^using (?:\d+:)?(\d+)/.exec(line)[1]));
const sheetsWith = { lines: "line", points: "points", linespoints: "linespoints", steps: "steps", histograms: "bar", boxes: "bar", impulses: "bar" };
// Org columns differ from org-plot's data-file columns in marked tables, and
// org-plot's x-type check reads marker and cookie rows. Both are documented.
const KNOWN_DIFFERENCES = new Map([["marked.org:9", "marker column"], ["marked.org:19", "cookie row"]]);

test("the harness covers every org-plot fixture and its pasted variant", () => {
  assert.deepEqual(Object.keys(reference).filter((name) => !name.includes(".pasted")).sort(), fixtures);
  assert.ok(reference["inferred.pasted.org"].length >= 9);
});

test("org-plot emulation matches Emacs options, plot lines and data dumps for every fixture", async () => {
  for (const name of Object.keys(reference)) {
    const src = name.includes(".pasted") ? pastedOrgPlots(await source(name.replace(".pasted", "")), recalculateOrg(await source(name.replace(".pasted", ""))).tables) : undefined;
    const tables = await tablesOf(name, src);
    for (const record of reference[name]) {
      const where = `${name}:${record.line}`, { table, keywords } = tables.get(record.line);
      if (record.error) {
        assert.throws(() => emulateOrgPlot(table, keywords.native), { message: record.error }, where);
        continue;
      }
      const plot = emulateOrgPlot(table, keywords.native);
      const options = Object.fromEntries(Object.entries(plot.params).map(([key, value]) => [key, lispJSON(value)]));
      assert.deepEqual(options, record.options, where);
      assert.equal(plot.numCols, record.numCols, where);
      if (plot.type === "2d") {
        assert.deepEqual(plot.plots.map((p) => p.line), record.plots, where);
        const dump = dataRows(plot.rows);
        assert.equal(dumpTSV(dump.rows, dump.column), record.data, where);
      } else if (plot.type === "grid") {
        const grid = gridData(plot.rows, plot.params);
        assert.equal(gridDump(grid.matrix), record.data, where);
        assert.equal(grid.ylabels?.map(([n, label]) => `"${label}" ${n}`).join(", ") ?? null, record.ytics, where);
      } else if (plot.type === "radar") {
        const { axes, ticks } = radarAxes(plot.rows, plot.params);
        assert.deepEqual([...axes, axes[0]].map((a) => [a.label, a.min, a.max, ticks]), radarSettings(record), where);
      }
    }
  }
});

test("Sheets reads the same columns, x mode and style as org-plot when options are explicit", async () => {
  let compared = 0;
  for (const name of ["explicit.org", "quirks.org", "marked.org", "options.org"]) {
    const tables = await tablesOf(name);
    for (const record of reference[name]) {
      const where = `${name}:${record.line}`, { table, keywords } = tables.get(record.line);
      if (!keywords.native.length) {
        // Emacs ignores "#+PLOT:" without a space, and so does Sheets.
        assert.deepEqual(Object.keys(record.options).sort(), ["ind", "labels", "plot-type", "with"], where);
        assert.equal(renderOrg(await source(name)).diagnostics.filter((d) => d.line === keywords.malformed[0].line).length, 1);
        continue;
      }
      const plot = orgPlot(table, keywords, { rows: "all" });
      if (record.error || record.options["plot-type"] !== "2d" || record.options.line) {
        assert.ok(plot.error, where);
        continue;
      }
      assert.deepEqual(plot.inferred, [], where);
      const columns = emacsColumns(record);
      if (KNOWN_DIFFERENCES.get(where) === "marker column") {
        // org-plot names Org column 3, but its data file has only two columns.
        assert.deepEqual(columns, [3], where);
        assert.equal(record.data.split("\n")[0].split("\t").length, record.numCols - 1, where);
        assert.deepEqual(plot.deps, columns, where);
        assert.equal(dumpTSV(plot.rows, plot.marked), record.data, where);
        continue;
      }
      if (KNOWN_DIFFERENCES.get(where) === "cookie row") {
        // org-plot's x check sees "<r>" and switches to text; Sheets checks data rows.
        assert.equal(emacsMode(record), "category", where);
        assert.equal(plot.mode, "linear", where);
        assert.deepEqual(plot.deps, columns, where);
        continue;
      }
      assert.deepEqual(plot.deps, columns, where);
      assert.equal(plot.ind, record.options.ind, where);
      assert.equal(plot.mode, emacsMode(record), where);
      assert.equal(plot.spec.kind, sheetsWith[record.options.with], where);
      assert.equal(dumpTSV(plot.rows, plot.marked), record.data, where);
      assert.deepEqual(plot.spec.series.map((s) => s.label), record.plots.map((line) => /title '(.*)'$/.exec(line)[1]), where);
      compared++;
    }
  }
  assert.ok(compared >= 20);
});

test("pasting the inferred options makes Emacs plot the same data", async () => {
  const src = await source("inferred.org"),
    original = await tablesOf("inferred.org"),
    pasted = await tablesOf("inferred.pasted.org", pastedOrgPlots(src, recalculateOrg(src).tables));
  let compared = 0;
  for (const record of reference["inferred.pasted.org"]) {
    const where = `inferred:${record.line}`, { table, keywords } = original.get(record.line);
    const inferred = orgPlot(table, keywords);
    assert.ok(inferred.inferred.length, where);
    assert.deepEqual(inferred.deps, emacsColumns(record), where);
    assert.equal(inferred.ind, record.options.ind, where);
    assert.equal(inferred.mode, emacsMode(record), where);
    assert.equal(inferred.spec.kind, sheetsWith[record.options.with], where);
    // The only rows Sheets leaves out are the summary rows its caption names.
    const emacsRows = record.data.split("\n"), sheetsRows = dumpTSV(inferred.rows, inferred.marked).split("\n");
    assert.deepEqual(emacsRows.slice(0, sheetsRows.length), sheetsRows, where);
    assert.equal(emacsRows.length - sheetsRows.length, inferred.excluded ? 1 : 0, where);
    // Once pasted, nothing is left to infer and Sheets draws the same chart.
    const again = pasted.get(record.line), explicit = orgPlot(again.table, again.keywords);
    assert.deepEqual(explicit.inferred, [], where);
    assert.deepEqual({ ...explicit.spec, maxSeries: 0 }, { ...inferred.spec, maxSeries: 0 }, where);
    compared++;
  }
  assert.equal(compared, 9);
});

test("option parsing keeps org-plot's substring, merging and reader quirks", () => {
  assert.deepEqual(addOptions({}, "xmin:0"), { ymin: 0, xmin: 0 });
  assert.deepEqual(addOptions({}, "timeind:t ind:1"), { ind: sym("t"), timeind: sym("t") });
  assert.deepEqual(addOptions({}, 'title:"A, b. c" deps:(2 3) with:lines'), { title: "A, b. c", deps: [2, 3], with: sym("lines") });
  // set: is searched only after the last line: match, so this set: is lost.
  assert.deepEqual(addOptions({}, 'set:"grid" line:"a" set:"key off"'), { line: ["a"], set: ["key off"] });
  assert.deepEqual(addOptions({}, "ind:1.5"), { ind: 1 });
  assert.throws(() => readLisp(""), /End of file/);
  assert.deepEqual(readLisp('("a b" c 3)'), ["a b", sym("c"), 3]);
  const lines = ["#+PLOT: title:top", "#+NAME: t", "#+plot: title:near ind:1", "#+SHEETS_PLOT: kind:pie", "#+PLOT:ind:1", "| a | 1 |"];
  assert.deepEqual(plotKeywords(lines, 5), {
    native: [{ line: 3, text: "title:near ind:1" }, { line: 1, text: "title:top" }],
    sheets: [{ line: 4, text: "kind:pie" }],
    malformed: [{ line: 5 }],
  });
});

test("Org charts render after their table, report inference and redraw from recalculated values", () => {
  const src = "#+CONSTANTS: k=2\n#+PLOT: title:\"Doubled\"\n| x | y |\n|---+---|\n| 1 | 0 |\n| 2 | 0 |\n#+TBLFM: $2=$1*$k\n\nAfter.\n";
  const result = renderOrg(src);
  assert.match(result.html, /<\/table><\/div><figure class="chart">/);
  assert.match(result.html, /<figcaption><span class="chart-title">Doubled<\/span> <span class="chart-note">Inferred: ind:1 deps:\(2\) with:lines\.<\/span><\/figcaption>/);
  assert.ok(result.html.indexOf("<figure") < result.html.indexOf("After."));
  assert.deepEqual(result.diagnostics, [{ line: 2, severity: "info", message: "Inferred plot options: ind:1 deps:(2) with:lines. Add them to #+PLOT: so Emacs plots the same data." }]);
  assert.match(result.html, /<title>y · 2: 4<\/title>/);
  assert.match(renderOrg(src.replace("k=2", "k=5")).html, /<title>y · 2: 10<\/title>/);
  // Explicit options leave nothing to report.
  const explicit = renderOrg(src.replace('title:"Doubled"', "ind:1 deps:(2) with:lines"));
  assert.deepEqual(explicit.diagnostics, []);
  assert.doesNotMatch(explicit.html, /figcaption/);
});

test("unsupported plots are diagnosed and leave a visible note instead of a chart", () => {
  const result = renderOrg("#+PLOT: type:3d\n| 1 | 2 |\n\n#+PLOT: ind:9\n| 1 | 2 |\n\n#+PLOT: title:\"Words\"\n| a | b |\n");
  assert.deepEqual(result.diagnostics.map((d) => d.line), [1, 4, 7]);
  assert.equal((result.html.match(/chart-unavailable/g) || []).length, 3);
  assert.doesNotMatch(result.html, /<figure/);
});

test("plot keywords inside literal blocks, and tables without plots, draw nothing", () => {
  const { html, diagnostics } = renderOrg("#+BEGIN_SRC org\n#+PLOT: ind:1\n| 1 | 2 |\n#+END_SRC\n\n| 1 | 2 |\n");
  assert.doesNotMatch(html, /<figure/);
  assert.deepEqual(diagnostics, []);
});

test("hostile labels and titles stay escaped text", () => {
  const { html } = renderOrg('#+PLOT: title:"<img src=x onerror=alert(1)>"\n| <b>k</b> | "v" |\n|---+---|\n| <script> | 1 |\n| & | 2 |\n');
  assert.doesNotMatch(html, /<img|<script|<b>/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;script&gt;/);
});

test("documents draw at most 32 charts", () => {
  const block = "#+PLOT: ind:1 deps:(2) with:lines\n| 1 | 2 |\n| 2 | 3 |\n\n";
  const result = renderOrg(block.repeat(34));
  assert.equal((result.html.match(/<figure/g) || []).length, 32);
  assert.equal(result.diagnostics.length, 1);
  assert.match(result.diagnostics[0].message, /at most 32 charts/);
});

test("radar and grid charts use org-plot's own axes, ticks and matrix", async () => {
  for (const name of ["radar.org", "grid.org"]) {
    const tables = await tablesOf(name);
    for (const record of reference[name]) {
      const where = `${name}:${record.line}`, { table, keywords } = tables.get(record.line), plot = orgPlot(table, keywords);
      assert.ok(!plot.error, `${where}: ${plot.error}`);
      if (name === "radar.org") {
        assert.equal(plot.spec.kind, "radar");
        assert.deepEqual([...plot.spec.axes, plot.spec.axes[0]].map((a) => [a.label, a.min, a.max, plot.spec.ticks]), radarSettings(record), where);
        assert.deepEqual(plot.spec.series.map((s) => s.label), record.options.labels.slice(1), where);
      } else {
        assert.equal(plot.spec.kind, "heatmap");
        // Front-edge values of each column block are the matrix, column by column.
        const blocks = record.data.trim().split("\n\n"), matrix = [];
        for (let col = 0; col * 2 + 1 < blocks.length; col++)
          blocks[col * 2 + 1].split("\n").filter((_, i) => i % 2 === 0).forEach((line, row) => ((matrix[row] ||= [])[col] = Number(line.split(/\s+/)[2])));
        assert.deepEqual(plot.spec.series.map((s) => s.values), matrix, where);
        if (record.ytics) assert.deepEqual(plot.spec.series.map((s) => s.label), [...record.ytics.matchAll(/"([^"]*)"/g)].map((m) => m[1]), where);
      }
    }
  }
});

test("set: options apply in script order and unsupported ones are reported", () => {
  const notes = [];
  const sets = plotSets(["key off", "grid", "logscale y", "yrange [*:10]", "xlabel 'Quarter'", "title \"T\"", "style histogram rowstacked", "border 3", "key bottom right"], (m) => notes.push(m));
  assert.deepEqual(sets, { legend: "bottom", grid: true, log: true, yrange: [undefined, 10], xlabel: "Quarter", title: "T", stacked: true });
  assert.deepEqual(notes, ['set:"border 3" is not applied; Sheets draws its own axes and legend.']);
});

test("set:, bounds and ticks reach the chart spec", async () => {
  const tables = await tablesOf("options.org");
  const spec = (line) => orgPlot(tables.get(line).table, tables.get(line).keywords);
  const stacked = spec(5);
  assert.equal(stacked.spec.stacked, true);
  assert.equal(stacked.spec.legend, "bottom");
  assert.equal(stacked.spec.x.label, "Quarter");
  assert.equal(stacked.spec.y.label, "Revenue ($)");
  assert.equal(stacked.spec.title, "Stacked");
  assert.deepEqual(stacked.diagnostics.map((d) => d.message), ['set:"style fill solid" is not applied; Sheets draws its own style.']);
  const log = spec(12);
  assert.equal(log.spec.y.log, true);
  assert.equal(log.spec.grid, true);
  assert.equal(log.spec.legend, "none");
  const ranged = spec(20);
  assert.equal(ranged.spec.title, "From set");
  assert.deepEqual([ranged.spec.y.min, ranged.spec.y.max, ranged.spec.x.min, ranged.spec.x.max], [0, 50, 0, 10]);
  const bounded = spec(27);
  assert.deepEqual([bounded.spec.y.min, bounded.spec.y.max, bounded.spec.y.ticks, bounded.spec.x.min, bounded.spec.x.max], [0, 100, 4, -5, 15]);
  assert.deepEqual([spec(34).spec.y.min, spec(34).spec.y.max], [undefined, 10]);
  assert.equal(spec(41).file, "rates.svg");
});

test("a file: chart appears at its [[file:…]] link, or after its table without one", async () => {
  const { html } = renderOrg(await source("options.org"));
  const link = html.indexOf("where the document links its file:"), rates = html.indexOf("Chart: Rates");
  assert.ok(rates > link, "the Rates chart follows the link paragraph");
  assert.doesNotMatch(html, /href="rates\.svg"/);
  // The unlinked file: chart stays after its own table.
  assert.match(html, /<\/table><\/div><figure class="chart">(?:(?!<table).)*$/s);
  // A link before its table still receives the chart, and only once.
  const early = renderOrg('[[file:a.svg]]\n\n#+PLOT: ind:1 deps:(2) with:lines file:"a.svg"\n| 1 | 2 |\n| 2 | 3 |\n\n[[file:a.svg]]\n');
  assert.equal((early.html.match(/<figure/g) || []).length, 1);
  assert.ok(early.html.indexOf("<figure") < early.html.indexOf("<table"));
  assert.match(early.html, /href="a\.svg"/);
});
