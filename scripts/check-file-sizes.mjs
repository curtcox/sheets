#!/usr/bin/env node
// Rejects files that exceed the per-type limits in scripts/file-size-limits.mjs.
//
//   node scripts/check-file-sizes.mjs             check tracked files in the working tree
//   node scripts/check-file-sizes.mjs --pre-push  check what `git push` would send (hook)
//   node scripts/check-file-sizes.mjs --tighten   lower or drop baseline entries (never raises)
//   node scripts/check-file-sizes.mjs --record    accept every current violation into the baseline
//
// Files already over their limit are listed in the ratchet baseline with their
// size. They may shrink but never grow; once one shrinks, --tighten records the
// new size so it cannot grow back.
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BASELINE_PATH, HARD_CAP, ruleFor } from "./file-size-limits.mjs";

const ZERO_SHA = /^0+$/;
const MAX_BUFFER = 256 * 1024 * 1024;

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

// files: [{path, size}]; baseline: {path: allowedBytes}. Returns violations.
export function evaluate(files, baseline) {
  const problems = [];
  const seen = new Set();
  for (const { path, size } of files) {
    const key = `${path}\0${size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const rule = ruleFor(path);
    const allowed = baseline[path];
    if (size > HARD_CAP) problems.push({ path, size, kind: "hard-cap", rule, allowed });
    else if (size <= rule.limit) continue;
    else if (allowed === undefined) problems.push({ path, size, kind: "new", rule });
    else if (size > allowed) problems.push({ path, size, kind: "grew", rule, allowed });
  }
  return problems;
}

// Baseline entries that no longer match reality and should be tightened.
export function staleEntries(files, baseline) {
  const sizes = new Map(files.map((file) => [file.path, file.size]));
  const stale = [];
  for (const [path, allowed] of Object.entries(baseline)) {
    const size = sizes.get(path);
    if (size === undefined) stale.push({ path, allowed, reason: "file no longer exists" });
    else if (size <= ruleFor(path).limit) stale.push({ path, allowed, size, reason: "now within its limit" });
    else if (size < allowed) stale.push({ path, allowed, size, reason: "shrank" });
  }
  return stale;
}

export function tighten(files, baseline) {
  const sizes = new Map(files.map((file) => [file.path, file.size]));
  const next = {};
  for (const [path, allowed] of Object.entries(baseline)) {
    const size = sizes.get(path);
    if (size === undefined || size <= ruleFor(path).limit) continue;
    next[path] = Math.min(size, allowed);
  }
  return next;
}

export function record(files, baseline) {
  const next = tighten(files, baseline);
  for (const { path, size } of files) {
    if (size > ruleFor(path).limit && size <= HARD_CAP) next[path] = Math.max(size, next[path] ?? 0);
  }
  return next;
}

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: MAX_BUFFER, ...options });
}

function worktreeFiles() {
  const files = [];
  for (const path of git(["ls-files", "-z"]).split("\0").filter(Boolean)) {
    let stat;
    try {
      stat = lstatSync(path);
    } catch {
      continue; // deleted but not yet staged
    }
    if (!stat.isDirectory()) files.push({ path, size: stat.size });
  }
  return files;
}

function treeFiles(ref) {
  return git(["ls-tree", "-r", "-l", "-z", ref])
    .split("\0")
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t");
      const [, type, , size] = line.slice(0, tab).split(/\s+/);
      return type === "blob" ? { path: line.slice(tab + 1), size: Number(size) } : null;
    })
    .filter(Boolean);
}

function commitExists(sha) {
  try {
    git(["cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Every blob reachable from `local` that the remote does not already have,
// including blobs added and later removed by intermediate commits.
function newBlobs(local, remote) {
  const exclude = !ZERO_SHA.test(remote) && commitExists(remote) ? [remote] : ["--remotes"];
  const objects = git(["rev-list", "--objects", local, "--not", ...exclude]);
  if (!objects.trim()) return [];
  return git(["cat-file", "--batch-check=%(objecttype) %(objectsize) %(rest)"], { input: objects })
    .split("\n")
    .map((line) => line.match(/^blob (\d+) (.+)$/))
    .filter(Boolean)
    .map(([, size, path]) => ({ path, size: Number(size) }));
}

function parseBaseline(text) {
  const parsed = JSON.parse(text);
  return parsed.files ?? {};
}

function baselineAt(ref) {
  try {
    return parseBaseline(git(["show", `${ref}:${BASELINE_PATH}`], { stdio: ["ignore", "pipe", "ignore"] }));
  } catch {
    return {};
  }
}

function worktreeBaseline() {
  try {
    return parseBaseline(readFileSync(BASELINE_PATH, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

function writeBaseline(files) {
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)));
  const body = {
    description:
      "Size ratchet for files over their limit in scripts/file-size-limits.mjs. Entries may only shrink; run node scripts/check-file-sizes.mjs --tighten after shrinking a file.",
    files: sorted,
  };
  writeFileSync(BASELINE_PATH, `${JSON.stringify(body, null, 2)}\n`);
}

function describe(problem) {
  const { path, size, kind, rule, allowed } = problem;
  const limit = `${formatSize(rule.limit)} limit for ${rule.label}`;
  if (kind === "hard-cap") return `${path}: ${formatSize(size)} exceeds the ${formatSize(HARD_CAP)} hard cap`;
  if (kind === "grew") return `${path}: ${formatSize(size)} grew past its ratchet of ${formatSize(allowed)} (${limit})`;
  return `${path}: ${formatSize(size)} exceeds the ${limit}`;
}

function report(problems, stale) {
  if (problems.length) {
    console.error("File size check failed:");
    for (const problem of problems) console.error(`  ${describe(problem)}`);
    console.error(
      "Split, shrink or regenerate these files, or adjust scripts/file-size-limits.mjs if a whole type needs a\n" +
        "different limit. To accept a deliberate exception, run node scripts/check-file-sizes.mjs --record\n" +
        `and commit ${BASELINE_PATH} so reviewers see it.`,
    );
  }
  if (stale.length) {
    console.error("The file size ratchet can be tightened:");
    for (const { path, allowed, size, reason } of stale) {
      const now = size === undefined ? "" : `, now ${formatSize(size)}`;
      console.error(`  ${path}: baseline ${formatSize(allowed)}${now} (${reason})`);
    }
    console.error(`Run node scripts/check-file-sizes.mjs --tighten and commit ${BASELINE_PATH}.`);
  }
  return problems.length || stale.length ? 1 : 0;
}

function prePush(stdin) {
  let problems = [];
  let stale = [];
  for (const line of stdin.split("\n").filter(Boolean)) {
    const [, local, , remote] = line.split(" ");
    if (!local || ZERO_SHA.test(local)) continue; // branch deletion
    const baseline = baselineAt(local);
    const tip = treeFiles(local);
    problems = problems.concat(evaluate([...newBlobs(local, remote), ...tip], baseline));
    stale = stale.concat(staleEntries(tip, baseline));
  }
  return report(problems, stale);
}

function main(argv) {
  const [mode = "--check"] = argv;
  if (mode === "--help" || mode === "-h") {
    console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 11).join("\n"));
    return 0;
  }
  if (mode === "--pre-push") return prePush(readFileSync(0, "utf8"));
  const files = worktreeFiles();
  const baseline = worktreeBaseline();
  if (mode === "--tighten" || mode === "--record") {
    const next = mode === "--tighten" ? tighten(files, baseline) : record(files, baseline);
    writeBaseline(next);
    const before = Object.keys(baseline).length;
    const after = Object.keys(next).length;
    console.log(`Wrote ${BASELINE_PATH}: ${after} entries (was ${before}).`);
    return report(evaluate(files, next), []);
  }
  if (mode !== "--check") {
    console.error(`Unknown option ${mode}. Use --help.`);
    return 2;
  }
  const status = report(evaluate(files, baseline), staleEntries(files, baseline));
  if (!status) {
    const ratcheted = Object.keys(baseline).length;
    console.log(`File sizes OK for ${files.length} files (${ratcheted} held by the ratchet).`);
  }
  return status;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
