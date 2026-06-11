# OOO QA Plan

## Objective QA

The plugin must become a single Obsidian Desktop plugin where AI providers can read and operate on real HWP/HWPX documents through rHWP.

Pass conditions:

- The plugin is developed in this separate folder: `obsidian-ai-rhwp-editor`.
- The plugin identity is separate from upstream `rhwp-editor`.
- The spec is present at `prj/AI_RHWP_PLUGIN_SPEC.md`.
- The project keeps the existing rHWP read/edit/save baseline working.
- AI work is framed around rHWP operations, not direct uncontrolled file edits.

## Operations QA

The plugin must support this operation pipeline:

```text
Open HWP/HWPX
  -> Extract AI-readable document context
  -> Send context to Claude/Codex/Antigravity
  -> Receive operation JSON
  -> Validate operation JSON
  -> Preview
  -> Apply through rHWP APIs
  -> Re-render
  -> Save only after explicit user action
```

Initial implementation checks:

- `src/rhwp/documentContext.ts` exists.
- `src/rhwp/operations.ts` exists.
- `src/ai/types.ts` exists.
- Claude, Codex, and Antigravity provider classes exist.
- Windows CLI resolution is centralized.
- WSL fallback is represented in provider resolution.

## Outcomes QA

The user must eventually be able to ask:

- "이 문서를 읽고 핵심 내용을 요약해줘."
- "이 안내문을 공문체로 바꿔줘."
- "준비물 표를 만들어서 현재 문서에 넣어줘."
- "선택한 표의 셀 내용을 채워줘."
- "이미지를 만들어서 첫 페이지에 넣어줘."
- "AI가 작성한 신청서 양식을 이 HWP 문서에 삽입해줘."

V1 outcome gates:

- Build passes with `npm run build`.
- Existing HWP/HWPX read-only view still loads.
- Existing edit mode still enters local `rhwp-studio`.
- Document context extraction can return paragraph previews from an opened document.
- Provider diagnostics can report whether Claude, Codex, and Antigravity are available.
- Operation validation rejects malformed edits before rHWP execution.
- Windows-specific CLI lookup paths are tested or documented.

## Current QA Status

- [x] Separate development folder created.
- [x] Existing rHWP plugin baseline copied.
- [x] AI rHWP spec copied into the new project.
- [x] Project identity changed to `AI rHWP Editor`.
- [x] Initial AI provider abstractions added.
- [x] Initial document context extractor added.
- [x] Initial operation schema validator added.
- [x] `npm run build` passes in the new folder.
- [ ] First UI entry point for AI panel exists.
- [ ] First live document context extraction is wired into `RhwpFileView`.
