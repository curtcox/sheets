import { numberLike } from "./table-html.js";
import { CHART_LIMITS, chartSVG, chartFigure } from "../../charts.js";
import { escapeHTML } from "../../util.js";

// Org #+PLOT: charts. The first half of this module reproduces org-plot's own
// option collection and table handling (Org 9.8.7 org-plot.el), including its
// quirks, so tests can compare it with the Emacs harness in
// scripts/reference/org-plot.el. The second half is Sheets' extraction and
// inference, which reads Org column numbers and only the data rows.

export const HLINE = null;
const NUMBER = new RegExp(numberLike.source, "i"); // org-plot matches with case-fold-search.
const TIMESTAMP = /[[<](\d{4})-(\d{2})-(\d{2})(?: *[^\]+0-9>\n -]+)?(?: (\d{1,2}):(\d{2}))?[^\]>\n]{0,16}[\]>]/;
const COOKIE = /^<[lrc]?\d*>$/;
const MARKERS = new Set(["/", "#", "!", "$", "*", "_", "^"]);
const OPTIONS = [
  ["type", "plot-type"], ["script", "script"], ["line", "line"], ["set", "set"],
  ["title", "title"], ["ind", "ind"], ["deps", "deps"], ["with", "with"],
  ["file", "file"], ["labels", "labels"], ["map", "map"], ["timeind", "timeind"],
  ["timefmt", "timefmt"], ["min", "ymin"], ["ymin", "ymin"], ["max", "ymax"],
  ["ymax", "ymax"], ["xmin", "xmin"], ["xmax", "xmax"], ["ticks", "ticks"],
  ["trans", "transpose"], ["transpose", "transpose"],
];
const MULTIPLES = new Set(["set", "line"]);
const VALUE = String.raw`:("[^"]+?"|\([^)]+?\)|[^ \t\n\r;,.]*)`;
export const NATIVE_LINE = /#\+PLOT: +(.*)$/i;
const SHEETS_LINE = /^\s*#\+SHEETS_PLOT:(?:\s+(.*))?$/i;

/** A Lisp symbol read from an option value. Strings stay JavaScript strings. */
export const sym = (name) => ({ sym: name });
export const symbolName = (value) => (value && typeof value === "object" && "sym" in value ? value.sym : undefined);
export const isTimestamp = (cell) => TIMESTAMP.test(cell);
export const isOrgNumber = (cell) => NUMBER.test(cell);

