import * as path from "path";

export function parseEnvironmentVariables(input: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return env;
}

export function mergePath(pathValue?: string, extraEntries: string[] = []): string {
  const entries = [
    ...extraEntries,
    ...(pathValue || process.env.PATH || "").split(path.delimiter)
  ]
    .map((entry) => entry.trim())
    .filter(Boolean);
  return Array.from(new Set(entries)).join(path.delimiter);
}

export function buildProcessEnv(input: string): NodeJS.ProcessEnv {
  const parsed = parseEnvironmentVariables(input);
  return {
    ...process.env,
    ...parsed,
    PATH: mergePath(parsed.PATH)
  };
}

