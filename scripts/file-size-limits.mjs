// Per-file size limits enforced by scripts/check-file-sizes.mjs (pre-push hook,
// npm run check and CI). The first matching rule wins, so specific paths come
// before general extensions. Files already over their limit are listed in the
// ratchet baseline and may shrink but never grow.
const KiB = 1024;
const MiB = 1024 * KiB;
const ext = (...names) => new RegExp(`\\.(?:${names.join("|")})$`, "i");

// No baseline entry can exceed this. GitHub warns above 50 MB and rejects 100 MB.
export const HARD_CAP = 50 * MiB;

export const BASELINE_PATH = "scripts/file-size-baseline.json";

export const rules = [
  // Generated and vendored files: limits stop repository bloat, not style.
  // Regenerate them from their scripts rather than trimming by hand.
  { label: "lockfile", test: /^package-lock\.json$/, limit: 1 * MiB },
  {
    label: "generated manifest",
    test: /^(?:offline-assets\.js|src\/gallery-catalog\.js|docs\/compatibility\.json|docs\/limitations\.md|ai-comparison\.json)$/,
    limit: 512 * KiB,
  },
  { label: "vendored wasm", test: /^vendor\/.*\.wasm$/, limit: 20 * MiB },
  { label: "vendored script", test: /^vendor\/.*\.(?:js|mjs|cjs)$/, limit: 2 * MiB },
  { label: "vendored font", test: /^vendor\/.*\.(?:woff2?|ttf|otf)$/, limit: 1 * MiB },
  { label: "vendored file", test: /^vendor\//, limit: 512 * KiB },
  { label: "reference fixture", test: /^tests\/fixtures\//, limit: 256 * KiB },

  // Hand-written files: limits keep files reviewable.
  { label: "source", test: ext("js", "mjs", "cjs", "ts", "css", "html", "py", "sh", "el"), limit: 32 * KiB },
  { label: "prose", test: ext("md", "txt"), limit: 48 * KiB },
  { label: "data", test: ext("json", "csv", "tsv", "xml", "ya?ml", "patch"), limit: 64 * KiB },
  {
    label: "sheet document",
    test: ext("org", "bean", "qmd", "calca", "calc", "hurmet", "nbt", "am"),
    limit: 16 * KiB,
  },
  { label: "vector image", test: ext("svg"), limit: 64 * KiB },
  { label: "raster image", test: ext("png", "jpe?g", "gif", "webp", "avif", "ico"), limit: 256 * KiB },
  { label: "font", test: ext("woff2?", "ttf", "otf"), limit: 512 * KiB },
  { label: "wasm", test: ext("wasm"), limit: 2 * MiB },
  { label: "other", test: /(?:)/, limit: 256 * KiB },
];

export function ruleFor(path) {
  return rules.find((rule) => rule.test.test(path));
}
