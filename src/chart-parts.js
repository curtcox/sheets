import { escapeHTML } from "./util.js";

// Constants, scales, text and legend helpers shared by the chart renderers in
// charts.js (axes) and chart-shapes.js (pie, radar, heatmap).
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
export const FONT = 12;
export const KIND_NAMES = {
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
export const r1 = (value) => Math.round(value * 10) / 10;
export const textWidth = (text, size = FONT) => [...String(text)].length * size * 0.6;
export const clip = (text, limit = CHART_LIMITS.label) => {
  const chars = [...String(text ?? "")];
  return chars.length > limit ? chars.slice(0, limit - 1).join("") + "…" : chars.join("");
};
/** Shorten text to roughly `width` pixels, keeping the full text available for <title>. */
export function fit(text, width, size = FONT) {
  const chars = [...text], room = Math.max(1, Math.floor(width / (size * 0.6)));
  return chars.length > room ? chars.slice(0, Math.max(1, room - 1)).join("") + "…" : text;
}
export const series = (index) => `chart-s${(index % 8) + 1}${index >= 8 ? " chart-alt" : ""}`;

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

export function logTicks(min, max) {
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
export const marker = (index, x, y, size = 3.5) => MARKERS[index % MARKERS.length](x, y, size);
export const tip = (text) => `<title>${escapeHTML(clip(text, 400))}</title>`;
export const text = (x, y, content, { anchor = "middle", cls = "chart-tick", dy, transform, full } = {}) =>
  `<text class="${cls}" x="${r1(x)}" y="${r1(y)}"${anchor === "middle" ? ' text-anchor="middle"' : anchor === "end" ? ' text-anchor="end"' : ""}${dy ? ` dy="${dy}"` : ""}${transform ? ` transform="${transform}"` : ""}>${full && full !== content ? tip(full) : ""}${escapeHTML(content)}</text>`;

export function legendLayout(labels, width, { kind, column = false } = {}) {
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
export function legendSVG(layout, left, top, kind, classes = []) {
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

export function finite(values) {
  return values.filter((v) => typeof v === "number" && Number.isFinite(v));
}

export function seriesNames(list) {
  const names = list.map((s) => s.label || "series");
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more` : names.join(", ");
}
export function range(values, step) {
  const v = finite(values);
  return v.length ? `values from ${formatNumber(Math.min(...v), step)} to ${formatNumber(Math.max(...v), step)}` : "no numeric values";
}

export function legendBlock(spec, labels, kind, top, classes) {
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
