// Complete deployment allowlist. Development tools and tests are never public assets.
export const publicAssets = [
  "index.html",
  "gallery.html",
  "docs.html",
  "docs",
  "src",
  "vendor",
  "examples",
  ".nojekyll",
  "sw.js",
];
export const served = [...publicAssets, "offline-assets.json"];
