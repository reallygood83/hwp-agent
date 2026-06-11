import * as os from "os";
import * as path from "path";

import type { RhwpAiEvent, RhwpAiProviderSettings, RhwpAiQuery } from "../types";
import { BaseCliProvider } from "./BaseCliProvider";

export class CodexProvider extends BaseCliProvider {
  readonly id = "codex" as const;
  readonly label = "Codex";

  constructor(settings: () => RhwpAiProviderSettings) {
    super(settings);
  }

  async *query(input: RhwpAiQuery): AsyncGenerator<RhwpAiEvent> {
    const outputPath = path.join(
      os.tmpdir(),
      `ai-rhwp-codex-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
    );
    const prompt = this.buildOperationPrompt(input);
    const resolution = this.resolve();
    const args = [
      "--sandbox",
      "workspace-write",
      "--ask-for-approval",
      "never",
      "exec",
      "--color",
      "never",
      "--output-last-message",
      outputPath,
      "--skip-git-repo-check",
      "--cd",
      input.cwd,
      "--model",
      this.settings().codexModel,
      "--config",
      `model_reasoning_effort="${this.settings().reasoningEffort}"`
    ];
    yield* this.runProcess(resolution, args, input, prompt, outputPath);
  }
}
