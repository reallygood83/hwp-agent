# Release Notes

## 0.2.1

### Fixed

- Made the AI Agent visible in the HWP/HWPX document view instead of hiding it behind a small icon.
- Added a Korean HWP editing command bar with visible actions for new document, edit, save/read mode, AI document reading, AI planning, AI apply, table insertion, and image insertion prompts.
- Added automatic detection for Claude Code, Codex, and Antigravity CLI paths.

### Changed

- HWP/HWPX files now show the AI Agent side panel by default so users can immediately ask AI to read and plan edits for the document.
- Settings now include a `Detect now` action that fills AI CLI paths from PATH and common macOS, Linux, Windows, and WSL install locations.

### Verified

- `npm run package:release`

## 0.2.0

### Fixed

- Kept the HWP Agent settings tab, commands, and ribbon button available even when another rHWP plugin already registered `.hwp` / `.hwpx` extensions.
- Hardened plugin startup so one optional Obsidian registration failure no longer aborts the rest of `onload()`.

### Changed

- Register settings and command palette actions before file-extension ownership, making BRAT installs visibly configurable even in mixed rHWP setups.
- Renamed the settings tab title to `HWP Agent - AI rHWP Editor` for easier discovery.

### Verified

- `npm run package:release`

## 0.1.3

### Added

- Added an Obsidian ribbon button that creates a new HWP/HWPX file through HWP Agent.

### Changed

- Clarified that BRAT-installed plugins appear under Installed plugins and do not appear in the official Obsidian Community plugins catalog until separately submitted.

### Verified

- `npm run package:release`

## 0.1.2

### Changed

- Renamed the visible Obsidian plugin name to `HWP Agent - AI rHWP Editor` so users who install from `reallygood83/hwp-agent` can find it more easily in Community plugins.
- Clarified the BRAT install flow: the plugin id/folder is `ai-rhwp-editor`, while the visible plugin name is `HWP Agent - AI rHWP Editor`.

### Verified

- `npm run package:release`

## 0.1.1

### Added

- Added an Apply action for valid AI operation envelopes.
- Added direct rHWP core application for text insertion, text replacement, table creation/cell edits, image insertion from vault files, and document save/export.
- Added structured application results in the AI output panel after operations are written back to the HWP/HWPX file.

### Verified

- `npm run package:release`

## 0.1.0

### Added

- Forked the rHWP Obsidian editor into a BRAT-ready AI rHWP Editor plugin.
- Added an AI side panel that can read the current rendered document context and send it to a selected local AI CLI.
- Added Claude Code, Codex CLI, and Antigravity CLI provider scaffolding with native Windows command resolution and WSL fallback candidates.
- Added a validated rHWP operation envelope for future safe insertion and editing of text, tables, images, and generated document blocks.
- Added project spec and OOO QA documents under `prj/`.

### Verified

- `npm run build`
- `npm run package:release`

## 0.2.4

### Fixed

- Re-published the edit mode asset-loading fixes from `0.2.3` under a clean release tag after the `0.2.3` release workflow was retried with a moved tag.
- Fixed edit mode showing raw `rhwp-studio` menu HTML without CSS in Obsidian.
- Fixed edit mode failing to load files with `Cannot read properties of undefined (reading '__wbindgen_malloc')` after rhwp WASM initialization failed inside the iframe.
- Fixed missing SVG sprite icons in the edit mode toolbar and menus.

### Changed

- Edit mode generates an Obsidian-specific `rhwp-studio-obsidian/` runtime entrypoint before opening the iframe.
- The generated entrypoint inlines CSS and the main JS bundle, rewrites font and renderer URLs for Obsidian resource loading, and passes rhwp WASM bytes directly instead of relying on iframe `app://` fetch.
- Uses a fresh `0.2.4` tag instead of reusing the problematic `0.2.3` tag.

## 0.2.3

### Fixed

- Fixed edit mode showing raw `rhwp-studio` menu HTML without CSS in Obsidian.
- Fixed edit mode failing to load files with `Cannot read properties of undefined (reading '__wbindgen_malloc')` after rhwp WASM initialization failed inside the iframe.
- Fixed missing SVG sprite icons in the edit mode toolbar and menus.

### Changed

- Edit mode now generates an Obsidian-specific `rhwp-studio-obsidian/` runtime entrypoint before opening the iframe.
- The generated entrypoint inlines CSS and the main JS bundle, rewrites font and renderer URLs for Obsidian resource loading, and passes rhwp WASM bytes directly instead of relying on iframe `app://` fetch.
