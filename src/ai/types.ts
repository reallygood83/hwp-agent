import type { RhwpDocumentContext, RhwpSelectionContext } from "../rhwp/documentContext";

export type RhwpAiProviderId = "claude" | "codex" | "antigravity";
export type RhwpAiPermissionMode = "preview" | "auto" | "manual-json";

export interface RhwpAiProviderSettings {
  claudeCliPath: string;
  codexCliPath: string;
  antigravityCliPath: string;
  claudeModel: string;
  codexModel: string;
  antigravityModel: string;
  reasoningEffort: "low" | "medium" | "high" | "xhigh";
  permissionMode: RhwpAiPermissionMode;
  environmentVariables: string;
}

export interface RhwpAiQuery {
  userRequest: string;
  cwd: string;
  locale: "ko" | "en";
  documentContext: RhwpDocumentContext;
  selectedContext?: RhwpSelectionContext | null;
}

export type RhwpAiEvent =
  | { type: "progress"; content: string }
  | { type: "text"; content: string }
  | { type: "error"; content: string }
  | { type: "done" };

export interface RhwpProviderDiagnostic {
  id: RhwpAiProviderId;
  ok: boolean;
  executablePath: string | null;
  detail: string;
}

export interface RhwpAiProvider {
  id: RhwpAiProviderId;
  label: string;
  query(input: RhwpAiQuery): AsyncGenerator<RhwpAiEvent>;
  cancel(): void;
  diagnose(): Promise<RhwpProviderDiagnostic>;
}

export const DEFAULT_AI_PROVIDER_SETTINGS: RhwpAiProviderSettings = {
  claudeCliPath: "",
  codexCliPath: "",
  antigravityCliPath: "",
  claudeModel: "",
  codexModel: "gpt-5.4",
  antigravityModel: "",
  reasoningEffort: "high",
  permissionMode: "preview",
  environmentVariables: ""
};
