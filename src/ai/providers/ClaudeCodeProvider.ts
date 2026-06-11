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
    yield* this.runProcess(this.resolve(), ["-p", prompt], input);
  }
}

