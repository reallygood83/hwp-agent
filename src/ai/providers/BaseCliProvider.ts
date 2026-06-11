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
    const child = this.currentProcess;
    if (!child) return;

    this.terminateProcessTree(child, "SIGTERM");
    let closed = false;
    child.once("close", () => {
      closed = true;
    });
    setTimeout(() => {
      if (!closed) {
        this.terminateProcessTree(child, "SIGKILL");
      }
    }, 1500);
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

    yield { type: "progress", content: `${this.label} CLI started. Waiting for operation JSON...` };
    if (resolution.detail) {
      yield { type: "progress", content: resolution.detail };
    }

    const child = spawn(resolution.executablePath, [...resolution.argsPrefix, ...args], {
      cwd: input.cwd,
      env: this.environment(resolution),
      stdio: ["pipe", "pipe", "pipe"],
      shell: resolution.shell,
      detached: process.platform !== "win32",
      windowsHide: true
    });
    this.currentProcess = child;
    child.stdin?.end(stdin || "");

    const queue: RhwpAiEvent[] = [];
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let done = false;
    let exitCode: number | null = null;
    const startedAt = Date.now();
    let lastHeartbeatAt = startedAt;

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
        const now = Date.now();
        if (!done && now - lastHeartbeatAt >= 5000) {
          lastHeartbeatAt = now;
          const seconds = Math.round((now - startedAt) / 1000);
          yield { type: "progress", content: `${this.label} is still running (${seconds}s elapsed).` };
        }
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
      "Exception: for image-generation requests, a CLI provider may create image assets only under .rhwp-agent/images in the current vault, then return an insert_image operation that points to that generated file.",
      "Return only JSON matching the RhwpOperationEnvelope schema. Do not wrap it in Markdown.",
      "Supported operation types:",
      "- insert_text: { type, target: { sectionIndex, paragraphIndex, charOffset }, text }",
      "- replace_text: { type, target: { sectionIndex, paragraphIndex, charOffset, length }, text }",
      "- replace_selection: { type, selectedText, replacement, occurrence? }. Use this when selected_context is present and the user asks to revise only the selected text.",
      "- create_table: { type, target, rows, cols, cells? }",
      "- edit_table_cell: { type, target, text }",
      "- insert_image: { type, target, source: { kind, path }, layout: { width, height, description } }",
      "- save_document: { type }",
      "For Codex image generation, use a real image-generation tool/model such as gpt-image-2 when the CLI exposes it.",
      "Save a real PNG/JPEG asset under .rhwp-agent/images and use source.kind = generated_file.",
      "Do not fabricate placeholder, 1x1, base64-handwritten, SVG, or text-only image files. If no real image-generation capability is available, return a valid envelope with an empty operations array and explain the limitation in summary.",
      "When locale is ko, write summaries and generated text in Korean unless the user asks otherwise.",
      "",
      "<document_context>",
      JSON.stringify(input.documentContext, null, 2),
      "</document_context>",
      "",
      "<selected_context>",
      JSON.stringify(input.selectedContext ?? input.documentContext.selectedText ?? null, null, 2),
      "</selected_context>",
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

  private terminateProcessTree(child: ChildProcess, signal: NodeJS.Signals): void {
    if (!child.pid) return;

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true
      });
      killer.on("error", () => {
        child.kill(signal);
      });
      return;
    }

    try {
      process.kill(-child.pid, signal);
    } catch {
      child.kill(signal);
    }
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
