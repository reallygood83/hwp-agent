# HWP Agent - AI rHWP Editor for Obsidian

HWP Agent - AI rHWP Editor is a new development fork of rHWP Editor. Its goal is to combine
Obsidian, rHWP, and local AI CLIs so Claude Code, Codex, and Antigravity can read
the current HWP/HWPX document and propose safe rHWP operations for text, tables,
images, and generated document blocks.

This project is built with reference to the Obsidian community plugin
[rHWP Editor](https://community.obsidian.md/plugins/rhwp-editor). The original
plugin established the rHWP-based HWP/HWPX editing experience in Obsidian; this
repository extends that direction with AI-assisted document reading, planning,
and controlled rHWP operation execution.

이 프로젝트는 Obsidian 커뮤니티 플러그인
[rHWP Editor](https://community.obsidian.md/plugins/rhwp-editor)를 참고하여
개발되었습니다. 기존 플러그인이 Obsidian 안에서 rHWP 기반 HWP/HWPX 편집
경험을 제공한 흐름을 바탕으로, 이 저장소는 AI가 문서를 읽고 작업을 계획한 뒤
검증된 rHWP 작업만 실행하는 방향으로 확장합니다.

The implementation spec lives in [`prj/AI_RHWP_PLUGIN_SPEC.md`](prj/AI_RHWP_PLUGIN_SPEC.md).
The OOO QA plan lives in [`prj/OOO_QA.md`](prj/OOO_QA.md).

---

[![Version](https://img.shields.io/badge/version-0.2.8-blue?style=flat-square)](https://github.com/reallygood83/hwp-agent)
[![License](https://img.shields.io/github/license/reallygood83/hwp-agent?style=flat-square)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-desktop%20plugin-7C3AED?style=flat-square)](https://obsidian.md)
[![HWP/HWPX](https://img.shields.io/badge/HWP%2FHWPX-rhwp-2F855A?style=flat-square)](https://github.com/edwardkim/rhwp)

Open, create, and edit `.hwp` and `.hwpx` files in Obsidian Desktop with [rhwp](https://github.com/edwardkim/rhwp).

옵시디언(데스크탑)에서 [rhwp](https://github.com/edwardkim/rhwp)를 사용하여 `.hwp`와 `.hwpx` 파일을 열고, 만들고, 편집합니다.

## Install with BRAT

1. Install the Obsidian BRAT community plugin.
2. Run `BRAT: Add a beta plugin for testing`.
3. Enter `https://github.com/reallygood83/hwp-agent`.
4. In `Settings > Community plugins > Installed plugins`, search for `HWP Agent` or `AI rHWP Editor`.
5. Enable `HWP Agent - AI rHWP Editor`.

Latest release: [`0.2.8`](https://github.com/reallygood83/hwp-agent/releases/tag/0.2.8)

BRAT installs the plugin files first, but Obsidian may still require manually
enabling the installed plugin. The plugin folder/id is `ai-rhwp-editor`; the
visible plugin name is `HWP Agent - AI rHWP Editor`.

This plugin is not yet listed in Obsidian's official Community plugins catalog.
When installed through BRAT, it appears under `Installed plugins`, not in the
official browse/search catalog. After enabling it, a ribbon button with a
file-plus icon appears for creating a new HWP/HWPX file.

BRAT은 먼저 플러그인 파일을 설치하고, Obsidian에서는 설치된 플러그인을 사용자가
직접 켜야 할 수 있습니다. 설치 폴더/id는 `ai-rhwp-editor`이고, 플러그인 목록에
보이는 이름은 `HWP Agent - AI rHWP Editor`입니다.

이 플러그인은 아직 Obsidian 공식 Community plugins 카탈로그에 등록된 플러그인이
아닙니다. BRAT으로 설치하면 공식 검색 목록이 아니라 `Installed plugins` 영역에
표시됩니다. 활성화 후에는 새 HWP/HWPX 파일을 만드는 file-plus 리본 버튼이
생깁니다.

## AI features

- Reads the current rHWP-rendered document context for AI prompting.
- Connects to Claude Code, Codex CLI, and Antigravity CLI through configurable local commands.
- Uses a validated JSON operation envelope before applying AI edits.
- Applies supported operations through rHWP core APIs, including text insertion, text replacement, table creation/cell edits, and vault image insertion.
- Provides `새 작업` to clear the current AI prompt/selection/pending operation and `종료` to stop a running local AI CLI task.
- Lets users drag the divider between the rHWP document area and AI Agent panel to resize the panel width.
- Runs Codex planning with plugin/app/MCP loading minimized and rejects tiny placeholder generated images.
- Keeps Windows support in the provider layer with `.cmd`, PowerShell-friendly command lookup, and WSL fallback candidates.

## Features

### Open and edit

Select a `.hwp` or `.hwpx` file in Obsidian to open it in read-only mode. Press ✏️ to switch to edit mode.

- ✏️ Edit: open edit mode
- 💾 Save: save changes to the original file
- 📖 Read-only: return to read-only mode
- 🔄 Reload: reload the current file

### Rename files

Click the file name in read-only mode to rename the current HWP/HWPX file.

### Create new HWP/HWPX files

1. Right-click a file or folder in Obsidian's file explorer.
2. Select `New HWP` or `New HWPX`.
3. The new file opens directly in edit mode.

The default new file format is `HWP`. You can change it to `HWPX` in Settings.

### Large file warning

Large files can make Obsidian slow while rendering. rHWP Editor can ask before opening files over the configured size. It can be configured in Settings.

## Development

Refer to [prj/](prj/) for development, verification, and release processes.


---

## 기능

### 열기, 편집

옵시디언에서 `.hwp` 또는 `.hwpx` 파일을 선택하면 읽기 모드로 열립니다. ✏️을 누르면 편집 모드로 전환됩니다.

- ✏️ 편집: 편집 모드 열기
- 💾 저장: 편집 내용을 원본 파일에 저장
- 📖 읽기: 읽기 모드로 돌아가기
- 🔄 새로고침: 현재 파일 다시 읽기

### Rename files (파일 이름 변경)

읽기 모드에서 뷰어의 파일 이름을 클릭하면 현재 파일의 이름을 바꿀 수 있습니다.

### 새 HWP/HWPX 생성

1. 옵시디언 파일 탐색기에서 파일 또는 폴더를 우클릭합니다.
2. `새 HWP` 또는 `새 HWPX`를 선택합니다.
3. 새 파일은 바로 편집 모드로 열립니다.

기본 새 파일 형식은 `HWP`입니다. Settings에서 `HWPX`로 바꿀 수 있습니다.

### 큰 파일 열기 확인

큰 파일은 렌더링 중 옵시디언을 느리게 만들 수 있습니다. rHWP Editor는 설정한 기준 용량보다 큰 파일을 열기 전에 확인할 수 있습니다. 기준 파일 용량은 설정에서 변경할 수 있습니다.

## 개발

개발, 검증, 릴리스 과정은 [prj/](prj/)를 참고해주세요.
