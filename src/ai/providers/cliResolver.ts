import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export type CliKind = "claude" | "codex" | "antigravity";

export interface CliResolution {
  executablePath: string | null;
  shell: boolean;
  argsPrefix: string[];
  detail: string;
}

function isFile(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function isDirectory(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function pathEntries(pathValue?: string): string[] {
  return (pathValue || process.env.PATH || "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function expandHome(input: string): string {
  if (input === "~") return os.homedir();
  if (input.startsWith(`~${path.sep}`)) return path.join(os.homedir(), input.slice(2));
  return input;
}

export function windowsPathToWslPath(filePath: string): string {
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(filePath);
  if (!match) return filePath;
  return `/mnt/${match[1].toLowerCase()}/${match[2].replace(/\\/g, "/")}`;
}

export function resolveCli(kind: CliKind, customPath?: string, pathValue?: string): CliResolution {
  const custom = (customPath || "").trim();
  const customExpanded = custom ? expandHome(custom) : "";
  if (customExpanded && isFile(customExpanded)) {
    return resolutionForPath(kind, customExpanded);
  }

  const names = cliNames(kind);
  for (const entry of pathEntries(pathValue)) {
    for (const name of names) {
      const candidate = path.join(entry, name);
      if (isFile(candidate)) return resolutionForPath(kind, candidate);
    }
  }

  for (const candidate of defaultCandidates(kind)) {
    if (isFile(candidate)) return resolutionForPath(kind, candidate);
  }

  const wsl = resolveWsl(kind);
  if (wsl) return wsl;

  return {
    executablePath: null,
    shell: false,
    argsPrefix: [],
    detail: `${kind} CLI not found`
  };
}

function resolutionForPath(kind: CliKind, executablePath: string): CliResolution {
  if (process.platform === "win32" && kind === "codex" && /\.cmd$/i.test(executablePath)) {
    const codexJs = path.join(
      path.dirname(executablePath),
      "node_modules",
      "@openai",
      "codex",
      "bin",
      "codex.js"
    );
    if (isFile(codexJs)) {
      return {
        executablePath: "node",
        shell: false,
        argsPrefix: [codexJs],
        detail: `Using Codex Node entrypoint for ${executablePath}`
      };
    }
  }

  const extension = path.extname(executablePath).toLowerCase();
  return {
    executablePath,
    shell: process.platform === "win32" && [".cmd", ".bat", ".ps1"].includes(extension),
    argsPrefix: [],
    detail: `Using ${executablePath}`
  };
}

function cliNames(kind: CliKind): string[] {
  if (kind === "antigravity") {
    return process.platform === "win32"
      ? ["agy.exe", "agy.cmd", "agy.ps1", "agy", "antigravity.exe", "antigravity.cmd", "antigravity.ps1", "antigravity"]
      : ["agy", "antigravity"];
  }
  if (kind === "codex") {
    return process.platform === "win32"
      ? ["codex.exe", "codex.cmd", "codex.ps1", "codex"]
      : ["codex"];
  }
  return process.platform === "win32"
    ? ["claude.exe", "claude.cmd", "claude.ps1", "claude"]
    : ["claude"];
}

function defaultCandidates(kind: CliKind): string[] {
  const home = os.homedir();
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    if (kind === "codex") {
      return [path.join(appData, "npm", "codex.cmd"), path.join(appData, "npm", "codex.exe")];
    }
    if (kind === "antigravity") {
      return [path.join(localAppData, "antigravity-cli", "agy.exe"), path.join(appData, "npm", "agy.cmd")];
    }
    return [path.join(appData, "npm", "claude.cmd"), path.join(appData, "npm", "claude.exe")];
  }

  const binary = kind === "antigravity" ? "agy" : kind;
  return [
    `/opt/homebrew/bin/${binary}`,
    `/usr/local/bin/${binary}`,
    path.join(home, ".local", "bin", binary),
    path.join(home, ".npm-global", "bin", binary)
  ];
}

function resolveWsl(kind: CliKind): CliResolution | null {
  if (process.platform !== "win32") return null;
  const wslPath = ["wsl.exe", "wsl"]
    .map((name) => {
      for (const entry of pathEntries()) {
        const candidate = path.join(entry, name);
        if (isFile(candidate)) return candidate;
      }
      const system32 = path.join(process.env.WINDIR || "C:\\Windows", "System32", name);
      return isFile(system32) ? system32 : "";
    })
    .find(Boolean);
  if (!wslPath) return null;

  const target = kind === "antigravity" ? "agy" : kind;
  if (!wslHasCommand(wslPath, target)) return null;
  return {
    executablePath: wslPath,
    shell: false,
    argsPrefix: ["-e", target],
    detail: `Using WSL fallback: ${target}`
  };
}

function wslHasCommand(wslPath: string, target: string): boolean {
  if (!isFile(wslPath) && !isDirectory(wslPath)) return false;
  const { spawnSync } = require("child_process") as typeof import("child_process");
  const result = spawnSync(wslPath, ["-e", "sh", "-lc", `command -v ${target}`], {
    encoding: "utf8",
    windowsHide: true
  });
  return result.status === 0;
}

