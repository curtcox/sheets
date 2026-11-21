import { escapeHTML } from "./util.js";
import { CHART_LIMITS, CHART_SIZES, CHART_KINDS, formatNumber, niceTicks, timeTicks, FONT, KIND_NAMES, r1, textWidth, clip, fit, series, logTicks, marker, tip, text, legendLayout, legendSVG, finite, seriesNames, range } from "./chart-parts.js";
import { heatmapBody, pieBody, radarBody } from "./chart-shapes.js";

// DOM-free SVG charts shared by every format. Marks carry classes, not colors;
// styles.css and the standalone export define the palette. Output is plain
// markup that passes through sanitize.js unchanged.
export { CHART_LIMITS, CHART_SIZES, CHART_PALETTE, CHART_RAMP, CHART_STYLES, CHART_KINDS, formatNumber, niceTicks, timeTicks } from "./chart-parts.js";

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

/** Wrap a chart in an accessible figure with a scrollable region and caption. */
export function chartFigure({ svg, title = "", note = "", label = "Chart" }) {
  const caption = [
    title ? `<span class="chart-title">${escapeHTML(clip(title))}</span>` : "",
    note ? `<span class="chart-note">${escapeHTML(note)}</span>` : "",
  ].filter(Boolean).join(" ");
  return `<figure class="chart"><div class="chart-scroll" role="region" aria-label="${escapeHTML(clip(title ? `${label}: ${title}` : label))}" tabindex="0">${svg}</div>${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
}
