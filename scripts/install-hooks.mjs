// Runs from npm "prepare": points this clone's git hooks at the tracked
// .githooks directory. Leaves any existing core.hooksPath setting alone.
import { spawnSync } from "node:child_process";
import { readdirSync, realpathSync } from "node:fs";

const git = (...args) => spawnSync("git", args, { encoding: "utf8" });
const top = git("rev-parse", "--show-toplevel");
if (top.status || realpathSync(top.stdout.trim()) !== realpathSync(process.cwd())) process.exit(0);

const current = git("config", "--local", "--get", "core.hooksPath").stdout.trim();
if (current === ".githooks") process.exit(0);
if (current) {
  console.warn(`core.hooksPath is already "${current}"; run .githooks/pre-push from your own hook setup.`);
  process.exit(0);
}

let legacy = [];
try {
  legacy = readdirSync(git("rev-parse", "--git-path", "hooks").stdout.trim()).filter((name) => !name.endsWith(".sample"));
} catch {}
git("config", "--local", "core.hooksPath", ".githooks");
console.log("Enabled git hooks in .githooks (pre-push file size check).");
if (legacy.length) console.warn(`Hooks in .git/hooks no longer run: ${legacy.join(", ")}. Move them to .githooks if needed.`);
