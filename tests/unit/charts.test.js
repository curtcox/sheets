import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CHART_LIMITS,
  CHART_PALETTE,
  CHART_RAMP,
  CHART_STYLES,
  chartFigure,
  chartSVG,
  formatNumber,
  niceTicks,
  timeTicks,
} from "../../src/charts.js";

const bars = (overrides = {}) =>
  chartSVG({
    kind: "bar",
    title: "Revenue",
    x: { type: "category", label: "Quarter", values: ["Q1", "Q2"] },
    series: [
      { label: "North", values: [120, 140], text: ["120", "140"] },
      { label: "South", values: [90, 110], text: ["90", "110"] },
    ],
    ...overrides,
  });

test("ticks use 1-2-5 steps and numbers group thousands", () => {
  assert.deepEqual(niceTicks(0, 250).ticks, [0, 50, 100, 150, 200, 250]);
  assert.deepEqual(niceTicks(0, 1).ticks, [0, 0.2, 0.4, 0.6, 0.8, 1]);
  assert.deepEqual(niceTicks(3, 97, 5).ticks, [0, 20, 40, 60, 80, 100]);
  assert.deepEqual(niceTicks(1, 3, 6, { integer: true }).ticks, [1, 2, 3]);
  assert.deepEqual(niceTicks(5, 5).ticks.length > 1, true);
  assert.deepEqual(niceTicks(0, 20, 5, { fixedMin: true, fixedMax: true }), { min: 0, max: 20, step: 5, ticks: [0, 5, 10, 15, 20] });
  assert.equal(formatNumber(1234567, 1), "1,234,567");
  assert.equal(formatNumber(-1500.5, 0.5), "-1,500.5");
  assert.equal(formatNumber(0.30000000000000004), "0.3");
  assert.equal(formatNumber(2021, 1, { group: false }), "2021");
  assert.equal(formatNumber(2e20), "2e+20");
  assert.equal(formatNumber(-0, 1), "0");
});

test("time axes choose day, month or year ticks in UTC", () => {
  const day = 864e5, start = Date.UTC(2024, 0, 1);
  assert.deepEqual(timeTicks(start, start + 6 * day).slice(0, 2).map((t) => t.label), ["Jan 1", "Jan 2"]);
  assert.deepEqual(timeTicks(start, Date.UTC(2024, 4, 1)).map((t) => t.label), ["Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024"]);
  assert.deepEqual(timeTicks(start, Date.UTC(2034, 0, 1)).map((t) => t.label), ["2024", "2026", "2028", "2030", "2032", "2034"]);
});

