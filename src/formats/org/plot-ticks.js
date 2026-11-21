import { HLINE, sym, wrongType } from "./plot-lisp.js";

// org--plot/values-stats, org--plot/sensible-tick-num and their helpers, ported
// exactly (including Emacs's round-half-even), so radar axes match org-plot.
export function stringToNumber(text) {
  const match = /^[ \t\n]*([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/i.exec(text ?? "");
  return match ? Number(match[1]) : 0;
}
const roundEven = (v) => {
  const r = Math.round(v);
  return Math.abs(v % 1) === 0.5 && r % 2 ? r - 1 : r;
};
export function valuesStats(nums, hardMin, hardMax) {
  const minimum = hardMin ?? Math.min(...nums), maximum = hardMax ?? Math.max(...nums), range = maximum - minimum,
    rangeFactor = 10 ** (range === 0 ? 0 : Math.ceil(1 - Math.log10(range))),
    niceMin = range === 0 ? nums[0] : Math.floor(minimum * rangeFactor) / rangeFactor,
    niceMax = range === 0 ? nums[0] : Math.ceil(maximum * rangeFactor) / rangeFactor;
  return { min: minimum, max: maximum, range, rangeFactor, niceMin, niceMax, niceRange: niceMax - niceMin };
}
function primeFactors(value) {
  if (!(value >= 1)) throw new Error("org-plot does not finish choosing ticks when a radar axis has no range; set ticks:");
  const factors = [];
  for (let i = 2; value !== 1; i++)
    while (value % i === 0) {
      factors.unshift(i);
      value /= i;
    }
  return factors;
}
function frequencies(values) {
  const groups = new Map();
  for (const v of values) groups.set(v, (groups.get(v) || 0) + 1);
  return [...groups].map(([k, n]) => [k, n / values.length]);
}
function union(a, b) {
  if (!a.length) return b;
  if (!b.length) return a;
  if (a.length < b.length) [a, b] = [b, a];
  return [...b.filter((k) => !a.includes(k)), ...a];
}
function mergeAlists(a, b, ...rest) {
  if (b === undefined) throw new Error("Wrong number of arguments: org--plot/merge-alists, 3");
  if (rest.length) b = mergeAlists(b, ...rest);
  const lookup = (k, alist) => alist.find(([key]) => key === k)?.[1] || 0;
  return union(a.map(([k]) => k), b.map(([k]) => k)).map((k) => [k, lookup(k, a) + lookup(k, b)]);
}
function nicePick(freqs) {
  if (freqs.length === 1) return [freqs[0][0]];
  if (freqs.length === 2) return 3 <= freqs[0][1] / freqs[1][1] ? [freqs[0][0], freqs[0][0]] : [freqs[0][0], freqs[1][0]];
  if (!freqs.length) throw wrongType("number-or-marker-p", null);
  const total = freqs.reduce((sum, [, v]) => sum + v, 0), n = freqs.map(([k, v]) => [k, v / total]);
  const pick = [n[0][0]], product = () => pick.reduce((a, b) => a * b, 1);
  const r12 = n[0][1] / n[1][1], r13 = r12 * (n[1][1] / n[2][1]);
  if (r12 > 4) pick.unshift(n[0][0]);
  if (r12 < n[1][0] && product() * n[1][0] < 30) pick.unshift(n[1][0]);
  if (r13 < n[2][0] && product() * n[2][0] < 30) pick.unshift(n[2][0]);
  return pick;
}
export function sensibleTickNum(rows, hardMin, hardMax) {
  const ranges = rows.map((row) => {
    const stats = valuesStats(row.slice(1).map(stringToNumber), hardMin, hardMax),
      value = roundEven(stats.rangeFactor * stats.niceRange);
    return value % 10 === 0 ? value / 10 : value;
  });
  const weighted = mergeAlists(...ranges.map((value) => frequencies(primeFactors(value)))).sort((a, b) => b[1] - a[1]);
  return nicePick(weighted).reduce((a, b) => a * b, 1);
}
/** org--plot/radar's data: one axis per row with its bounds, and the tick count. */
export function radarAxes(rows, params) {
  const hardMin = typeof params.ymin === "number" ? params.ymin : undefined,
    hardMax = typeof params.ymax === "number" ? params.ymax : undefined;
  if (rows.includes(HLINE)) throw wrongType("listp", sym("hline"));
  const ticks = params.ticks ?? sensibleTickNum(rows, hardMin, hardMax);
  return {
    ticks: ticks === 0 ? 2 : ticks,
    axes: rows.map((row) => {
      const stats = valuesStats(row.slice(1).map(stringToNumber));
      return { label: row[0], min: hardMin ?? stats.niceMin, max: hardMax ?? stats.niceMax };
    }),
  };
}
/** org-plot/gnuplot-to-grid-data: the matrix and its y labels. */
export function gridData(rows, params) {
  if (typeof params.ind !== "number") throw wrongType("number-or-marker-p", params.ind);
  if (rows.includes(HLINE)) throw wrongType("listp", sym("hline"));
  const ind = params.ind - 1, width = rows[0]?.length ?? 0;
  let deps = "deps" in params ? (params.deps || []).map((d) => d - 1) : Array.from({ length: width }, (_, c) => width - 1 - c);
  const ylabels = ind >= 0 ? rows.map((row, i) => [i + 1, row[ind]]) : null;
  let matrix = rows;
  if (deps.length || ind >= 0) {
    deps = deps.filter((d) => d !== ind);
    matrix = rows.map((row) => row.filter((_, c) => deps.includes(c)));
  }
  return { matrix, ylabels };
}
export function gridDump(matrix) {
  const f = (v) => v.toFixed(6), out = [];
  for (let col = 0; col < (matrix[0]?.length ?? 0); col++) {
    let back = "", front = "";
    for (let row = 0; row < matrix.length; row++) {
      const v = stringToNumber(matrix[row][col]), edge = (x) => `${f(x)}  ${f(row + 0.5)}  ${f(v)}\n${f(x)}  ${f(row + 1.5)}  ${f(v)}\n`;
      back += edge(col);
      front += edge(col + 1);
    }
    out.push(back, "\n", front, "\n");
  }
  return out.join("");
}
