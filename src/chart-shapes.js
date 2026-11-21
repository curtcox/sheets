import { CHART_LIMITS, formatNumber, FONT, KIND_NAMES, r1, textWidth, clip, fit, series, marker, tip, text, finite, seriesNames, range, legendBlock } from "./chart-parts.js";

// Pie, donut, radar and heatmap bodies for chartSVG in charts.js.
/** Slices of the first series, clockwise from the top; more than eight merge into Other. */
export function pieBody(spec) {
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

/** One axis per category, each scaled to its own [min, max], clockwise from the top. */
export function radarBody(spec) {
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
export function heatmapBody(spec) {
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
