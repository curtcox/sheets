import { escapeHTML } from "./util.js";

// DOM-free SVG charts shared by every format. Marks carry classes, not colors;
// styles.css and the standalone export define the palette. Output is plain
// markup that passes through sanitize.js unchanged.
export const CHART_LIMITS = Object.freeze({
  charts: 32,
  series: 8,
  depsSeries: 12,
  points: 2000,
  heatmapCells: 10000,
  label: 200,
  slices: 8,
});
export const CHART_SIZES = Object.freeze({ small: [640, 480], medium: [640, 360], wide: [840, 360] });
// Categorical palette. Each color has at least 3:1 contrast on white, and every
// pair stays apart (CIE76 ΔE ≥ 20) under simulated protanopia, deuteranopia and
// tritanopia; tests/unit/charts.test.js checks both. Line series also differ
// in marker shape. Sheets has one light theme, which standalone exports share.
export const CHART_PALETTE = Object.freeze(["#1f5fa8", "#bc724e", "#385a16", "#6629e0", "#2ea1b8", "#aa1861", "#aa9118", "#e029e0"]);
// Sequential ramp for heatmaps, light to dark with strictly falling luminance.
export const CHART_RAMP = Object.freeze(["#f0f5fb", "#d9e6f4", "#bcd3eb", "#98bbdf", "#72a0d0", "#4f84bf", "#3569a7", "#22508b", "#133868"]);
/** Chart rules for standalone HTML exports; styles.css carries the same rules. */
export const CHART_STYLES = [
  `:root{${CHART_PALETTE.map((color, i) => `--chart-${i + 1}:${color}`).join(";")};${CHART_RAMP.map((color, i) => `--chart-q${i + 1}:${color}`).join(";")};--chart-text:#4f625e;--chart-grid:#e3e9e4;--chart-axis:#8a9894}`,
  CHART_RAMP.map((_, i) => `.chart-q${i + 1}{fill:var(--chart-q${i + 1})}`).join(""),
  ".chart-grid path{fill:none;stroke:var(--chart-grid);stroke-width:1}.chart-cell-empty{fill:#fff;stroke:var(--chart-grid)}.chart-cell-text{fill:#243b39;font-size:11px}.chart-cell-text-light{fill:#fff}.chart-kind-radar .chart-area{fill-opacity:.15}",
  ".chart{margin:24px 0}.chart-scroll{max-width:100%;overflow-x:auto}.chart-svg{display:block;width:100%;min-width:480px;height:auto}",
  CHART_PALETTE.map((_, i) => `.chart-s${i + 1}{--chart-color:var(--chart-${i + 1})}`).join(""),
  ".chart-tick,.chart-legend-text{fill:var(--chart-text);font-size:12px}.chart-axis-title{fill:#243b39;font-size:12px;font-weight:600}",
  ".chart-grid line{stroke:var(--chart-grid);stroke-width:1}.chart-axis line{stroke:var(--chart-axis);stroke-width:1}",
  ".chart-bar,.chart-swatch,.chart-slice{fill:var(--chart-color)}.chart-line{fill:none;stroke:var(--chart-color);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}",
  ".chart-marker{fill:var(--chart-color);stroke:#fff;stroke-width:1}.chart-hit{fill:transparent}.chart-area{fill:var(--chart-color);fill-opacity:.3;stroke:none}",
  ".chart-alt .chart-line{stroke-dasharray:6 3}.chart-alt .chart-bar,.chart-alt .chart-swatch{fill-opacity:.55;stroke:var(--chart-color)}",
  ".chart-other{--chart-color:#7d8b87}.chart-slice{stroke:#fff;stroke-width:1.5}",
  ".chart figcaption{font-size:.85em;color:#6c7c77;text-align:left;margin-top:6px}.chart-title{font-weight:600;color:#243b39}",
  "@media print{.chart-scroll{overflow:visible}.chart{break-inside:avoid}}",
].join("\n");
export const CHART_KINDS = Object.freeze(["line", "points", "linespoints", "steps", "bar", "area", "pie", "donut", "radar", "heatmap"]);
const FONT = 12;
const KIND_NAMES = {
  line: "Line chart",
  points: "Scatter chart",
  linespoints: "Line chart with markers",
  steps: "Step chart",
  bar: "Bar chart",
  area: "Stacked area chart",
  pie: "Pie chart",
  donut: "Donut chart",
  radar: "Radar chart",
  heatmap: "Heatmap",
};
const r1 = (value) => Math.round(value * 10) / 10;
const textWidth = (text, size = FONT) => [...String(text)].length * size * 0.6;
const clip = (text, limit = CHART_LIMITS.label) => {
  const chars = [...String(text ?? "")];
  return chars.length > limit ? chars.slice(0, limit - 1).join("") + "…" : chars.join("");
};
/** Shorten text to roughly `width` pixels, keeping the full text available for <title>. */
function fit(text, width, size = FONT) {
  const chars = [...text], room = Math.max(1, Math.floor(width / (size * 0.6)));
  return chars.length > room ? chars.slice(0, Math.max(1, room - 1)).join("") + "…" : text;
}
const series = (index) => `chart-s${(index % 8) + 1}${index >= 8 ? " chart-alt" : ""}`;

/** Group thousands; choose decimals from the tick step so labels stay aligned. */
export function formatNumber(value, step, { group = true } = {}) {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0) || Math.abs(value) < 1e-12 * (step || 1)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-6) return value.toExponential(2).replace(/\.?0+e/, "e");
  const decimals = step
    ? Math.max(0, Math.min(10, -Math.floor(Math.log10(step) + 1e-9)))
    : Number.isInteger(value) ? 0 : Math.min(6, Math.max(0, 3 - Math.floor(Math.log10(abs))));
  let fixed = value.toFixed(decimals);
  if (!step && fixed.includes(".")) fixed = fixed.replace(/\.?0+$/, "");
  return group ? fixed.replace(/^(-?)(\d+)/, (_, sign, digits) => sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")) : fixed;
}

