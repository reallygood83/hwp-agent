import * as os from "os";
import * as path from "path";

import type { RhwpAiEvent, RhwpAiProviderSettings, RhwpAiQuery } from "../types";
import { BaseCliProvider } from "./BaseCliProvider";

export class AntigravityProvider extends BaseCliProvider {
  readonly id = "antigravity" as const;
  readonly label = "Antigravity";

  constructor(settings: () => RhwpAiProviderSettings) {
    super(settings);
  }

  async *query(input: RhwpAiQuery): AsyncGenerator<RhwpAiEvent> {
    const logPath = path.join(
      os.tmpdir(),
      `ai-rhwp-antigravity-${Date.now()}-${Math.random().toString(36).slice(2)}.log`
    );
    const prompt = this.buildOperationPrompt(input);
    const args = ["--log-file", logPath, "--add-dir", input.cwd, "--print-timeout", "5m", "--print", prompt];
    yield { type: "progress", content: `Antigravity log: ${logPath}` };
    yield* this.runProcess(this.resolve(), args, input);
  }
}