function readAtom(token) {
  if (/^[+-]?\d+\.?$/.test(token)) return Number.parseInt(token, 10);
  if (/^[+-]?(?:\d*\.\d+|\d+(?:\.\d*)?e[+-]?\d+)$/i.test(token)) return Number(token);
  if (token === "nil") return null;
  if (/^['`,#?[\]()"\\]/.test(token)) throw new Error(`Cannot read the option value ${token}.`);
  return sym(token);
}
function readString(body) {
  return body.replace(/\\(.)/gs, (_, c) => ({ n: "\n", t: "\t", r: "\r", s: " ", e: "\x1b", a: "\x07", f: "\f", "\n": "" })[c] ?? c);
}
/** `read-from-string` for the value shapes org-plot's option regexp can capture. */
export function readLisp(text) {
  if (!text) throw new Error("End of file during parsing");
  if (text.startsWith('"')) return readString(text.slice(1, -1));
  if (text.startsWith("(")) {
    const items = [];
    for (const m of text.slice(1, -1).matchAll(/"((?:[^"\\]|\\.)*)"|([^\s"]+)/g))
      items.push(m[1] !== undefined ? readString(m[1]) : readAtom(m[2]));
    return items.length ? items : null;
  }
  // read-from-string reads only the first expression of an atom token.
  return readAtom(text.split(/(?=[("'])/)[0] || text);
}

/** org-plot/add-options-to-plist, including its shared search start for set: and line:. */
export function addOptions(params, options) {
  let start = 0;
  for (const [key, prop] of OPTIONS) {
    const pattern = new RegExp(key + VALUE, "gi");
    if (MULTIPLES.has(key)) {
      let match;
      pattern.lastIndex = start;
      while ((match = pattern.exec(options))) {
        start = pattern.lastIndex;
        params[prop] = [readLisp(match[1]), ...(params[prop] || [])];
      }
    } else {
      const match = pattern.exec(options);
      if (match) params[prop] = readLisp(match[1]);
    }
  }
  return params;
}

/** Keyword lines org-plot scans: contiguous #+ lines directly above the table, nearest first. */
export function plotKeywords(lines, start) {
  const native = [], sheets = [], malformed = [];
  for (let i = start - 1; i >= 0 && /^[ \t\f\v]*#\+/.test(lines[i]); i--) {
    const match = NATIVE_LINE.exec(lines[i]), own = SHEETS_LINE.exec(lines[i]);
    if (match) native.push({ line: i + 1, text: match[1] });
    else if (own) sheets.push({ line: i + 1, text: own[1] || "" });
    else if (/^\s*#\+PLOT:/i.test(lines[i])) malformed.push({ line: i + 1 });
  }
  return { native, sheets, malformed };
}

const yes = (value) => ["y", "yes", "t"].includes(symbolName(value));
function transpose(rows) {
  const data = rows.filter((row) => row !== HLINE),
    width = Math.min(...data.map((row) => row.length));
  return Array.from({ length: Number.isFinite(width) ? width : 0 }, (_, c) => data.map((row) => row[c]));
}
const wrongType = (predicate, value) => new Error(`Wrong type argument: ${predicate}, ${lispText(value)}`);

/**
 * Org's table as `org-table-to-lisp` returns it (HLINE for rules), with each
 * row's Org row number (@N counts non-rule rows) and its rule-separated group.
 */
export function lispTable(table) {
  let row = 0, group = 0, seen = false;
  const meta = [];
  const rows = table.layout.map((index) => {
    if (index === null) {
      if (seen) group++;
      seen = false;
      meta.push(null);
      return HLINE;
    }
    seen = true;
    meta.push({ row: ++row, group });
    return table.rows[index].slice();
  });
  return { rows, meta };
}

function specialColumn(rows) {
  let special = false;
  for (const row of rows) {
    if (row === HLINE) continue;
    if (MARKERS.has(row[0])) special = true;
    else if (row[0] !== "") return false;
  }
  return special;
}
function specialRow(row, column) {
  if (row[0] === "/" || (column && ["^", "_", "$", "!"].includes(row[0]))) return true;
  let cookie = false;
  for (const cell of row) {
    if (cell === "") continue;
    if (!/^<[lrc]?\d*>$/.test(cell)) return false;
    cookie = true;
  }
  return cookie;
}

/**
 * Reproduce org-plot/gnuplot up to the generated script. Returns the merged
 * options, table, labels and, for 2d plots, the x mode and plot lines.
 * Throws the error Emacs would signal.
 */
export function emulateOrgPlot(table, nativeLines) {
  const params = {};
  const collect = () => {
    // org-plot walks upward from the table, so the topmost line is applied last.
    for (const { text } of nativeLines) addOptions(params, text);
  };
  params["plot-type"] = sym("2d");
  params.with = sym("lines");
  params.ind = 0;
  collect();
  const explicit = new Set(nativeLines.flatMap(({ text }) => Object.keys(addOptions({}, text))));
  let { rows, meta } = lispTable(table);
  const transposed = yes(params.transpose);
  if (transposed) {
    const hasRule = rows.includes(HLINE);
    rows = transpose(rows);
    if (hasRule) rows.splice(1, 0, HLINE);
    meta = rows.map((row) => (row === HLINE ? null : { row: null, group: 0 }));
  }
  const numCols = (rows[0] === HLINE ? rows[1] : rows[0])?.length ?? 0;
  const type = symbolName(params["plot-type"]);
  if (!["2d", "3d", "grid", "radar"].includes(type))
    throw new Error(`Org-plot type \`${symbolName(params["plot-type"]) ?? params["plot-type"]}' is undefined`);
  let header = null;
  if (rows[1] === HLINE && rows.length > 1) {
    header = rows[0];
    params.labels = rows[0];
    meta = meta.slice(1).filter((_, i) => rows[i + 1] !== HLINE);
    rows = rows.slice(1).filter((row) => row !== HLINE);
  }
  collect();
  const result = { params, explicit, rows, meta, header, numCols, type, transposed };
  if (type !== "2d") return result;
  const ind = params.ind;
  if (typeof ind !== "number") throw wrongType("number-or-marker-p", ind);
  if (ind - 1 >= 0) {
    const column = rows.map((row) => {
      if (row === HLINE) throw wrongType("listp", sym("hline"));
      const cell = row[ind - 1];
      if (cell === undefined) throw wrongType("stringp", null);
      return cell;
    });
    if (column.every(isTimestamp)) params.timeind = sym("t");
    else if (stringName(params.with) === "hist" || !column.every(isOrgNumber)) params.textind = sym("t");
  }
  const deps = params.deps;
  if (deps !== undefined && deps !== null && !Array.isArray(deps)) throw wrongType("listp", deps);
  const textInd = !!params.textind || symbolName(params.with) === "histograms";
  const labels = params.labels || [];
  result.plots = [];
  for (let col = 0; col < numCols; col++) {
    if ((ind && col + 1 === ind) || (deps && !deps.includes(col + 1))) continue;
    const label = labels[col] ?? String(col + 1);
    result.plots.push({
      x: ind,
      y: col + 1,
      text: textInd,
      line: `using ${ind > 0 && !textInd ? `${ind}:` : ""}${col + 1}${textInd ? `:xticlabel(${ind})` : ""} with ${lispText(params.with)} title '${lispText(label)}'`,
    });
  }
  return result;
}
const stringName = (value) => (typeof value === "string" ? value : symbolName(value));
const lispText = (value) =>
  Array.isArray(value) ? `(${value.map(lispText).join(" ")})` : value === null ? "nil" : typeof value === "object" ? value.sym : String(value);

/** org-plot's data file: special rows and the marker column removed, then TSV-quoted. */
export function dataRows(rows) {
  const data = rows.filter((row) => row !== HLINE), column = specialColumn(data);
  return {
    column,
    rows: data.filter((row) => !specialRow(row, column)),
  };
}
function timestampText(cell) {
  const m = TIMESTAMP.exec(cell), pad = (n) => String(n).padStart(2, "0");
  return `${m[1]}-${m[2]}-${m[3]}-${pad(m[4] ?? 0)}:${m[5] ?? "00"}:00`;
}
export function dumpTSV(rows, column) {
  const field = (cell) =>
    isOrgNumber(cell) ? cell : isTimestamp(cell) ? timestampText(cell) : `"${cell.replaceAll('"', '""')}"`;
  return rows.map((row) => (column ? row.slice(1) : row).map(field).join("\t")).join("\n");
}
/** Normalize Lisp values to the JSON the Emacs harness writes. */
export function lispJSON(value) {
  if (Array.isArray(value)) return value.map(lispJSON);
  if (value && typeof value === "object") return value.sym;
  return value;
}

// ---------------------------------------------------------------------------
// Sheets extraction and inference.

const SUMMARY = /^(?:grand\s+)?(?:totals?|sum|subtotal|average|avg|mean|median|overall|net|all)\b/i;
const WITH = [
  [/^(?:l|li|lin|line|lines)$/, "line"],
  [/^(?:p|po|poi|poin|point|points|d|do|dot|dots)$/, "points"],
  [/^(?:lp|linesp|linespo|linespoi|linespoin|linespoint|linespoints)$/, "linespoints"],
  [/^(?:st|ste|step|steps|fs|fsteps|his|histep|histeps)$/, "steps"],
  [/^(?:hist|histo|histog|histogr|histogra|histogram|histograms|boxes|box|i|im|imp|impulse|impulses)$/, "bar"],
];
export function chartKind(withValue) {
  const name = stringName(withValue);
  return WITH.find(([pattern]) => pattern.test(name ?? ""))?.[1];
}
const cellNumber = (cell) => {
  if (!isOrgNumber(cell)) return null;
  const n = Number(cell);
  const value = Number.isFinite(n) ? n : Number.parseFloat(cell.replace(/^[<>]/, ""));
  return Number.isFinite(value) ? value : null;
};
function timestampValue(cell) {
  const m = TIMESTAMP.exec(cell);
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0));
}
const numericColumn = (cells) => {
  const filled = cells.filter((cell) => cell !== "");
  return filled.length > 0 && filled.filter(isOrgNumber).length * 2 >= filled.length;
};

/** Parse #+SHEETS_PLOT: options. Unknown or repeated keys are diagnosed. */
export function sheetsOptions(lines, diagnostics) {
  const options = {};
  const allowed = { kind: ["pie", "donut", "area"], rows: ["all"], legend: ["none", "right", "bottom", "top"], size: ["small", "medium", "wide"] };
  // Topmost first, so the line nearest the table wins as it does for org-plot's first pass.
  for (const { line, text } of lines.slice().reverse())
    for (const token of text.trim().split(/\s+/).filter(Boolean)) {
      const match = /^([a-z]+):(.*)$/i.exec(token), key = match?.[1].toLowerCase(), value = match?.[2].toLowerCase();
      if (!match || !allowed[key])
        diagnostics.push({ line, severity: "warning", message: `Unknown SHEETS_PLOT option ${token}. Use kind:, rows:, legend: or size:.` });
      else if (!allowed[key].includes(value))
        diagnostics.push({ line, severity: "warning", message: `Unsupported SHEETS_PLOT ${key}:${match[2]}. Use ${allowed[key].map((v) => `${key}:${v}`).join(", ")}.` });
      else options[key] = value;
    }
  return options;
}

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

/**
 * gnuplot set: commands Sheets applies. Applied in script order, so the last
 * one wins, as in gnuplot. Returns spec overrides; others are reported.
 */
export function plotSets(sets, report) {
  const out = {};
  for (const value of (sets || []).slice()) {
    const text = lispText(value).trim();
    let m;
    if ((m = /^(?:no)?key\b(.*)$/.exec(text))) {
      const words = m[1];
      out.legend = text.startsWith("nokey") || /\boff\b/.test(words) ? "none"
        : /\bbottom\b/.test(words) ? "bottom" : /\btop\b/.test(words) ? "top" : /\b(?:left|right)\b/.test(words) ? "right" : "top";
    } else if (/^grid\b/.test(text)) out.grid = true;
    else if ((m = /^log(?:scale)?\b\s*(\w*)/.exec(text))) {
      const axes = m[1] || "xy";
      if (axes.includes("y")) out.log = true;
      if (axes.includes("x")) report(`set:"${text}": a logarithmic x axis is not supported; x stays linear.`);
    } else if ((m = /^([xy])label\s+(?:(['"])(.*?)\2|(\S.*))$/.exec(text))) out[`${m[1]}label`] = m[3] ?? m[4];
    else if ((m = /^title\s+(?:(['"])(.*?)\1|(\S.*))$/.exec(text))) out.title = m[2] ?? m[3];
    else if ((m = /^([xy])range\s*\[\s*([^:\]]*?)\s*:\s*([^\]]*?)\s*\]$/.exec(text))) {
      const bound = (v) => (v === "" || v === "*" ? undefined : Number.isFinite(Number(v)) ? Number(v) : NaN);
      const [lo, hi] = [bound(m[2]), bound(m[3])];
      if (Number.isNaN(lo) || Number.isNaN(hi)) report(`set:"${text}": only numeric ranges are applied.`);
      else out[`${m[1]}range`] = [lo, hi];
    } else if (/^style\s+hist\w*\s+rowstack/.test(text)) out.stacked = true;
    else if (/^style\s+hist\w*\s+cluster/.test(text)) out.stacked = false;
    else report(`set:"${text}" is not applied; Sheets draws its own ${/^style\b/.test(text) ? "style" : "axes and legend"}.`);
  }
  return out;
}

/**
 * Build a chart for one table, or return { error } with a reason. `keywords`
 * comes from plotKeywords. Returns { spec, note, inferred, excluded, line }.
 */
export function orgPlot(table, keywords, { rows: rowOption } = {}) {
  const diagnostics = [];
  const line = (keywords.native[0] || keywords.sheets[0]).line;
  const fail = (error) => ({ line, diagnostics, error });
  const own = sheetsOptions(keywords.sheets, diagnostics);
  let plot;
  try {
    plot = emulateOrgPlot(table, keywords.native);
  } catch (error) {
    return fail(`org-plot cannot use these options (${error.message}); nothing is drawn.`);
  }
  const { params, explicit, numCols } = plot;
  if (!["2d", "radar", "grid"].includes(plot.type)) return fail(`type:${plot.type} is not supported; nothing is drawn.`);
  for (const key of ["script", "line", "map", "timefmt"])
    if (explicit.has(key)) return fail(`${key}: is not supported; nothing is drawn.`);
  const reported = new Set(), report = (message) => {
    if (!reported.has(message)) diagnostics.push({ line, severity: "info", message });
    reported.add(message);
  };
  const sets = plotSets(params.set, report);
  const { rows: cleaned, column: marked } = dataRows(plot.rows);
  const first = marked ? 2 : 1;
  // Summary rows: a final one-row group after a rule, labelled like a total.
  const metaByRow = new Map(plot.rows.map((row, i) => [row, plot.meta[i]]));
  let rows = cleaned, excluded = null;
  if ((rowOption ?? own.rows) !== "all" && !plot.transposed && cleaned.length > 1) {
    const last = cleaned.at(-1), lastMeta = metaByRow.get(last), prevMeta = metaByRow.get(cleaned.at(-2)),
      cell = last[first - 1] ?? "";
    const others = cleaned.slice(0, -1).map((row) => row[first - 1] ?? "");
    if (lastMeta && prevMeta && lastMeta.group > prevMeta.group && cell && !isOrgNumber(cell) && !isTimestamp(cell) &&
      (SUMMARY.test(cell) || others.every((c) => isOrgNumber(c) || isTimestamp(c)))) {
      excluded = lastMeta.row;
      rows = cleaned.slice(0, -1);
    }
  }
  const labels = params.labels || [];
  const titleText = sets.title ?? (params.title === undefined || params.title === null ? "" : lispText(params.title));
  const finish = (spec, inferred = [], extra = {}) => {
    const noteParts = [];
    if (inferred.length) noteParts.push(`Inferred: ${inferred.join(" ")}`);
    if (excluded) noteParts.push(`summary row @${excluded} excluded`);
    const note = noteParts.length ? `${noteParts.join("; ")}.`.replace(/^s/, "S") : "";
    if (inferred.length && keywords.native.length)
      diagnostics.push({ line: keywords.native[0].line, severity: "info", message: `Inferred plot options: ${inferred.join(" ")}. Add them to #+PLOT: so Emacs plots the same data.` });
    if (excluded) diagnostics.push({ line, severity: "info", message: `Summary row @${excluded} is not plotted. Add rows:all to #+SHEETS_PLOT: to include it.` });
    const file = params.file === undefined || params.file === null ? undefined : lispText(params.file);
    return { line, diagnostics, inferred, excluded, note, rows, marked, file, ...extra, spec: { title: titleText, size: own.size, legend: own.legend ?? sets.legend, ...spec } };
  };
  const data = marked ? rows.map((row) => row.slice(1)) : rows;
  if (own.kind && plot.type !== "2d") report(`kind:${own.kind} applies to ordinary 2D plots; this type:${plot.type} plot keeps its own chart.`);
  if (plot.type === "radar") {
    let radar;
    try {
      radar = radarAxes(data, params);
    } catch (error) {
      return fail(`org-plot cannot draw this radar chart (${error.message}); nothing is drawn.`);
    }
    if (data.length < 3) diagnostics.push({ line, severity: "warning", message: "A radar chart needs at least three rows, one per axis." });
    const names = marked ? labels.slice(1) : labels;
    return finish({
      kind: "radar",
      ticks: radar.ticks,
      axes: radar.axes,
      x: { type: "category", values: data.map((row) => row[0]) },
      series: (data[0] || []).slice(1).map((_, i) => ({
        label: lispText(names[i + 1] ?? String(i + 2)),
        values: data.map((row) => cellNumber(row[i + 1] ?? "")),
        text: data.map((row) => row[i + 1] ?? ""),
      })),
    }, [], { radar });
  }
  const inferred = [];
  const columnCells = (c) => rows.map((row) => row[c - 1] ?? "");
  // ind
  let ind = params.ind;
  if (explicit.has("ind")) {
    if (!Number.isInteger(ind) || ind < 0 || ind > numCols)
      return fail(`ind:${lispText(ind)} is not a column of this table; nothing is drawn.`);
    if (marked && ind === 1) return fail("ind:1 is the marker column; use ind:2 or later.");
  } else {
    const cells = columnCells(first), filled = cells.filter((c) => c !== "");
    const values = cells.map(cellNumber);
    const text = filled.length === cells.length && cells.length && cells.every((c) => !isOrgNumber(c));
    const times = cells.length && cells.every(isTimestamp);
    const increasing = values.length && values.every((v, i) => v !== null && (i === 0 || v > values[i - 1]));
    ind = first <= numCols && (text || times || increasing) ? first : 0;
    inferred.push(`ind:${ind}`);
  }
  const xCells = ind ? columnCells(ind) : [];
  // deps
  let deps;
  const limit = explicit.has("deps") ? CHART_LIMITS.depsSeries : CHART_LIMITS.series;
  if (explicit.has("deps")) {
    const listed = params.deps || [];
    const bad = listed.find((d) => !Number.isInteger(d) || d < 1 || d > numCols);
    if (bad !== undefined) return fail(`deps: names ${lispText(bad)}, which is not a column of this table; nothing is drawn.`);
    deps = [...new Set(listed)].filter((d) => d !== ind && !(marked && d === 1)).sort((a, b) => a - b);
  } else {
    deps = [];
    for (let c = first; c <= numCols; c++) if (c !== ind && numericColumn(columnCells(c))) deps.push(c);
    if (deps.length) inferred.push(`deps:(${deps.slice(0, limit).join(" ")})`);
  }
  if (plot.type === "grid") {
    if (!deps.length) return fail("There are no numeric columns to plot.");
    const cells = rows.length * deps.length;
    if (cells > CHART_LIMITS.heatmapCells) return fail(`Heatmaps draw at most ${CHART_LIMITS.heatmapCells.toLocaleString("en-US")} cells; this one has ${cells.toLocaleString("en-US")}.`);
    for (const col of deps) {
      const at = columnCells(col).findIndex((c) => c !== "" && cellNumber(c) === null);
      if (at >= 0) diagnostics.push({ line, severity: "warning", message: `Column ${col} has text such as "${columnCells(col)[at]}"; org-plot reads it as 0, Sheets leaves the cell blank.` });
    }
    return finish({
      kind: "heatmap",
      x: { type: "category", values: deps.map((c) => lispText(labels[c - 1] ?? String(c))), label: sets.xlabel },
      y: { label: sets.ylabel ?? (ind ? lispText(labels[ind - 1] ?? "") : "") },
      series: rows.map((row, i) => ({
        label: ind ? row[ind - 1] : String(i + 1),
        values: deps.map((c) => cellNumber(row[c - 1] ?? "")),
        text: deps.map((c) => row[c - 1] ?? ""),
      })),
    }, inferred, { deps, ind });
  }
  // x mode
  const withName = stringName(params.with);
  let mode = "row";
  if (ind) {
    if (xCells.length && xCells.every(isTimestamp)) mode = "time";
    else if (withName === "hist" || !xCells.every(isOrgNumber)) mode = "category";
    else mode = "linear";
  }
  if (deps.length > limit) {
    diagnostics.push({ line, severity: "info", message: `Only the first ${limit} of ${deps.length} numeric columns are plotted.` });
    deps = deps.slice(0, limit);
    if (!explicit.has("deps")) inferred[inferred.length - 1] = `deps:(${deps.join(" ")})`;
  }
  if (!deps.length) return fail("There are no numeric columns to plot.");
  // with
  let kind;
  if (explicit.has("with")) {
    kind = chartKind(params.with);
    if (!kind) return fail(`with:${lispText(params.with)} is not supported; use lines, points, linespoints, steps, histograms, boxes or impulses.`);
  } else {
    const name = rows.length < 2 ? "points" : mode === "category" ? "histograms" : "lines";
    inferred.push(`with:${name}`);
    kind = chartKind(name);
    if (name === "histograms") mode = "category";
  }
  if (symbolName(params.with) === "histograms") mode = "category";
  // Values. Text in a dependent column is a gap.
  const series = deps.map((col) => {
    const cells = columnCells(col), firstText = cells.findIndex((c) => c !== "" && cellNumber(c) === null);
    if (firstText >= 0) {
      const at = metaByRow.get(rows[firstText])?.row;
      diagnostics.push({ line, severity: "warning", message: `Column ${col} (${lispText(labels[col - 1] ?? col)}) has text such as "${cells[firstText]}"${at ? ` in row @${at}` : ""}; text cells are drawn as gaps.` });
    }
    return { label: lispText(labels[col - 1] ?? String(col)), values: cells.map(cellNumber), text: cells, column: col };
  });
  const x = mode === "row"
    ? { type: "linear", label: "Row", values: rows.map((_, i) => i + 1) }
    : mode === "time"
      ? { type: "time", values: xCells.map(timestampValue), text: xCells }
      : mode === "linear"
        ? { type: "linear", values: xCells.map(cellNumber), text: xCells }
        : { type: "category", values: xCells };
  if (ind) x.label = lispText(labels[ind - 1] ?? "");
  if (sets.xlabel !== undefined) x.label = sets.xlabel;
  // Axis bounds: set yrange/xrange first, then org-plot's min/max keys.
  const y = { label: sets.ylabel, log: sets.log };
  const number = (key) => (explicit.has(key) && typeof params[key] === "number" ? params[key] : undefined);
  [y.min, y.max] = sets.yrange ?? [number("ymin"), number("ymax")];
  if (explicit.has("ticks")) {
    if (Number.isInteger(params.ticks) && params.ticks > 0) y.ticks = params.ticks;
    else report(`ticks:${lispText(params.ticks)} is not a positive whole number; Sheets chooses the ticks.`);
  }
  const [xmin, xmax] = sets.xrange ?? [number("xmin"), number("xmax")];
  if (xmin !== undefined || xmax !== undefined) {
    if (x.type === "linear" && kind !== "bar") Object.assign(x, { min: xmin, max: xmax });
    else report("x-axis bounds apply only to numeric x axes; they are ignored here.");
  }
  // #+SHEETS_PLOT: kind overrides the native style in Sheets only.
  let stacked = !!sets.stacked && kind === "bar";
  if (own.kind === "area") {
    if (x.type === "category") diagnostics.push({ line, severity: "warning", message: "kind:area needs a numeric or time x axis; the native chart is drawn instead." });
    else [kind, stacked] = ["area", true];
  } else if (own.kind) {
    if (series.length > 1)
      report(`kind:${own.kind} uses only the first dependent column, ${series[0].column} (${series[0].label}); ${series.slice(1).map((s) => s.column).join(", ")} ${series.length > 2 ? "are" : "is"} ignored.`);
    const first = series[0], names = x.type === "category" ? x.values : rows.map((_, i) => (x.text?.[i] ?? `Row ${i + 1}`));
    const bad = first.values.map((v, i) => (v > 0 ? -1 : i)).filter((i) => i >= 0);
    if (bad.length) {
      const at = metaByRow.get(rows[bad[0]])?.row;
      diagnostics.push({ line, severity: "warning", message: `Slices need positive values; ${bad.length} row${bad.length === 1 ? " is" : "s are"} left out, first ${at ? `@${at} ` : ""}(${names[bad[0]] || "unnamed"}: ${first.text[bad[0]] || "empty"}).` });
    }
    const keep = first.values.map((v, i) => i).filter((i) => first.values[i] > 0);
    return finish({
      kind: own.kind,
      x: { type: "category", label: x.label, values: keep.map((i) => names[i]) },
      series: [{ label: first.label, values: keep.map((i) => first.values[i]), text: keep.map((i) => first.text[i]) }],
    }, inferred, { deps, ind, mode });
  }
  if (sets.stacked && kind !== "bar") report('set:"style histogram rowstacked" stacks bars only; this chart is not a bar chart.');
  return finish({ kind, x, y, series, maxSeries: limit, stacked, grid: sets.grid }, inferred, { deps, ind, mode });
}

/** Chart { html, file } for every plotted table, keyed by table start line, plus diagnostics. */
export function orgCharts(lines, tables) {
  const charts = new Map(), diagnostics = [];
  let count = 0;
  for (const { start, table } of tables) {
    const keywords = plotKeywords(lines, start);
    for (const { line } of keywords.malformed)
      diagnostics.push({ line, severity: "warning", message: "org-plot needs a space after #+PLOT:, so Emacs ignores this line; Sheets does too." });
    if (!keywords.native.length && !keywords.sheets.length) continue;
    const plot = orgPlot(table, keywords);
    if (++count > CHART_LIMITS.charts) {
      if (count === CHART_LIMITS.charts + 1)
        diagnostics.push({ line: plot.line, severity: "warning", message: `A document can draw at most ${CHART_LIMITS.charts} charts; this and later plots are skipped.` });
      continue;
    }
    diagnostics.push(...plot.diagnostics);
    if (plot.error) {
      diagnostics.push({ line: plot.line, message: plot.error });
      charts.set(start, { html: `<p class="notice chart-unavailable">Chart not drawn: ${escapeHTML(plot.error)}</p>` });
      continue;
    }
    const chart = chartSVG(plot.spec);
    diagnostics.push(...chart.diagnostics.map((d) => ({ line: plot.line, ...d })));
    charts.set(start, { html: chartFigure({ svg: chart.svg, title: plot.spec.title, note: plot.note }), file: plot.file });
  }
  return { charts, diagnostics };
}

/** The source with each table's inferred options appended to its nearest #+PLOT: line. */
export function pastedOrgPlots(src, tables) {
  const lines = src.split("\n");
  for (const { start, table } of tables) {
    const keywords = plotKeywords(lines, start);
    if (!keywords.native.length) continue;
    const plot = orgPlot(table, keywords);
    if (plot.inferred?.length) lines[keywords.native[0].line - 1] += ` ${plot.inferred.join(" ")}`;
  }
  return lines.join("\n");
}