/** 1-2-5 ticks covering [min, max]. Fixed ends are kept exactly. */
export function niceTicks(min, max, count = 5, { fixedMin = false, fixedMax = false, integer = false } = {}) {
  if (!(max > min)) {
    const pad = Math.abs(min) * 0.1 || 1;
    if (!fixedMin) min -= pad;
    if (!fixedMax || !(max > min)) max = min + 2 * pad;
  }
  const raw = (max - min) / Math.max(1, count),
    power = 10 ** Math.floor(Math.log10(raw)),
    n = raw / power,
    step = Math.max(integer ? 1 : 0, (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * power),
    clean = (v) => Number.parseFloat(v.toPrecision(12)),
    lo = fixedMin ? min : clean(Math.floor(min / step + 1e-9) * step),
    hi = fixedMax ? max : clean(Math.ceil(max / step - 1e-9) * step),
    ticks = [];
  for (let i = Math.ceil(lo / step - 1e-9); i * step <= hi + step * 1e-9 && ticks.length < 50; i++) ticks.push(clean(i * step));
  return { min: lo, max: hi, step, ticks };
}

function logTicks(min, max) {
  const lo = Math.floor(Math.log10(min)), hi = Math.max(lo + 1, Math.ceil(Math.log10(max))), ticks = [];
  const every = Math.max(1, Math.ceil((hi - lo) / 6));
  for (let e = lo; e <= hi; e += every) ticks.push(Number.parseFloat((10 ** e).toPrecision(12)));
  return { min: 10 ** lo, max: 10 ** hi, ticks, step: null };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Day, month or year ticks for UTC millisecond values. */
export function timeTicks(min, max) {
  const day = 864e5;
  if (!(max > min)) [min, max] = [min - day, max + day];
  const days = (max - min) / day, ticks = [], start = new Date(min);
  if (days > 3 * 366) {
    const years = days / 365.25, step = [1, 2, 5, 10, 20, 50, 100].find((s) => years / s <= 8) || 100;
    for (let y = Math.ceil(start.getUTCFullYear() / step) * step; Date.UTC(y, 0, 1) <= max; y += step)
      if (Date.UTC(y, 0, 1) >= min) ticks.push({ value: Date.UTC(y, 0, 1), label: String(y) });
  } else if (days > 75) {
    const months = days / 30.44, step = [1, 2, 3, 6, 12].find((s) => months / s <= 8) || 12;
    let y = start.getUTCFullYear(), m = start.getUTCMonth();
    if (Date.UTC(y, m, 1) < min) m++;
    m = Math.ceil(m / step) * step;
    for (; Date.UTC(y, m, 1) <= max; m += step) {
      const date = new Date(Date.UTC(y, m, 1));
      ticks.push({ value: date.getTime(), label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}` });
    }
  } else {
    const step = [1, 2, 7, 14].find((s) => days / s <= 8) || 14;
    const first = Math.ceil(min / day) * day;
    for (let t = first; t <= max; t += step * day) {
      const date = new Date(t);
      ticks.push({ value: t, label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}` });
    }
  }
  return ticks;
}

// Filled marker shapes, so line series stay distinguishable without color.
const MARKERS = [
  (x, y, s) => `M${r1(x - s)} ${r1(y)}a${s} ${s} 0 1 0 ${2 * s} 0a${s} ${s} 0 1 0 ${-2 * s} 0Z`,
  (x, y, s) => `M${r1(x - s * 0.9)} ${r1(y - s * 0.9)}h${r1(s * 1.8)}v${r1(s * 1.8)}h${r1(-s * 1.8)}Z`,
  (x, y, s) => `M${r1(x)} ${r1(y - s * 1.15)}L${r1(x + s * 1.1)} ${r1(y + s * 0.85)}H${r1(x - s * 1.1)}Z`,
  (x, y, s) => `M${r1(x)} ${r1(y - s * 1.25)}L${r1(x + s * 1.1)} ${r1(y)}L${r1(x)} ${r1(y + s * 1.25)}L${r1(x - s * 1.1)} ${r1(y)}Z`,
  (x, y, s) => `M${r1(x)} ${r1(y + s * 1.15)}L${r1(x + s * 1.1)} ${r1(y - s * 0.85)}H${r1(x - s * 1.1)}Z`,
  (x, y, s) => {
    const a = s * 0.4, b = s * 1.1;
    return `M${r1(x - a)} ${r1(y - b)}h${r1(2 * a)}v${r1(b - a)}h${r1(b - a)}v${r1(2 * a)}h${r1(a - b)}v${r1(b - a)}h${r1(-2 * a)}v${r1(a - b)}h${r1(a - b)}v${r1(-2 * a)}h${r1(b - a)}Z`;
  },
  (x, y, s) => {
    const p = [];
    for (let i = 0; i < 6; i++) p.push(`${r1(x + s * 1.1 * Math.cos((Math.PI / 3) * i))} ${r1(y + s * 1.1 * Math.sin((Math.PI / 3) * i))}`);
    return `M${p.join("L")}Z`;
  },
  (x, y, s) => {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 ? s * 0.55 : s * 1.3, angle = -Math.PI / 2 + (Math.PI / 5) * i;
      p.push(`${r1(x + radius * Math.cos(angle))} ${r1(y + radius * Math.sin(angle))}`);
    }
    return `M${p.join("L")}Z`;
  },
];
const marker = (index, x, y, size = 3.5) => MARKERS[index % MARKERS.length](x, y, size);
const tip = (text) => `<title>${escapeHTML(clip(text, 400))}</title>`;
const text = (x, y, content, { anchor = "middle", cls = "chart-tick", dy, transform, full } = {}) =>
  `<text class="${cls}" x="${r1(x)}" y="${r1(y)}"${anchor === "middle" ? ' text-anchor="middle"' : anchor === "end" ? ' text-anchor="end"' : ""}${dy ? ` dy="${dy}"` : ""}${transform ? ` transform="${transform}"` : ""}>${full && full !== content ? tip(full) : ""}${escapeHTML(content)}</text>`;

