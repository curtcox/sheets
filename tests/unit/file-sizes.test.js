import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { HARD_CAP, ruleFor } from "../../scripts/file-size-limits.mjs";
import { evaluate, record, staleEntries, tighten } from "../../scripts/check-file-sizes.mjs";

const KiB = 1024;
const script = fileURLToPath(new URL("../../scripts/check-file-sizes.mjs", import.meta.url));

test("file size rules separate generated, vendored and hand-written files", () => {
  const cases = {
    "src/app.js": "source",
    "scripts/check.mjs": "source",
    "src/styles.css": "source",
    "README.md": "prose",
    "docs/limitations.md": "generated manifest",
    "offline-assets.js": "generated manifest",
    "package-lock.json": "lockfile",
    "vendor/mermaid@12.2.0/index.js": "vendored script",
    "vendor/numbat@1.24.0/numbat_wasm_bg.wasm": "vendored wasm",
    "vendor/dompurify@3.4.17/LICENSE-MPL": "vendored file",
    "tests/fixtures/gfm-spec.txt": "reference fixture",
    "examples/org/mortgage.org": "sheet document",
    "gallery/covers/org-hire.png": "raster image",
    "src/icon.svg": "vector image",
    "LICENSE": "other",
  };
  for (const [path, label] of Object.entries(cases)) assert.equal(ruleFor(path).label, label, path);
});

test("ratchet allows baselined files to shrink but not grow", () => {
  const baseline = { "src/big.js": 40 * KiB };
  const kinds = (files) => evaluate(files, baseline).map((p) => `${p.path}:${p.kind}`);
  assert.deepEqual(kinds([{ path: "src/big.js", size: 40 * KiB }]), []);
  assert.deepEqual(kinds([{ path: "src/big.js", size: 36 * KiB }]), []);
  assert.deepEqual(kinds([{ path: "src/big.js", size: 41 * KiB }]), ["src/big.js:grew"]);
  assert.deepEqual(kinds([{ path: "src/new.js", size: 33 * KiB }]), ["src/new.js:new"]);
  assert.deepEqual(kinds([{ path: "src/ok.js", size: 32 * KiB }]), []);
  assert.deepEqual(kinds([{ path: "src/big.js", size: HARD_CAP + 1 }]), ["src/big.js:hard-cap"]);
});

test("stale baseline entries are reported and tightened, never raised", () => {
  const baseline = { "src/a.js": 40 * KiB, "src/b.js": 40 * KiB, "src/gone.js": 40 * KiB, "src/same.js": 40 * KiB };
  const files = [
    { path: "src/a.js", size: 36 * KiB },
    { path: "src/b.js", size: 30 * KiB },
    { path: "src/same.js", size: 40 * KiB },
    { path: "src/new.js", size: 50 * KiB },
  ];
  assert.deepEqual(
    staleEntries(files, baseline).map((s) => s.path),
    ["src/a.js", "src/b.js", "src/gone.js"],
  );
  assert.deepEqual(tighten(files, baseline), { "src/a.js": 36 * KiB, "src/same.js": 40 * KiB });
  assert.deepEqual(record(files, baseline), { "src/a.js": 36 * KiB, "src/same.js": 40 * KiB, "src/new.js": 50 * KiB });
});

test("pre-push hook rejects oversized blobs, including ones removed before the tip", () => {
  const dir = mkdtempSync(join(tmpdir(), "sheets-sizes-"));
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@example.invalid",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@example.invalid",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
  };
  const git = (...args) => execFileSync("git", args, { cwd: dir, env, encoding: "utf8" }).trim();
  const commit = (message) => {
    git("add", "-A");
    git("commit", "-q", "--allow-empty", "-m", message);
    return git("rev-parse", "HEAD");
  };
  const push = (local, remote) =>
    spawnSync(process.execPath, [script, "--pre-push"], {
      cwd: dir,
      env,
      encoding: "utf8",
      input: `refs/heads/main ${local} refs/heads/main ${remote}\n`,
    });
  try {
    git("init", "-q", "-b", "main");
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "src/small.js"), "export const x = 1;\n");
    const base = commit("base");
    writeFileSync(join(dir, "src/big.js"), "x".repeat(40 * KiB));
    commit("add big");
    rmSync(join(dir, "src/big.js"));
    const tip = commit("remove big");
    writeFileSync(join(dir, "src/small.js"), "export const x = 2;\n");
    const fine = commit("small change");

    const rejected = push(tip, base);
    assert.equal(rejected.status, 1, rejected.stderr);
    assert.match(rejected.stderr, /src\/big\.js: 40\.0 KiB exceeds the 32\.0 KiB limit for source/);
    assert.equal(push(fine, tip).status, 0);
    assert.equal(push("0".repeat(40), base).status, 0, "branch deletions are ignored");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("pre-push hook is executable", () => {
  const mode = statSync(fileURLToPath(new URL("../../.githooks/pre-push", import.meta.url))).mode;
  assert.ok(mode & 0o111);
});
