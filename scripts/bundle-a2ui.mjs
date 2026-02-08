import { createHash } from "node:crypto";
import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const HASH_FILE = path.join(ROOT_DIR, "src/canvas-host/a2ui/.bundle.hash");
const OUTPUT_FILE = path.join(ROOT_DIR, "src/canvas-host/a2ui/a2ui.bundle.js");
const A2UI_RENDERER_DIR = path.join(ROOT_DIR, "vendor/a2ui/renderers/lit");
const A2UI_APP_DIR = path.join(ROOT_DIR, "apps/shared/OpenClawKit/Tools/CanvasA2UI");

if (!existsSync(A2UI_RENDERER_DIR) || !existsSync(A2UI_APP_DIR)) {
  console.log("A2UI sources missing; keeping prebuilt bundle.");
  process.exit(0);
}

const INPUT_PATHS = [
  path.join(ROOT_DIR, "package.json"),
  path.join(ROOT_DIR, "pnpm-lock.yaml"),
  A2UI_RENDERER_DIR,
  A2UI_APP_DIR
];

async function walk(entryPath) {
  const st = await fs.stat(entryPath);
  if (st.isDirectory()) {
    const entries = await fs.readdir(entryPath);
    let files = [];
    for (const entry of entries) {
      files = files.concat(await walk(path.join(entryPath, entry)));
    }
    return files;
  }
  return [entryPath];
}

async function computeHash() {
  let allFiles = [];
  for (const input of INPUT_PATHS) {
    allFiles = allFiles.concat(await walk(input));
  }

  function normalize(p) {
    return p.split(path.sep).join("/");
  }

  allFiles.sort((a, b) => normalize(a).localeCompare(normalize(b)));

  const hash = createHash("sha256");
  for (const filePath of allFiles) {
    const rel = normalize(path.relative(ROOT_DIR, filePath));
    hash.update(rel);
    hash.update("\0");
    hash.update(await fs.readFile(filePath));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const currentHash = await computeHash();
if (existsSync(HASH_FILE)) {
  const previousHash = (await fs.readFile(HASH_FILE, "utf8")).trim();
  if (previousHash === currentHash && existsSync(OUTPUT_FILE)) {
    console.log("A2UI bundle up to date; skipping.");
    process.exit(0);
  }
}

try {
  console.log("Building A2UI bundle...");
  execSync(`pnpm -s exec tsc -p "${path.join(A2UI_RENDERER_DIR, "tsconfig.json")}"`, { stdio: "inherit" });
  execSync(`pnpm exec rolldown -c "${path.join(A2UI_APP_DIR, "rolldown.config.mjs")}"`, { stdio: "inherit" });
  await fs.writeFile(HASH_FILE, currentHash);
} catch (err) {
  console.error("A2UI bundling failed. Re-run with: pnpm canvas:a2ui:bundle");
  process.exit(1);
}