function legendLayout(labels, width, { kind, column = false } = {}) {
  const items = [], gap = 18, swatch = 14;
  let x = 0, y = 0, widest = 0;
  for (const [index, label] of labels.entries()) {
    const shown = fit(clip(label, 60), column ? 160 : width - swatch - 6),
      w = swatch + 6 + textWidth(shown);
    if (!column && x > 0 && x + w > width) [x, y] = [0, y + 18];
    items.push({ index, label, shown, x, y });
    widest = Math.max(widest, w);
    if (column) y += 18;
    else x += w + gap;
  }
  return { items, height: column ? y : labels.length ? y + 18 : 0, width: widest, kind };
}
function legendSVG(layout, left, top, kind, classes = []) {
  return `<g class="chart-legend">${layout.items
    .map(({ index, label, shown, x, y }) => {
      const sx = left + x, sy = top + y + 7,
        k = layout.kinds?.[index] ?? kind,
        swatch = ["line", "linespoints", "steps"].includes(k)
          ? `<path class="chart-line" d="M${r1(sx)} ${r1(sy)}h14"/><path class="chart-marker" d="${marker(index, sx + 7, sy, 3.5)}"/>`
          : k === "points"
            ? `<path class="chart-marker" d="${marker(index, sx + 7, sy, 4)}"/>`
            : `<rect class="chart-swatch" x="${r1(sx)}" y="${r1(sy - 6)}" width="14" height="12" rx="2"/>`;
      return `<g class="${classes[index] ?? series(index)}">${swatch}${text(sx + 20, sy, shown, { anchor: "start", cls: "chart-legend-text", dy: "0.35em", full: label })}</g>`;
    })
    .join("")}</g>`;
}

function finite(values) {
  return values.filter((v) => typeof v === "number" && Number.isFinite(v));
}

/**
 * Render a normalized chart spec to SVG. See design/charts.md for the shape.
 * Returns { svg, summary, diagnostics }; diagnostics have no line numbers.
 */
export function chartSVG(spec) {
  const diagnostics = [],
    kind = CHART_KINDS.includes(spec.kind) ? spec.kind : "line",
    [W, H] = CHART_SIZES[spec.size] || CHART_SIZES.medium,
    title = clip(spec.title || "");
  let list = (spec.series || []).map((s) => ({ ...s, label: clip(s.label ?? "") }));
  const limit = spec.maxSeries || CHART_LIMITS.depsSeries;
  if (list.length > limit) {
    diagnostics.push({ severity: "info", message: `Only the first ${limit} of ${list.length} series are drawn.` });
    list = list.slice(0, limit);
  }
  let x = { type: "category", ...spec.x, values: [...(spec.x?.values || [])] };
  const perSeries = Math.max(1, Math.floor(CHART_LIMITS.points / Math.max(1, list.length)));
  if (x.values.length > perSeries) {
    diagnostics.push({ severity: "warning", message: `Charts draw at most ${CHART_LIMITS.points.toLocaleString("en-US")} points; only the first ${perSeries.toLocaleString("en-US")} rows are drawn.` });
    x.values = x.values.slice(0, perSeries);
    list = list.map((s) => ({ ...s, values: s.values.slice(0, perSeries), text: s.text?.slice(0, perSeries) }));
  }
  x.labels = x.values.map((v, i) => clip(x.text?.[i] ?? (x.type === "category" ? v : formatNumber(v))));
  const body =
    kind === "pie" || kind === "donut"
      ? pieBody({ ...spec, kind, series: list, x, W, H, diagnostics })
      : kind === "radar"
        ? radarBody({ ...spec, series: list, x, W, H, diagnostics })
        : kind === "heatmap"
          ? heatmapBody({ ...spec, series: list, x, W, H, diagnostics })
          : cartesianBody({ ...spec, kind, series: list, x, W, H, diagnostics });
  const summary = clip(body.summary || `${KIND_NAMES[kind]}.`, 1000);
  return {
    svg: `<svg class="chart-svg chart-kind-${kind}" viewBox="0 0 ${W} ${H}" role="img"><title>${escapeHTML(title || KIND_NAMES[kind])}</title><desc>${escapeHTML(summary)}</desc>${body.svg}</svg>`,
    summary,
    diagnostics,
  };
}

