import type { RhwpAiEvent, RhwpAiProviderSettings, RhwpAiQuery } from "../types";
import { BaseCliProvider } from "./BaseCliProvider";

export class ClaudeCodeProvider extends BaseCliProvider {
  readonly id = "claude" as const;
  readonly label = "Claude Code";

  constructor(settings: () => RhwpAiProviderSettings) {
    super(settings);
  }

  async *query(input: RhwpAiQuery): AsyncGenerator<RhwpAiEvent> {
    const prompt = this.buildOperationPrompt(input);
    const model = this.settings().claudeModel.trim();
    const args = model ? ["--model", model, "-p", prompt] : ["-p", prompt];
    yield* this.runProcess(this.resolve(), args, input);
  }
}
