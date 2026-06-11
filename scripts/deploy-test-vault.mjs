import { cp, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

await loadEnv(path.join(projectRoot, ".env"));

const targetDir = expandHome(process.env.OBSIDIAN_RHWP_PLUGIN_DIR);

if (!targetDir) {
  throw new Error(
    "Set OBSIDIAN_RHWP_PLUGIN_DIR in .env before running deploy:test-vault."
  );
}

await mkdir(targetDir, { recursive: true });

for (const file of ["main.js", "manifest.json", "styles.css", "rhwp_bg.wasm"]) {
  await copyFile(path.join(projectRoot, file), path.join(targetDir, file));
}

await cp(path.join(projectRoot, "rhwp-studio"), path.join(targetDir, "rhwp-studio"), {
  recursive: true,
  force: true
});

const manifest = JSON.parse(await readFile(path.join(projectRoot, "manifest.json"), "utf8"));
await writeFile(
  path.join(targetDir, "rhwp-assets.json"),
  JSON.stringify(
    {
      pluginVersion: manifest.version,
      rhwpCoreVersion: "0.7.13"
    },
    null,
    2
  )
);

console.log(`Deployed rHWP Editor to ${targetDir}`);

function expandHome(value) {
  if (!value) return value;
  if (value === "~") return process.env.HOME ?? value;
  if (value.startsWith("~/")) return path.join(process.env.HOME ?? "~", value.slice(2));
  return value;
}

async function loadEnv(filePath) {
  let text;
  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    process.env[key] = unquote(rawValue);
  }
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
