// Complete deployment allowlist. Development tools and tests are never public assets.
export const publicAssets=["ai-comparison.json","ai-suite.json",
  "index.html",
  "gallery.html",
  "docs.html",
  "docs",
  "src",
  "vendor",
  "examples",
  ".nojekyll",
  "sw.js",
  "fragment-kit.config.json",
  "manifest.webmanifest",
  "gallery",
];
export const served = [...publicAssets, "offline-assets.js"];
