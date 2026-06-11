import { copyFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

await copyFile(
  path.join(root, "node_modules", "@rhwp", "core", "rhwp_bg.wasm"),
  path.join(root, "rhwp_bg.wasm")
);

