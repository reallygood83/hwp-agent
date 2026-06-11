import type { RhwpAiEvent, RhwpAiProviderSettings, RhwpAiQuery } from "../types";
import { BaseCliProvider } from "./BaseCliProvider";

export class AntigravityProvider extends BaseCliProvider {
  readonly id = "antigravity" as const;
  readonly label = "Antigravity";

  constructor(settings: () => RhwpAiProviderSettings) {
    super(settings);
  }

  async *query(input: RhwpAiQuery): AsyncGenerator<RhwpAiEvent> {
    const prompt = this.buildOperationPrompt(input);
    const args = ["--add-dir", input.cwd, "--print-timeout", "5m", "--print", prompt];
    yield* this.runProcess(this.resolve(), args, input);
  }
}

