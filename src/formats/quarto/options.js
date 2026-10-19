import * as yaml from "../../../vendor/js-yaml.js";

const mapping = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const booleans = new Set([
  "echo",
  "eval",
  "output",
  "enabled",
  "include",
  "warning",
  "error",
]);
const dimensions = new Set(["fig-width", "fig-height"]);
const cellKeys = new Set([
  "echo",
  "eval",
  "output",
  "include",
  "warning",
  "error",
  "label",
  "fig-cap",
  "fig-alt",
  ...dimensions,
]);

// The YAML event stream provides positions for block, flow and quoted keys.
// Use the same parser/schema for construction; do not infer YAML with regexes.
export function readOptions(source, origins, diagnostics, context) {
  const starts = [0];
  for (let i = 0; i < source.length; i++)
    if (source[i] === "\n") starts.push(i + 1);
  const position = (offset) => {
    let low = 0,
      high = starts.length;
    while (low + 1 < high) {
      const mid = (low + high) >>> 1;
      if (starts[mid] <= offset) low = mid;
      else high = mid;
    }
    return {
      line: origins[low]?.line ?? origins.at(-1)?.line ?? 1,
      column: (origins[low]?.column ?? 0) + offset - starts[low],
    };
  };
  const locations = new Map();
  if (!source.trim()) return { value: {}, locations };
  try {
    const events = yaml.parseEvents(source),
      frames = [];
    const nextPath = () => {
      const parent = frames.at(-1);
      if (!parent) return [];
      const path = [...parent.path, parent.key ?? ""];
      parent.key = null;
      return path;
    };
    for (const event of events) {
      if ([yaml.EVENT_MAPPING, yaml.EVENT_SEQUENCE].includes(event.type)) {
        frames.push({
          path: nextPath(),
          key: null,
          mapping: event.type === yaml.EVENT_MAPPING,
        });
      } else if (event.type === yaml.EVENT_POP) frames.pop();
      else if ([yaml.EVENT_SCALAR, yaml.EVENT_ALIAS].includes(event.type)) {
        const frame = frames.at(-1);
        if (frame?.mapping && frame.key === null) {
          frame.key =
            event.type === yaml.EVENT_SCALAR
              ? yaml.getScalarValue(source, event)
              : "";
          locations.set(
            [...frame.path, frame.key].join("."),
            position(event.valueStart ?? event.anchorStart),
          );
        } else nextPath();
      }
    }
    const value = yaml.load(source, { schema: yaml.JSON_SCHEMA }) ?? {};
    if (!mapping(value)) throw new Error(`${context} must be a mapping.`);
    return { value, locations };
  } catch (error) {
    diagnostics.push({
      ...position(error.mark?.position ?? 0),
      message: error.reason || error.message,
    });
    return { value: {}, locations };
  }
}

export function validateOptions(parsed, diagnostics, context, fallback) {
  const result = {},
    { value, locations } = parsed;
  const report = (key, message) =>
    diagnostics.push({ ...(locations.get(key) || fallback), message });
  for (const [key, item] of Object.entries(value)) {
    const path = context === "defaults" ? `execute.${key}` : key;
    const allowed =
      context === "metadata"
        ? new Set([
            "title",
            "author",
            "date",
            "format",
            "execute",
            ...dimensions,
          ])
        : context === "defaults"
          ? booleans
          : cellKeys;
    if (!allowed.has(key)) {
      report(
        path,
        `Unsupported ${context === "metadata" ? "metadata" : "cell option"}: ${key}.`,
      );
      continue;
    }
    if (key === "execute") {
      if (typeof item === "boolean") result.execute = item;
      else if (mapping(item))
        result.execute = validateOptions(
          { value: item, locations },
          diagnostics,
          "defaults",
          locations.get(key) || fallback,
        );
      else report(key, "execute must be a boolean or a mapping.");
    } else if (dimensions.has(key)) {
      if (
        typeof item === "number" &&
        Number.isFinite(item) &&
        item > 0 &&
        item <= 20
      )
        result[key] = item;
      else
        report(
          path,
          `${key} must be a finite number greater than 0 and at most 20 inches.`,
        );
    } else if (booleans.has(key)) {
      if (typeof item === "boolean") result[key] = item;
      else report(path, `${key} must be a YAML boolean (true or false).`);
    } else if (key === "format") {
      if (item !== "html")
        report(key, "Only format: html is supported; Sheets renders HTML.");
      else result.format = item;
    } else if (
      typeof item !== "string" &&
      !(key === "date" && typeof item === "number")
    ) {
      report(
        path,
        `${key} must be plain text${key === "date" ? " or a year" : ""}.`,
      );
    } else if (key === "label" && !/^[A-Za-z][\w-]*$/.test(item)) {
      report(
        path,
        "label must start with a letter and contain only letters, digits, underscores or hyphens.",
      );
    } else result[key] = item;
  }
  return result;
}
