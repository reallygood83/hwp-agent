import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const releaseDir = path.join(projectRoot, "release");
const zipName = "rhwp-editor.zip";
const standardAssets = ["main.js", "manifest.json", "styles.css"];
const bundledAssets = ["rhwp_bg.wasm", "rhwp-studio"];

const manifest = JSON.parse(await readFile(path.join(projectRoot, "manifest.json"), "utf8"));
const marker = JSON.stringify(
  {
    pluginVersion: manifest.version,
    rhwpCoreVersion: "0.7.13"
  },
  null,
  2
);

await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });

for (const file of standardAssets) {
  await cp(path.join(projectRoot, file), path.join(releaseDir, file));
}

const zip = new JSZip();

for (const file of standardAssets) {
  zip.file(file, await readFile(path.join(projectRoot, file)));
}

for (const asset of bundledAssets) {
  await addToZip(zip, path.join(projectRoot, asset), asset);
}

zip.file("rhwp-assets.json", marker);

const archive = await zip.generateAsync({
  type: "nodebuffer",
  compression: "DEFLATE",
  compressionOptions: {
    level: 9
  }
});

await writeFile(path.join(releaseDir, zipName), archive);

console.log(`Wrote release assets to ${releaseDir}`);

async function addToZip(zip, sourcePath, zipPath) {
  const info = await stat(sourcePath);

  if (info.isDirectory()) {
    const entries = await readdir(sourcePath);

    for (const entry of entries) {
      if (entry === ".DS_Store") {
        continue;
      }

      await addToZip(zip, path.join(sourcePath, entry), `${zipPath}/${entry}`);
    }

    return;
  }

  zip.file(zipPath, await readFile(sourcePath));
}