test("bar charts are accessible static SVG with one tooltip per mark", () => {
  const { svg, summary, diagnostics } = bars();
  assert.deepEqual(diagnostics, []);
  assert.match(svg, /^<svg class="chart-svg chart-kind-bar" viewBox="0 0 640 360" role="img"><title>Revenue<\/title><desc>/);
  assert.equal(summary, "Bar chart of North, South, 2 categories of Quarter; values from 90 to 140.");
  assert.equal((svg.match(/<rect class="chart-bar"/g) || []).length, 4);
  assert.match(svg, /<title>North · Q1: 120<\/title>/);
  assert.match(svg, /class="chart-legend"/);
  assert.doesNotMatch(svg, /style=|<script|on[a-z]+=|fill="#/);
  // Bars always include zero.
  assert.match(svg, />0<\/text>/);
  for (const size of ["small", "wide"]) assert.match(bars({ size }).svg, size === "small" ? /viewBox="0 0 640 480"/ : /viewBox="0 0 840 360"/);
});

test("one series has no legend and labels the y axis instead", () => {
  const { svg } = chartSVG({ kind: "line", x: { type: "linear", values: [1, 2, 3] }, series: [{ label: "Users", values: [5, null, 7] }] });
  assert.doesNotMatch(svg, /chart-legend/);
  assert.match(svg, /class="chart-axis-title"[^>]*transform="rotate\(-90[^"]*"><title>Users<\/title>|class="chart-axis-title"[^>]*>Users</);
  // A gap splits the line; the marker count matches the numeric values.
  assert.equal((svg.match(/<path class="chart-marker"/g) || []).length, 2);
  assert.match(svg, /<path class="chart-line" d="M[\d.]+ [\d.]+M[\d.]+ [\d.]+"\/>/);
});

test("lines include zero only for small non-negative minimums; steps draw horizontal then vertical", () => {
  const lows = (values) => chartSVG({ kind: "line", x: { type: "linear", values: [1, 2] }, series: [{ label: "a", values }] }).svg;
  assert.match(lows([10, 100]), />0<\/text>/);
  assert.doesNotMatch(lows([80, 100]), />0<\/text>/);
  const { svg } = chartSVG({ kind: "steps", x: { type: "linear", values: [0, 10] }, series: [{ label: "p", values: [10, 8] }] });
  assert.match(svg, /d="M[\d.]+ [\d.]+H[\d.]+V[\d.]+"/);
});

test("many categories rotate and long labels are truncated with the full text kept", () => {
  const values = Array.from({ length: 13 }, (_, i) => `Category number ${i} with a long name`);
  const { svg } = chartSVG({ kind: "bar", x: { type: "category", values }, series: [{ label: "v", values: values.map((_, i) => i) }] });
  assert.match(svg, /transform="rotate\(-45 /);
  assert.match(svg, /<title>Category number 0 with a long name<\/title>Category number 0 with a l…|…<\/text>/);
});

test("limits truncate with diagnostics instead of failing", () => {
  const values = Array.from({ length: 1500 }, (_, i) => i);
  const result = chartSVG({ kind: "line", x: { type: "linear", values }, series: [{ label: "a", values }, { label: "b", values }] });
  assert.equal(result.diagnostics.length, 1);
  assert.match(result.diagnostics[0].message, /at most 2,000 points; only the first 1,000 rows/);
  assert.ok((result.svg.match(/chart-hit/g) || []).length <= CHART_LIMITS.points);
  const many = chartSVG({ kind: "bar", x: { values: ["a"] }, series: Array.from({ length: 14 }, (_, i) => ({ label: `s${i}`, values: [i] })) });
  assert.match(many.diagnostics[0].message, /first 12 of 14 series/);
  assert.match(many.svg, /chart-s1 chart-alt/);
  const label = "x".repeat(300), long = chartSVG({ kind: "bar", title: label, x: { values: [label] }, series: [{ label, values: [1] }] });
  assert.ok(!long.svg.includes("x".repeat(CHART_LIMITS.label + 1)));
});

test("logarithmic axes leave non-positive values as gaps with a diagnostic", () => {
  const result = chartSVG({ kind: "line", y: { log: true }, x: { type: "linear", values: [1, 2, 3] }, series: [{ label: "a", values: [1, 0, 1000] }] });
  assert.match(result.diagnostics[0].message, /logarithmic axis cannot show 1 zero or negative value/);
  assert.match(result.svg, />1,000<\/text>/);
});

test("hostile labels are escaped in text, titles and the figure caption", () => {
  const hostile = '<img src=x onerror="alert(1)">&';
  const { svg } = chartSVG({ kind: "bar", title: hostile, x: { values: [hostile] }, series: [{ label: hostile, values: [1], text: [hostile] }] });
  const html = chartFigure({ svg, title: hostile, note: hostile });
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;&amp;/);
  assert.match(html, /^<figure class="chart"><div class="chart-scroll" role="region" aria-label="Chart: &lt;img/);
});

// WCAG relative luminance and Machado et al. (2009) full-severity simulations.
const linear = (c) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const rgb = (hex) => [1, 3, 5].map((i) => linear(Number.parseInt(hex.slice(i, i + 2), 16)));
const luminance = (hex) => rgb(hex).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
const SIMULATIONS = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
function lab([r, g, b]) {
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const [x, y, z] = [(0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883].map(f);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

test("the palette has 3:1 contrast on white and stays distinguishable with color-vision deficiencies", () => {
  for (const color of CHART_PALETTE) assert.ok(1.05 / (luminance(color) + 0.05) >= 3, color);
  for (const [name, matrix] of Object.entries(SIMULATIONS)) {
    const seen = CHART_PALETTE.map((color) => lab(matrix.map((row) => Math.min(1, Math.max(0, row.reduce((sum, k, i) => sum + k * rgb(color)[i], 0))))));
    for (let i = 0; i < seen.length; i++)
      for (let j = i + 1; j < seen.length; j++) {
        const distance = Math.hypot(...seen[i].map((v, k) => v - seen[j][k]));
        assert.ok(distance >= 20, `${name}: ${CHART_PALETTE[i]} and ${CHART_PALETTE[j]} differ by ${distance.toFixed(1)}`);
      }
  }
});

test("app and export styles define the same palette and mark classes", async () => {
  const css = await readFile(new URL("../../src/styles.css", import.meta.url), "utf8");
  for (const [i, color] of CHART_PALETTE.entries()) {
    assert.ok(css.includes(`--chart-${i + 1}: ${color};`), color);
    assert.ok(CHART_STYLES.includes(`--chart-${i + 1}:${color}`), color);
    assert.ok(css.includes(`.chart-s${i + 1} { --chart-color: var(--chart-${i + 1}); }`));
  }
  for (const selector of [".chart-bar", ".chart-line", ".chart-marker", ".chart-hit", ".chart-area", ".chart-grid line", ".chart-axis line", ".chart-alt .chart-line", ".chart-scroll", ".chart-svg"])
    assert.ok(css.includes(selector) && CHART_STYLES.includes(selector), selector);
});

test("stacked and horizontal bars stack by sign and swap axes", () => {
  const stacked = bars({ stacked: true, series: [{ label: "a", values: [2, 3] }, { label: "b", values: [-1, 4] }] });
  assert.match(stacked.summary, /^Bar chart \(stacked\)/);
  const horizontal = chartSVG({ kind: "bar", horizontal: true, x: { values: ["Rent", "Food"] }, series: [{ label: "Spent", values: [1200, 300] }] });
  assert.match(horizontal.summary, /\(horizontal\)/);
  const [rent, food] = [...horizontal.svg.matchAll(/<rect class="chart-bar" x="[\d.]+" y="[\d.]+" width="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.ok(rent > 3 * food);
});

test("radar and heatmap charts label every axis, cell and color step", () => {
  const radar = chartSVG({
    kind: "radar",
    ticks: 4,
    axes: [{ label: "a", min: 0, max: 4 }, { label: "b", min: 0, max: 4 }, { label: "c", min: 0, max: 4 }],
    x: { values: ["a", "b", "c"] },
    series: [{ label: "One", values: [1, 2, 3] }, { label: "Two", values: [4, 3, 2] }],
  });
  assert.equal((radar.svg.match(/<path class="chart-marker"/g) || []).length, 6);
  assert.equal((radar.svg.match(/<g class="chart-grid"><path/g) || []).length, 1);
  assert.match(radar.svg, /<title>Two · a: 4<\/title>/);
  assert.match(radar.summary, /^Radar chart of One, Two over 3 axes \(a 0 to 4/);
  const heat = chartSVG({ kind: "heatmap", x: { values: ["9am", "noon"] }, series: [{ label: "Mon", values: [1, null] }, { label: "Tue", values: [5, 9] }] });
  assert.equal((heat.svg.match(/<rect class="chart-cell/g) || []).length, 4);
  assert.match(heat.svg, /class="chart-cell chart-q1"/);
  assert.match(heat.svg, /class="chart-cell chart-q9"/);
  assert.match(heat.svg, /class="chart-cell chart-cell-empty"/);
  assert.match(heat.svg, /<title>Tue · noon: 9<\/title>/);
  assert.equal((heat.svg.match(/<rect class="chart-q\d"/g) || []).length, 9);
  for (let i = 1; i < CHART_RAMP.length; i++) assert.ok(luminance(CHART_RAMP[i]) < luminance(CHART_RAMP[i - 1]), CHART_RAMP[i]);
});

test("set grid adds vertical lines at the x ticks", () => {
  const plain = chartSVG({ kind: "line", x: { type: "linear", values: [0, 10] }, series: [{ label: "a", values: [1, 2] }] }).svg;
  const grid = chartSVG({ kind: "line", grid: true, x: { type: "linear", values: [0, 10] }, series: [{ label: "a", values: [1, 2] }] }).svg;
  const count = (svg) => (svg.match(/<g class="chart-grid">(.*?)<\/g>/)[1].match(/<line/g) || []).length;
  assert.ok(count(grid) > count(plain));
});

test("a tick count between fixed bounds divides the axis exactly", () => {
  const { svg } = chartSVG({ kind: "points", y: { min: 0, max: 100, ticks: 4 }, x: { type: "linear", values: [0, 5] }, series: [{ label: "y", values: [20, 60] }] });
  for (const label of ["0", "25", "50", "75", "100"]) assert.match(svg, new RegExp(`>${label}</text>`));
});

test("bar charts can draw a series as a line over the bars", () => {
  const { svg, summary } = chartSVG({
    kind: "bar",
    x: { values: ["a", "b", "c"] },
    series: [
      { label: "In", values: [5, 6, 7] },
      { label: "Out", values: [2, 3, 9] },
      { label: "Net", line: true, values: [3, 3, -2] },
    ],
  });
  assert.equal((svg.match(/<rect class="chart-bar"/g) || []).length, 6);
  assert.match(svg, /<g class="chart-series chart-overlay chart-s3"><path class="chart-line" d="M[^"]+L[^"]+L[^"]+"\/>/);
  assert.equal((svg.match(/chart-overlay[^]*?<\/g>/)[0].match(/chart-marker/g) || []).length, 3);
  assert.match(summary, /^Bar chart of In, Out with a line for Net, 3 categories; values from -2 to 9\.$/);
  // The legend shows a line swatch for the overlay and boxes for the bars.
  const legend = /<g class="chart-legend">[^]*$/.exec(svg)[0];
  assert.equal((legend.match(/chart-swatch/g) || []).length, 2);
  assert.match(legend, /<g class="chart-s3"><path class="chart-line"/);
});
