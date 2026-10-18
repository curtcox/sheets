import { readFile, readdir, mkdir, cp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
export async function npmLicenses(root, destination) {
  for (const item of await readdir(root, { withFileTypes: true })) {
    if (!item.isDirectory() || item.name.startsWith(".")) continue;
    const dir = path.join(root, item.name);
    if (item.name.startsWith("@")) {
      await npmLicenses(dir, destination);
      continue;
    }
    let pkg;
    try {
      pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    } catch {
      continue;
    }
    await copyNotices(
      dir,
      path.join(
        destination,
        `${pkg.name.replaceAll("/", "__")}@${pkg.version}`,
      ),
    );
    try {
      await npmLicenses(path.join(dir, "node_modules"), destination);
    } catch {
      /* No nested dependencies. */
    }
  }
}
async function copyNotices(source, destination) {
  for (const file of await readdir(source))
    if (/^(license|copying|notice|copyright)/i.test(file)) {
      await mkdir(destination, { recursive: true });
      await cp(path.join(source, file), path.join(destination, file), {
        recursive: true,
      });
    }
}
export async function rustLicenses(lockFile, destination) {
  const registry = path.join(
    process.env.CARGO_HOME || path.join(os.homedir(), ".cargo"),
    "registry",
    "src",
  );
  const roots = await readdir(registry);
  const lock = await readFile(lockFile, "utf8");
  for (const block of lock.split("[[package]]").slice(1)) {
    const name = /^name = "([^"]+)"/m.exec(block)?.[1],
      version = /^version = "([^"]+)"/m.exec(block)?.[1];
    if (!/^source = "registry\+/m.test(block)) continue;
    let found = false;
    for (const root of roots) {
      try {
        await copyNotices(
          path.join(registry, root, `${name}-${version}`),
          path.join(destination, `${name}@${version}`),
        );
        found = true;
        break;
      } catch {
        /* Try next registry. */
      }
    }
    // Target-specific unused crates may not have been downloaded by Cargo.
    if (!found) continue;
  }
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [kind, source, destination] = process.argv.slice(2);
  await (kind === "rust" ? rustLicenses : npmLicenses)(source, destination);
}
