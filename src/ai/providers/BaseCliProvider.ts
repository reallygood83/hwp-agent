import { spawn, type ChildProcess } from "child_process";
import * as path from "path";

import type {
  RhwpAiEvent,
  RhwpAiProvider,
  RhwpAiProviderSettings,
  RhwpAiQuery,
  RhwpProviderDiagnostic
} from "../types";
import { buildProcessEnv, mergePath } from "./env";
import { type CliKind, type CliResolution, resolveCli } from "./cliResolver";

export abstract class BaseCliProvider implements RhwpAiProvider {
  abstract readonly id: CliKind;
  abstract readonly label: string;
  private currentProcess: ChildProcess | null = null;

  protected constructor(protected readonly settings: () => RhwpAiProviderSettings) {}

  abstract query(input: RhwpAiQuery): AsyncGenerator<RhwpAiEvent>;

  cancel(): void {
    this.currentProcess?.kill();
    this.currentProcess = null;
  }

  async diagnose(): Promise<RhwpProviderDiagnostic> {
    const resolution = this.resolve();
    return {
      id: this.id,
      ok: resolution.executablePath !== null,
      executablePath: resolution.executablePath,
      detail: resolution.detail
    };
  }

  protected resolve(): CliResolution {
    const settings = this.settings();
    const env = buildProcessEnv(settings.environmentVariables);
    return resolveCli(this.id, this.customPath(settings), env.PATH);
  }

  protected environment(resolution: CliResolution): NodeJS.ProcessEnv {
    const env = buildProcessEnv(this.settings().environmentVariables);
    if (resolution.executablePath && path.isAbsolute(resolution.executablePath)) {
      env.PATH = mergePath(env.PATH, [path.dirname(resolution.executablePath)]);
    }
    return env;
  }

  protected async *runProcess(
    resolution: CliResolution,
    args: string[],
    input: RhwpAiQuery,
    stdin?: string,
    finalOutputFile?: string
  ): AsyncGenerator<RhwpAiEvent> {
    if (!resolution.executablePath) {
      yield { type: "error", content: `${this.label} CLI not found. Configure the CLI path in settings.` };
      yield { type: "done" };
      return;
    }

    const child = spawn(resolution.executablePath, [...resolution.argsPrefix, ...args], {
      cwd: input.cwd,
      env: this.environment(resolution),
      stdio: ["pipe", "pipe", "pipe"],
      shell: resolution.shell,
      windowsHide: true
    });
    this.currentProcess = child;
    child.stdin?.end(stdin || "");

    const queue: RhwpAiEvent[] = [];
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let done = false;
    let exitCode: number | null = null;

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";
      for (const line of lines) {
        const progress = this.formatProgressLine(line);
        if (progress) queue.push({ type: "progress", content: progress });
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrBuffer += chunk.toString();
    });
    child.on("error", (error) => {
      queue.push({ type: "error", content: error.message });
      done = true;
    });
    child.on("close", (code) => {
      exitCode = code;
      if (code && code !== 0) {
        const details = stderrBuffer.trim() ? `\n\n${stderrBuffer.trim()}` : "";
        queue.push({ type: "error", content: `${this.label} exited with code ${code}.${details}` });
      }
      done = true;
    });

    while (!done || queue.length > 0) {
      const event = queue.shift();
      if (event) {
        yield event;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    }

    if (exitCode === 0) {
      const finalText = finalOutputFile ? this.readTextFile(finalOutputFile) : stdoutBuffer.trim();
      if (finalText) yield { type: "text", content: finalText };
      else if (stderrBuffer.trim()) yield { type: "progress", content: stderrBuffer.trim().slice(0, 400) };
    }

    this.currentProcess = null;
    yield { type: "done" };
  }

  protected buildOperationPrompt(input: RhwpAiQuery): string {
    return [
      "You are an AI operation planner for an Obsidian plugin named AI rHWP Editor.",
      "You can read the current HWP/HWPX document context, but you must not edit files directly.",
      "Return only JSON matching the RhwpOperationEnvelope schema. Do not wrap it in Markdown.",
      "",
      "<document_context>",
      JSON.stringify(input.documentContext, null, 2),
      "</document_context>",
      "",
      "<user_request>",
      input.userRequest,
      "</user_request>"
    ].join("\n");
  }

  protected formatProgressLine(line: string): string {
    const cleaned = line.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "").trim();
    if (!cleaned) return "";
    if (/^(read|write|edit|apply|search|run|thinking|reasoning|create|generate|verify|save)\b/i.test(cleaned)) {
      return cleaned.slice(0, 240);
    }
    if (/^(•|-|\*) /i.test(cleaned)) return cleaned.slice(0, 240);
    return "";
  }

  private customPath(settings: RhwpAiProviderSettings): string {
    if (this.id === "codex") return settings.codexCliPath;
    if (this.id === "antigravity") return settings.antigravityCliPath;
    return settings.claudeCliPath;
  }

  private readTextFile(filePath: string): string {
    try {
      const fs = require("fs") as typeof import("fs");
      return fs.readFileSync(filePath, "utf8").trim();
    } catch {
      return "";
    }
  }
}