function seriesNames(list) {
  const names = list.map((s) => s.label || "series");
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more` : names.join(", ");
}
function range(values, step) {
  const v = finite(values);
  return v.length ? `values from ${formatNumber(Math.min(...v), step)} to ${formatNumber(Math.max(...v), step)}` : "no numeric values";
}

function cartesianBody(spec) {
  const { kind, series: list, x, W, H, diagnostics } = spec,
    horizontal = !!spec.horizontal && kind === "bar",
    stacked = !!spec.stacked && (kind === "bar" || kind === "area"),
    y = spec.y || {},
    n = x.values.length,
    categorical = kind === "bar" || x.type === "category",
    legendMode = spec.legend || (list.length > 1 ? "top" : "none"),
    // A vertical bar chart can draw series marked `line` as lines over the bars.
    overlay = list.map((s) => kind === "bar" && !horizontal && !!s.line),
    slots = [];
  let barCount = 0;
  for (const line of overlay) slots.push(line ? -1 : barCount++);
  // Values used for the y domain; stacking sums by position.
  let values = list.flatMap((s) => s.values);
  const stack = [];
  if (stacked) {
    for (let i = 0; i < n; i++) {
      let pos = 0, neg = 0;
      stack.push(list.map((s, index) => {
        const v = s.values[i];
        if (overlay[index] || typeof v !== "number" || !Number.isFinite(v)) return null;
        const base = v >= 0 ? pos : neg;
        if (v >= 0) pos += v;
        else neg += v;
        return [base, base + v];
      }));
      values.push(pos, neg);
    }
  }
  if (y.log) {
    const bad = finite(values).filter((v) => v <= 0).length;
    if (bad) diagnostics.push({ severity: "warning", message: `A logarithmic axis cannot show ${bad} zero or negative value${bad === 1 ? "" : "s"}; they are left as gaps.` });
    values = values.filter((v) => v > 0);
  }
  const data = finite(values);
  let lo = data.length ? Math.min(...data) : 0, hi = data.length ? Math.max(...data) : 1;
  if (!y.log) {
    if (kind === "bar" || kind === "area") [lo, hi] = [Math.min(lo, 0), Math.max(hi, 0)];
    else if (lo >= 0 && lo < 0.3 * hi) lo = 0;
  }
  const fixedMin = Number.isFinite(y.min), fixedMax = Number.isFinite(y.max);
  if (fixedMin) lo = y.min;
  if (fixedMax) hi = y.max;
  // An explicit tick count between fixed bounds divides the range exactly.
  const even = !y.log && y.ticks && fixedMin && fixedMax && hi > lo;
  const yTicks = y.log
    ? logTicks(lo > 0 ? lo : 1, hi > 0 ? hi : 10)
    : even
      ? { min: lo, max: hi, step: (hi - lo) / y.ticks, ticks: Array.from({ length: y.ticks + 1 }, (_, i) => Number.parseFloat((lo + ((hi - lo) * i) / y.ticks).toPrecision(12))) }
      : niceTicks(lo, hi, y.ticks || 5, { fixedMin, fixedMax });
  const valueLabels = yTicks.ticks.map((t) => formatNumber(t, yTicks.step));
  // Category or numeric x axis.
  let xTicks = null;
  if (!categorical) {
    const xs = finite(x.values);
    if (x.type === "time") {
      const ticks = timeTicks(Math.min(...xs), Math.max(...xs));
      xTicks = { min: Math.min(...xs), max: Math.max(...xs), ticks };
      if (!(xTicks.max > xTicks.min)) [xTicks.min, xTicks.max] = [xTicks.min - 864e5, xTicks.max + 864e5];
    } else {
      const fmin = Number.isFinite(x.min), fmax = Number.isFinite(x.max),
        t = niceTicks(fmin ? x.min : Math.min(...xs), fmax ? x.max : Math.max(...xs), 6, { fixedMin: fmin, fixedMax: fmax, integer: xs.every(Number.isInteger) });
      // Four-digit integers are usually years, which are not grouped.
      const group = !xs.every((v) => Number.isInteger(v) && v >= 1000 && v <= 9999);
      xTicks = { min: t.min, max: t.max, ticks: t.ticks.map((v) => ({ value: v, label: formatNumber(v, t.step, { group }) })) };
    }
  }
  const singleLabel = list.length === 1 ? list[0].label : "";
  const yLabel = clip(y.label || singleLabel, 80), xLabel = clip(x.label || "", 80);
  // Margins.
  const catLabels = x.labels,
    rotate = categorical && !horizontal && n > 12,
    valueWidth = Math.max(...valueLabels.map((l) => textWidth(l)), 10),
    catWidth = Math.min(160, Math.max(...catLabels.map((l) => textWidth(l)), 10));
  const lastTick = horizontal ? valueLabels.at(-1) : xTicks?.ticks.at(-1)?.label;
  let left = 12 + (horizontal ? catWidth : valueWidth) + 8 + (yLabel && !horizontal ? 20 : 0),
    right = Math.max(20, lastTick ? textWidth(lastTick) / 2 + 6 : 0),
    top = 14,
    bottom = 12 + (rotate ? Math.min(110, catWidth * 0.72 + 8) : FONT + 10) + (xLabel || (horizontal && yLabel) ? 20 : 0);
  let legend = null;
  if (legendMode !== "none" && list.length) {
    if (legendMode === "right") {
      legend = legendLayout(list.map((s) => s.label), 0, { column: true });
      right += legend.width + 16;
    } else {
      legend = legendLayout(list.map((s) => s.label), W - left - right);
      if (legendMode === "bottom") bottom += legend.height + 8;
      else top += legend.height + 8;
    }
    legend.kinds = overlay.map((line) => (line ? "linespoints" : kind));
  }
  const pw = Math.max(40, W - left - right), ph = Math.max(40, H - top - bottom);
  const vScale = (v) => {
    if (y.log) {
      const a = Math.log10(yTicks.min), b = Math.log10(yTicks.max);
      return (Math.log10(v) - a) / (b - a);
    }
    return (v - yTicks.min) / (yTicks.max - yTicks.min);
  };
  const valuePos = horizontal ? (v) => left + vScale(v) * pw : (v) => top + ph - vScale(v) * ph;
  const band = (horizontal ? ph : pw) / Math.max(1, n);
  const catPos = horizontal ? (i) => top + band * (i + 0.5) : (i) => left + band * (i + 0.5);
  const xPos = categorical
    ? (i) => catPos(i)
    : (i) => left + ((x.values[i] - xTicks.min) / (xTicks.max - xTicks.min)) * pw;
  const out = [];
  // Grid and value ticks.
  const zero = y.log ? null : Math.min(Math.max(0, yTicks.min), yTicks.max);
  out.push('<g class="chart-grid">');
  for (const t of yTicks.ticks) {
    const p = valuePos(t);
    out.push(horizontal
      ? `<line x1="${r1(p)}" x2="${r1(p)}" y1="${r1(top)}" y2="${r1(top + ph)}"/>`
      : `<line x1="${r1(left)}" x2="${r1(left + pw)}" y1="${r1(p)}" y2="${r1(p)}"/>`);
  }
  if (spec.grid && !horizontal) {
    const xs = categorical ? (kind === "bar" ? [] : x.values.map((_, i) => catPos(i))) : xTicks.ticks.map((t) => left + ((t.value - xTicks.min) / (xTicks.max - xTicks.min)) * pw);
    for (const p of xs) out.push(`<line x1="${r1(p)}" x2="${r1(p)}" y1="${r1(top)}" y2="${r1(top + ph)}"/>`);
  }
  out.push("</g><g class=\"chart-axis-labels\">");
  for (const [i, t] of yTicks.ticks.entries()) {
    const p = valuePos(t);
    out.push(horizontal ? text(p, top + ph + FONT + 6, valueLabels[i]) : text(left - 8, p, valueLabels[i], { anchor: "end", dy: "0.35em" }));
  }
  // Category or x ticks.
  if (categorical) {
    const every = rotate ? Math.max(1, Math.ceil(14 / band)) : Math.max(1, Math.ceil((catWidth + 8) / band));
    for (let i = 0; i < n; i += horizontal ? Math.max(1, Math.ceil(14 / band)) : every) {
      const label = catLabels[i];
      if (horizontal) out.push(text(left - 8, catPos(i), fit(label, catWidth), { anchor: "end", dy: "0.35em", full: label }));
      else if (rotate) {
        const px = catPos(i), py = top + ph + 10;
        out.push(text(px, py, fit(label, 150), { anchor: "end", dy: "0.35em", transform: `rotate(-45 ${r1(px)} ${r1(py)})`, full: label }));
      } else out.push(text(catPos(i), top + ph + FONT + 6, fit(label, band * every - 4), { full: label }));
    }
  } else {
    for (const t of xTicks.ticks) {
      const p = left + ((t.value - xTicks.min) / (xTicks.max - xTicks.min)) * pw;
      out.push(text(p, top + ph + FONT + 6, t.label));
    }
  }
  if (yLabel && !horizontal) {
    const cx = 14, cy = top + ph / 2;
    out.push(text(cx, cy, fit(yLabel, ph), { cls: "chart-axis-title", dy: "0.35em", transform: `rotate(-90 ${cx} ${r1(cy)})`, full: yLabel }));
  }
  const xTitle = horizontal ? yLabel : xLabel;
  if (xTitle) out.push(text(left + pw / 2, H - 8 - (legendMode === "bottom" && legend ? legend.height + 8 : 0), fit(xTitle, pw), { cls: "chart-axis-title", full: xTitle }));
  out.push("</g>");
  // Axis lines: the category baseline sits at zero when it is in range.
  const base = zero !== null ? valuePos(zero) : horizontal ? left : top + ph;
  out.push(horizontal
    ? `<g class="chart-axis"><line x1="${r1(base)}" x2="${r1(base)}" y1="${r1(top)}" y2="${r1(top + ph)}"/></g>`
    : `<g class="chart-axis"><line x1="${r1(left)}" x2="${r1(left + pw)}" y1="${r1(base)}" y2="${r1(base)}"/></g>`);
  const label = (s, i) => `${s.label ? `${s.label} · ` : ""}${catLabels[i]}: ${s.text?.[i] ?? formatNumber(s.values[i])}`;
  const ok = (v) => typeof v === "number" && Number.isFinite(v) && (!y.log || v > 0);
  const clamp = (p) => Math.min(Math.max(p, horizontal ? left : top), horizontal ? left + pw : top + ph);
  out.push('<g class="chart-marks">');
  if (kind === "bar") {
    const group = band * 0.8, width = stacked ? group : group / Math.max(1, barCount);
    for (const [s, item] of list.entries()) {
      if (overlay[s]) continue;
      out.push(`<g class="chart-series ${series(s)}">`);
      for (let i = 0; i < n; i++) {
        const v = item.values[i];
        if (!ok(v)) continue;
        const [a, b] = stacked ? stack[i][s] : [y.log ? yTicks.min : zero, v];
        const p1 = clamp(valuePos(a)), p2 = clamp(valuePos(b)),
          offset = catPos(i) - group / 2 + (stacked ? 0 : slots[s] * width);
        out.push(horizontal
          ? `<rect class="chart-bar" x="${r1(Math.min(p1, p2))}" y="${r1(offset)}" width="${r1(Math.max(0.5, Math.abs(p2 - p1)))}" height="${r1(Math.max(0.5, width - 1))}">${tip(label(item, i))}</rect>`
          : `<rect class="chart-bar" x="${r1(offset)}" y="${r1(Math.min(p1, p2))}" width="${r1(Math.max(0.5, width - 1))}" height="${r1(Math.max(0.5, Math.abs(p2 - p1)))}">${tip(label(item, i))}</rect>`);
      }
      out.push("</g>");
    }
    for (const [s, item] of list.entries()) {
      if (!overlay[s]) continue;
      let d = "";
      const marks = [];
      for (let i = 0; i < n; i++) {
        if (!ok(item.values[i])) continue;
        const px = catPos(i), py = clamp(valuePos(item.values[i]));
        d += `${d ? "L" : "M"}${r1(px)} ${r1(py)}`;
        marks.push(`<path class="chart-marker" d="${marker(s, px, py)}">${tip(label(item, i))}</path>`);
      }
      out.push(`<g class="chart-series chart-overlay ${series(s)}">${d ? `<path class="chart-line" d="${d}"/>` : ""}${marks.join("")}</g>`);
    }
  } else if (kind === "area") {
    for (const [s, item] of list.entries()) {
      const upper = [], lower = [];
      for (let i = 0; i < n; i++) {
        const [a, b] = stacked ? stack[i][s] || [0, 0] : [0, ok(item.values[i]) ? item.values[i] : 0];
        upper.push(`${r1(xPos(i))} ${r1(clamp(valuePos(b)))}`);
        lower.unshift(`${r1(xPos(i))} ${r1(clamp(valuePos(a)))}`);
      }
      out.push(`<g class="chart-series ${series(s)}"><path class="chart-area" d="M${upper.join("L")}L${lower.join("L")}Z"/><path class="chart-line" d="M${upper.join("L")}"/>`);
      for (let i = 0; i < n; i++)
        if (ok(item.values[i])) out.push(`<circle class="chart-hit" cx="${r1(xPos(i))}" cy="${r1(clamp(valuePos(stacked ? stack[i][s][1] : item.values[i])))}" r="5">${tip(label(item, i))}</circle>`);
      out.push("</g>");
    }
  } else {
    const showMarkers = kind === "points" || kind === "linespoints" || n <= 40;
    for (const [s, item] of list.entries()) {
      out.push(`<g class="chart-series ${series(s)}">`);
      if (kind !== "points") {
        let d = "", open = false;
        for (let i = 0; i < n; i++) {
          if (!ok(item.values[i]) || !Number.isFinite(xPos(i))) {
            open = false;
            continue;
          }
          const px = r1(xPos(i)), py = r1(clamp(valuePos(item.values[i])));
          if (!open) d += `M${px} ${py}`;
          else d += kind === "steps" ? `H${px}V${py}` : `L${px} ${py}`;
          open = true;
        }
        if (d) out.push(`<path class="chart-line" d="${d}"/>`);
      }
      for (let i = 0; i < n; i++) {
        if (!ok(item.values[i]) || !Number.isFinite(xPos(i))) continue;
        const px = xPos(i), py = clamp(valuePos(item.values[i]));
        out.push(showMarkers
          ? `<path class="chart-marker" d="${marker(s, px, py, kind === "points" ? 4 : 3.5)}">${tip(label(item, i))}</path>`
          : `<circle class="chart-hit" cx="${r1(px)}" cy="${r1(py)}" r="4">${tip(label(item, i))}</circle>`);
      }
      out.push("</g>");
    }
  }
  out.push("</g>");
  if (legend) {
    const lx = legendMode === "right" ? left + pw + 24 : left,
      ly = legendMode === "bottom" ? H - legend.height - 4 : legendMode === "right" ? top : 8;
    out.push(legendSVG(legend, lx, ly, kind));
  }
  const xDescription = categorical
    ? `${n} categories${xLabel ? ` of ${xLabel}` : ""}`
    : `${n} points${xLabel ? ` by ${xLabel}` : ""}`;
  return {
    svg: out.join(""),
    summary: `${KIND_NAMES[kind]}${stacked && kind === "bar" ? " (stacked)" : ""}${horizontal ? " (horizontal)" : ""} of ${seriesNames(list.filter((_, s) => !overlay[s]))}${overlay.some(Boolean) ? ` with a line for ${seriesNames(list.filter((_, s) => overlay[s]))}` : ""}, ${xDescription}; ${range(list.flatMap((s) => s.values), yTicks.step)}.`,
  };
}

/** Slices of the first series, clockwise from the top; more than eight merge into Other. */
function pieBody(spec) {
  const { series: list, x, W, H, diagnostics, kind } = spec, item = list[0] || { values: [] };
  let slices = x.values.map((_, i) => ({ label: x.labels[i], value: item.values[i], text: item.text?.[i], index: i }))
    .filter((s) => typeof s.value === "number" && Number.isFinite(s.value) && s.value > 0);
  if (slices.length > CHART_LIMITS.slices) {
    const keep = new Set(slices.slice().sort((a, b) => b.value - a.value).slice(0, CHART_LIMITS.slices - 1).map((s) => s.index));
    const rest = slices.filter((s) => !keep.has(s.index));
    diagnostics.push({ severity: "info", message: `Only ${CHART_LIMITS.slices - 1} slices are drawn separately; ${rest.length} smaller ones are merged into Other.` });
    slices = [...slices.filter((s) => keep.has(s.index)), { label: "Other", value: rest.reduce((sum, s) => sum + s.value, 0), other: true, count: rest.length }];
  }
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const pct = (v) => `${formatNumber((100 * v) / total, 0.1)}%`;
  const labels = slices.map((s) => `${s.label} (${pct(s.value)})`);
  const classes = slices.map((s, i) => (s.other ? "chart-other" : series(i)));
  const legend = legendBlock({ ...spec, legend: spec.legend || "right" }, labels, "bar", 14, classes);
  const top = 14 + legend.top, bottom = 14 + legend.bottom,
    R = Math.max(30, Math.min((W - legend.right) / 2 - 20, (H - top - bottom) / 2)),
    cx = legend.right ? Math.min((W - legend.right) / 2, 20 + R + (W - legend.right - 2 * R - 40) / 3) : W / 2,
    cy = top + (H - top - bottom) / 2,
    inner = kind === "donut" ? R * 0.58 : 0;
  const point = (angle, r) => `${r1(cx + r * Math.cos(angle))} ${r1(cy + r * Math.sin(angle))}`;
  const out = ['<g class="chart-marks">'];
  let angle = -Math.PI / 2;
  slices.forEach((slice, i) => {
    const sweep = (2 * Math.PI * slice.value) / total, end = angle + sweep, large = sweep > Math.PI ? 1 : 0;
    // A whole circle needs two arcs.
    const d = sweep >= 2 * Math.PI - 1e-9
      ? `M${point(angle, R)}A${r1(R)} ${r1(R)} 0 1 1 ${point(angle + Math.PI, R)}A${r1(R)} ${r1(R)} 0 1 1 ${point(angle, R)}Z${inner ? `M${point(angle, inner)}A${r1(inner)} ${r1(inner)} 0 1 0 ${point(angle + Math.PI, inner)}A${r1(inner)} ${r1(inner)} 0 1 0 ${point(angle, inner)}Z` : ""}`
      : inner
        ? `M${point(angle, R)}A${r1(R)} ${r1(R)} 0 ${large} 1 ${point(end, R)}L${point(end, inner)}A${r1(inner)} ${r1(inner)} 0 ${large} 0 ${point(angle, inner)}Z`
        : `M${r1(cx)} ${r1(cy)}L${point(angle, R)}A${r1(R)} ${r1(R)} 0 ${large} 1 ${point(end, R)}Z`;
    const name = slice.other ? `Other (${slice.count} rows)` : slice.label;
    out.push(`<g class="chart-series ${classes[i]}"><path class="chart-slice" fill-rule="evenodd" d="${d}">${tip(`${name}: ${slice.text ?? formatNumber(slice.value)} (${pct(slice.value)})`)}</path></g>`);
    angle = end;
  });
  if (inner) out.push(text(cx, cy, formatNumber(total), { cls: "chart-axis-title", dy: "0.35em" }));
  out.push("</g>");
  out.push(legend.svg);
  return {
    svg: out.join(""),
    summary: `${KIND_NAMES[kind]} of ${item.label || "values"}: ${slices.slice(0, 8).map((s) => `${s.label} ${pct(s.value)}`).join(", ")}; total ${formatNumber(total)}.`,
  };
}

function legendBlock(spec, labels, kind, top, classes) {
  const mode = spec.legend || (labels.length > 1 ? "top" : "none");
  if (mode === "none" || !labels.length) return { svg: "", top: 0, bottom: 0, right: 0 };
  if (mode === "right") {
    const layout = legendLayout(labels, 0, { column: true });
    return { svg: legendSVG(layout, spec.W - layout.width - 16, top, kind, classes), top: 0, bottom: 0, right: layout.width + 24 };
  }
  const layout = legendLayout(labels, spec.W - 40);
  return mode === "bottom"
    ? { svg: legendSVG(layout, 20, spec.H - layout.height - 4, kind, classes), top: 0, bottom: layout.height + 8, right: 0 }
    : { svg: legendSVG(layout, 20, 8, kind, classes), top: layout.height + 8, bottom: 0, right: 0 };
}

/** One axis per category, each scaled to its own [min, max], clockwise from the top. */
function radarBody(spec) {
  const { series: list, x, W, H } = spec, n = x.values.length,
    axes = spec.axes || x.values.map(() => ({})),
    ticks = Math.max(1, Math.min(50, Math.round(spec.ticks || 4)));
  const all = finite(list.flatMap((s) => s.values));
  const bounds = axes.map((a) => {
    const lo = Number.isFinite(a.min) ? a.min : Math.min(0, ...all), hi = Number.isFinite(a.max) ? a.max : Math.max(1, ...all);
    return [lo, hi > lo ? hi : lo + 1];
  });
  const legend = legendBlock(spec, list.map((s) => s.label), "radar", 8);
  const top = 14 + legend.top, bottom = 14 + legend.bottom;
  const labelWidth = Math.min(110, Math.max(...x.labels.map((l) => textWidth(l)), 20));
  const cx = (W - legend.right) / 2, cy = top + (H - top - bottom) / 2,
    R = Math.max(30, Math.min((W - legend.right) / 2 - labelWidth - 14, (H - top - bottom) / 2 - 22));
  const room = (px, anchor) => Math.min(200, anchor === "start" ? W - legend.right - px - 4 : anchor === "end" ? px - 4 : 2 * Math.min(px, W - legend.right - px) - 8);
  const angle = (i) => -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, n);
  const at = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  const out = ['<g class="chart-grid">'];
  for (let k = 1; k <= ticks; k++)
    out.push(`<path d="M${x.values.map((_, i) => at(i, (R * k) / ticks).map(r1).join(" ")).join("L")}Z"/>`);
  out.push('</g><g class="chart-axis">');
  for (let i = 0; i < n; i++) {
    const [px, py] = at(i, R);
    out.push(`<line x1="${r1(cx)}" y1="${r1(cy)}" x2="${r1(px)}" y2="${r1(py)}"/>`);
  }
  out.push('</g><g class="chart-axis-labels">');
  // Shared bounds label the first axis; otherwise each axis shows its maximum.
  const shared = bounds.every(([lo, hi]) => lo === bounds[0][0] && hi === bounds[0][1]),
    every = Math.max(1, Math.ceil(ticks / 5));
  for (let i = 0; i < (shared ? Math.min(1, n) : n); i++)
    for (let k = shared ? 0 : ticks; k <= ticks; k += every) {
      const [lo, hi] = bounds[i], step = (hi - lo) / ticks, c = Math.cos(angle(i));
      const [px, py] = at(i, shared ? (R * k) / ticks : R - 6), side = !shared && Math.abs(c) > 0.2;
      out.push(text(side ? px : px + 4, side ? py + 12 : py, formatNumber(lo + step * k, step), { anchor: side ? (c > 0 ? "end" : "start") : "start", dy: "0.35em", cls: "chart-tick chart-radar-tick" }));
    }
  for (let i = 0; i < n; i++) {
    const [px, py] = at(i, R + 12), c = Math.cos(angle(i)), sn = Math.sin(angle(i)),
      anchor = c > 0.2 ? "start" : c < -0.2 ? "end" : "middle";
    out.push(text(px, py + (sn > 0.3 ? 8 : sn < -0.3 ? -4 : 0), fit(x.labels[i], room(px, anchor)), { anchor, dy: "0.35em", full: x.labels[i] }));
  }
  out.push('</g><g class="chart-marks">');
  for (const [s, item] of list.entries()) {
    const points = x.values.map((_, i) => {
      const v = item.values[i], [lo, hi] = bounds[i];
      return at(i, typeof v === "number" && Number.isFinite(v) ? R * Math.min(1.1, Math.max(0, (v - lo) / (hi - lo))) : 0);
    });
    const d = `M${points.map((p) => p.map(r1).join(" ")).join("L")}Z`;
    out.push(`<g class="chart-series ${series(s)}"><path class="chart-area" d="${d}"/><path class="chart-line" d="${d}"/>`);
    points.forEach(([px, py], i) =>
      out.push(`<path class="chart-marker" d="${marker(s, px, py, 3.5)}">${tip(`${item.label ? `${item.label} · ` : ""}${x.labels[i]}: ${item.text?.[i] ?? formatNumber(item.values[i])}`)}</path>`));
    out.push("</g>");
  }
  out.push("</g>", legend.svg);
  return {
    svg: out.join(""),
    summary: `${KIND_NAMES.radar} of ${seriesNames(list)} over ${n} axes (${x.labels.slice(0, 6).map((l, i) => `${l} ${formatNumber(bounds[i][0])} to ${formatNumber(bounds[i][1])}`).join(", ")}${n > 6 ? ", …" : ""}); ${range(list.flatMap((s) => s.values))}.`,
  };
}

/** A matrix of colored cells: one row per series, one column per x value. */
function heatmapBody(spec) {
  const { series: list, x, W, H, diagnostics } = spec, cols = x.values.length, rows = list.length,
    all = finite(list.flatMap((s) => s.values));
  if (rows * cols > CHART_LIMITS.heatmapCells) {
    diagnostics.push({ severity: "warning", message: `Heatmaps draw at most ${CHART_LIMITS.heatmapCells.toLocaleString("en-US")} cells.` });
    return { svg: "", summary: `${KIND_NAMES.heatmap} not drawn.` };
  }
  const lo = all.length ? Math.min(...all) : 0, hi = all.length ? Math.max(...all) : 1;
  const bucket = (v) => (hi > lo ? Math.min(8, Math.floor(((v - lo) / (hi - lo)) * 9)) : 4) + 1;
  const rowLabels = list.map((s) => clip(s.label ?? ""));
  const yLabel = clip(spec.y?.label || "", 80), xLabel = clip(x.label || "", 80);
  const rotate = cols > 12, colWidth = Math.min(150, Math.max(...x.labels.map((l) => textWidth(l)), 10));
  const left = 12 + Math.min(160, Math.max(...rowLabels.map((l) => textWidth(l)), 10)) + 8 + (yLabel ? 20 : 0),
    right = 70, top = 14, bottom = 12 + (rotate ? Math.min(110, colWidth * 0.72 + 8) : FONT + 10) + (xLabel ? 20 : 0);
  const pw = Math.max(40, W - left - right), ph = Math.max(40, H - top - bottom), cw = pw / Math.max(1, cols), ch = ph / Math.max(1, rows);
  const out = ['<g class="chart-marks">'];
  const showText = cw >= 34 && ch >= 16;
  list.forEach((item, r) =>
    x.values.forEach((_, c) => {
      const v = item.values[c], ok = typeof v === "number" && Number.isFinite(v), q = ok ? bucket(v) : 0;
      const cell = `<rect class="chart-cell ${ok ? `chart-q${q}` : "chart-cell-empty"}" x="${r1(left + c * cw)}" y="${r1(top + r * ch)}" width="${r1(cw - 1)}" height="${r1(ch - 1)}">${tip(`${rowLabels[r]} · ${x.labels[c]}: ${item.text?.[c] ?? formatNumber(v)}`)}</rect>`;
      out.push(cell);
      if (showText && ok) out.push(text(left + c * cw + cw / 2, top + r * ch + ch / 2, fit(item.text?.[c] ?? formatNumber(v), cw - 6, 11), { cls: q >= 6 ? "chart-cell-text chart-cell-text-light" : "chart-cell-text", dy: "0.35em" }));
    }));
  out.push('</g><g class="chart-axis-labels">');
  const every = Math.max(1, Math.ceil(14 / ch));
  list.forEach((_, r) => {
    if (r % every === 0) out.push(text(left - 8, top + r * ch + ch / 2, fit(rowLabels[r], left - 20), { anchor: "end", dy: "0.35em", full: rowLabels[r] }));
  });
  const colEvery = rotate ? Math.max(1, Math.ceil(14 / cw)) : Math.max(1, Math.ceil((colWidth + 8) / cw));
  for (let c = 0; c < cols; c += colEvery) {
    const px = left + c * cw + cw / 2, py = top + ph + 10;
    out.push(rotate
      ? text(px, py, fit(x.labels[c], 150), { anchor: "end", dy: "0.35em", transform: `rotate(-45 ${r1(px)} ${r1(py)})`, full: x.labels[c] })
      : text(px, top + ph + FONT + 6, fit(x.labels[c], cw * colEvery - 4), { full: x.labels[c] }));
  }
  if (yLabel) out.push(text(14, top + ph / 2, fit(yLabel, ph), { cls: "chart-axis-title", dy: "0.35em", transform: `rotate(-90 14 ${r1(top + ph / 2)})`, full: yLabel }));
  if (xLabel) out.push(text(left + pw / 2, H - 8, fit(xLabel, pw), { cls: "chart-axis-title", full: xLabel }));
  // Color legend: the ramp from the maximum (top) to the minimum.
  const lx = left + pw + 16, step = ph / 9;
  out.push('</g><g class="chart-legend">');
  for (let q = 9; q >= 1; q--) out.push(`<rect class="chart-q${q}" x="${r1(lx)}" y="${r1(top + (9 - q) * step)}" width="12" height="${r1(step + 0.5)}"/>`);
  const tickStep = (hi - lo) / 2 || 1;
  out.push(text(lx + 18, top, formatNumber(hi, tickStep), { anchor: "start", dy: "0.7em", cls: "chart-legend-text" }));
  out.push(text(lx + 18, top + ph, formatNumber(lo, tickStep), { anchor: "start", cls: "chart-legend-text" }));
  out.push("</g>");
  return {
    svg: out.join(""),
    summary: `${KIND_NAMES.heatmap} of ${rows} rows by ${cols} columns${xLabel ? ` of ${xLabel}` : ""}; ${range(all)}.`,
  };
}

/** Wrap a chart in an accessible figure with a scrollable region and caption. */
export function chartFigure({ svg, title = "", note = "", label = "Chart" }) {
  const caption = [
    title ? `<span class="chart-title">${escapeHTML(clip(title))}</span>` : "",
    note ? `<span class="chart-note">${escapeHTML(note)}</span>` : "",
  ].filter(Boolean).join(" ");
  return `<figure class="chart"><div class="chart-scroll" role="region" aria-label="${escapeHTML(clip(title ? `${label}: ${title}` : label))}" tabindex="0">${svg}</div>${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
}
