# AI rHWP Editor Plugin Spec

## 1. OOO Summary

### Objective

Obsidian 안에서 `.hwp`와 `.hwpx` 문서를 열고, Claude Code CLI, Codex CLI, Antigravity CLI가 문서 내용을 읽은 뒤 실제 rHWP 문서에 텍스트, 표, 이미지, AI 생성 문서 블록을 삽입하고 편집할 수 있는 통합 플러그인을 만든다.

이 제품은 단순한 HWP 뷰어가 아니다. 목표는 한국 공공, 학교, 업무 환경에서 쓰는 HWP 문서를 Obsidian vault 안에서 AI와 함께 작성, 수정, 저장하는 AI 문서 편집기다.

### Operations

플러그인은 AI가 자유롭게 파일을 직접 변경하게 두지 않는다. AI는 현재 문서 구조를 읽고, 검증 가능한 operation JSON을 제안한다. 플러그인은 operation을 검증한 뒤 rHWP API로 실행하고, 사용자가 저장하기 전 preview와 승인 단계를 제공한다.

주요 operation은 다음과 같다.

- `read_document_context`
- `insert_text`
- `replace_text`
- `create_table`
- `fill_table_cells`
- `insert_table_row`
- `insert_table_column`
- `edit_table_cell`
- `insert_image`
- `edit_image_properties`
- `delete_object`
- `insert_generated_document_block`
- `save_document`

### Outcomes

사용자는 다음 작업을 자연어로 수행할 수 있어야 한다.

- "이 가정통신문 내용을 읽고 더 공문체로 바꿔줘."
- "현재 문서의 행사 안내 아래에 준비물 표를 만들어줘."
- "AI가 만든 신청서 양식을 이 문서에 삽입해줘."
- "첫 페이지 오른쪽 위에 학교 로고 이미지를 넣어줘."
- "이 표에 참가비, 장소, 준비물 항목을 채워줘."
- "선택한 표의 열을 하나 추가하고 비고란을 만들어줘."
- "현재 문서를 읽고 빠진 항목을 찾아서 보완해줘."

## 2. Product Scope

### In Scope

- Obsidian Desktop 전용 HWP/HWPX 파일뷰
- rHWP 기반 read-only 렌더링
- rHWP Studio 기반 편집 모드
- AI 패널
- Claude Code CLI provider
- Codex CLI provider
- Antigravity CLI provider
- 현재 열린 HWP/HWPX 문서의 AI-readable context 추출
- 텍스트 삽입과 교체
- 표 생성, 표 셀 채우기, 행/열 추가/삭제
- 이미지 삽입, 이미지 속성 변경, 이미지 삭제
- AI가 생성한 문서 블록을 현재 문서에 삽입
- Windows native CLI, Windows `.cmd` wrapper, WSL fallback 지원
- 적용 전 preview와 명시적 저장

### Out of Scope for V1

- 모바일 Obsidian 지원
- Hancom Office와 완전 동일한 레이아웃 보장
- 표 안의 표를 안정 기능으로 제공
- 외부 서버에 HWP 파일 업로드
- AI가 Obsidian vault 밖 파일을 임의 수정하는 동작
- API 키 필수 구조

## 3. Source Program Roles

### `obsidian-rhwp-editor-main`

기반 플러그인이다. 다음 기능을 보존하고 확장한다.

- `.hwp`, `.hwpx` 확장자 등록
- 파일뷰와 read-only SVG 렌더링
- 편집 모드 진입
- local `rhwp-studio` iframe 로딩
- `exportHwp()` / `exportHwpx()` 저장
- 새 HWP/HWPX 파일 생성
- 큰 파일 열기 확인
- 한국어/영어 UI

### `obsidian-code-main 2`

Claude Code 기반 AI editor 구현 참고 소스다.

재사용 후보:

- Claude Agent SDK 연동 구조
- permission mode
- MCP server manager
- vault restriction
- approval flow
- diff tracking
- inline edit UX
- slash command UX

### `codexian`

Codex CLI 및 Antigravity CLI provider 구현 참고 소스다.

재사용 후보:

- Codex CLI resolver
- Codex `exec` 호출 방식
- `--output-last-message` 기반 응답 회수
- Windows `codex.cmd` 우회
- Antigravity CLI resolver/provider
- PATH 진단 UI
- Obsidian note context prompt 구성 방식

### `master-of-hwp`

문서 구조 분석과 AI operation backend 참고 소스다.

재사용 후보:

- `HwpDocument.summary()`
- `plain_text`
- `iter_paragraphs()`
- `section_tables`
- `replace_paragraph`
- `replace_table_cell_paragraph`
- AI provider protocol
- WSL path translation
- MCP tool schema

## 4. User Experience

### Main Layout

HWP/HWPX 파일을 열면 다음 레이아웃을 제공한다.

```text
┌───────────────────────────────────────────────────────┐
│ rHWP toolbar: read/edit/save/reload/zoom/provider      │
├──────────────────────────────┬────────────────────────┤
│                              │ AI panel               │
│ HWP/HWPX page view/editor    │ - provider selector    │
│                              │ - document context     │
│                              │ - operation preview    │
│                              │ - apply/save controls  │
└──────────────────────────────┴────────────────────────┘
```

### AI Panel Controls

- Provider selector: Claude, Codex, Antigravity
- Permission mode: Preview first, Auto apply draft, Manual JSON
- Document context status: paragraphs, tables, images, page count
- Prompt input
- Operation preview
- Apply button
- Save button
- Cancel button
- Diagnostics button

### Required User Flow

1. 사용자가 `.hwp` 또는 `.hwpx` 파일을 연다.
2. 플러그인이 문서를 렌더링한다.
3. 플러그인이 문서 context를 추출한다.
4. 사용자가 AI 패널에 요청을 입력한다.
5. AI provider가 문서 context를 읽고 operation JSON을 생성한다.
6. 플러그인이 operation을 검증한다.
7. 사용자가 preview를 확인한다.
8. 플러그인이 rHWP API로 operation을 실행한다.
9. 문서가 다시 렌더링된다.
10. 사용자가 명시적으로 저장한다.

## 5. AI-Readable Document Context

AI가 반드시 읽을 수 있어야 하는 context는 다음과 같다.

```json
{
  "document": {
    "fileName": "notice.hwp",
    "extension": "hwp",
    "pageCount": 2,
    "mode": "read"
  },
  "cursor": {
    "sectionIndex": 0,
    "paragraphIndex": 3,
    "charOffset": 0
  },
  "selection": {
    "type": "text",
    "text": "선택된 문장",
    "range": {
      "sectionIndex": 0,
      "startParagraphIndex": 2,
      "startCharOffset": 0,
      "endParagraphIndex": 2,
      "endCharOffset": 12
    }
  },
  "sections": [
    {
      "sectionIndex": 0,
      "paragraphs": [
        {
          "paragraphIndex": 0,
          "textPreview": "2026학년도 현장체험학습 안내",
          "charCount": 18
        }
      ],
      "tables": [
        {
          "tableIndex": 0,
          "parentParagraphIndex": 5,
          "controlIndex": 0,
          "rows": 3,
          "cols": 4,
          "cellsPreview": [
            ["항목", "내용", "날짜", "비고"]
          ]
        }
      ],
      "images": [
        {
          "parentParagraphIndex": 1,
          "controlIndex": 0,
          "mime": "image/png",
          "description": "학교 로고",
          "width": 120,
          "height": 80
        }
      ]
    }
  ]
}
```

### Context Extraction Requirements

- 큰 문서는 token budget에 맞춰 preview와 full lookup을 분리한다.
- 표는 row/column 수와 셀 preview를 포함한다.
- 이미지는 control 위치, mime, 설명, 크기를 포함한다.
- 이미지 원본 binary는 기본적으로 AI에 보내지 않는다.
- 사용자가 이미지 분석을 요청한 경우에만 base64 또는 임시 파일 첨부를 사용한다.
- context에는 vault 밖 절대 경로를 불필요하게 노출하지 않는다.

## 6. Operation Schema

### Common Envelope

```json
{
  "version": 1,
  "summary": "준비물 표를 문서 하단에 추가합니다.",
  "requiresUserApproval": true,
  "operations": []
}
```

### Insert Text

```json
{
  "type": "insert_text",
  "target": {
    "sectionIndex": 0,
    "paragraphIndex": 3,
    "charOffset": 0
  },
  "text": "새로 삽입할 문장입니다."
}
```

### Replace Text

```json
{
  "type": "replace_text",
  "target": {
    "sectionIndex": 0,
    "paragraphIndex": 2,
    "startCharOffset": 0,
    "endCharOffset": 15
  },
  "text": "수정된 문장입니다."
}
```

### Create Table

```json
{
  "type": "create_table",
  "target": {
    "sectionIndex": 0,
    "paragraphIndex": 5,
    "charOffset": 0
  },
  "rows": 4,
  "cols": 3,
  "cells": [
    ["준비물", "수량", "비고"],
    ["물", "1병", ""],
    ["필기도구", "1개", ""],
    ["편한 신발", "1켤레", ""]
  ]
}
```

### Edit Table Cell

```json
{
  "type": "edit_table_cell",
  "target": {
    "sectionIndex": 0,
    "parentParagraphIndex": 5,
    "controlIndex": 0,
    "rowIndex": 1,
    "colIndex": 2
  },
  "text": "추가 안내"
}
```

### Insert Image

```json
{
  "type": "insert_image",
  "target": {
    "sectionIndex": 0,
    "paragraphIndex": 1,
    "charOffset": 0
  },
  "source": {
    "kind": "vault_file",
    "path": "attachments/logo.png"
  },
  "layout": {
    "width": 120,
    "height": 80,
    "description": "학교 로고"
  }
}
```

### Insert Generated Document Block

```json
{
  "type": "insert_generated_document_block",
  "target": {
    "sectionIndex": 0,
    "paragraphIndex": 4,
    "charOffset": 0
  },
  "blocks": [
    {
      "kind": "paragraph",
      "text": "학부모님께 안내드립니다."
    },
    {
      "kind": "table",
      "rows": 2,
      "cols": 2,
      "cells": [
        ["일시", "2026년 6월 20일"],
        ["장소", "학교 강당"]
      ]
    }
  ]
}
```

## 7. Provider Design

### Interface

```ts
interface RhwpAiProvider {
  id: "claude" | "codex" | "antigravity";
  label: string;
  query(input: RhwpAiQuery): AsyncGenerator<RhwpAiEvent>;
  cancel(): void;
  diagnose(): Promise<RhwpProviderDiagnostic>;
}
```

### Query Input

```ts
interface RhwpAiQuery {
  userRequest: string;
  documentContext: RhwpDocumentContext;
  cwd: string;
  locale: "ko" | "en";
  mode: "chat" | "plan_operations" | "generate_block" | "repair_operations";
}
```

### Provider Roles

- Claude Code: 긴 한국어 문서 이해, 복잡한 문서 수정 계획, 공문체 변환
- Codex CLI: operation JSON 생성, 플러그인 코드 보조, 이미지 생성 workflow
- Antigravity CLI: 대체 agent runtime, 빠른 문서 생성, provider redundancy

### Provider Safety Rule

Provider는 HWP/HWPX 파일을 직접 저장하지 않는다. Provider는 operation JSON만 반환한다. 파일 저장은 플러그인의 rHWP operation executor만 수행한다.

## 8. rHWP Operation Executor

### Direct rHWP APIs

다음 rHWP API를 우선 사용한다.

- `createTable`
- `createTableEx`
- `insertTableRow`
- `insertTableColumn`
- `deleteTableRow`
- `deleteTableColumn`
- `insertPicture`
- `getPictureProperties`
- `setPictureProperties`
- `deletePictureControl`
- `exportHwp`
- `exportHwpx`

### V1 Execution Model

1. 현재 editor/document instance를 확보한다.
2. operation target을 현재 문서 상태에 대해 검증한다.
3. operation을 rHWP API로 실행한다.
4. 실패하면 사용자에게 operation 단위 오류를 보여준다.
5. 성공하면 페이지를 다시 렌더링한다.
6. 저장은 명시적인 Save 동작에서만 수행한다.

### Nested Table Policy

표 안의 표는 V1 안정 기능에서 제외한다. rHWP의 `createTableInCell`은 존재하지만, HWP5 저장 후 Hancom Office에서 레이아웃이 깨지는 사례가 기록되어 있다.

정책:

- V1: body-level table만 안정 지원
- V1 experimental: nested table 요청 시 경고 후 body-level fallback
- V2: upstream rHWP fix 또는 회귀 테스트 통과 후 정식 지원

## 9. Windows Support

Windows는 V1부터 1급 지원 환경이다.

### Windows Requirements

- Obsidian Desktop on Windows
- Node.js 20+
- rHWP WASM local asset loading
- Claude Code CLI native 또는 WSL
- Codex CLI native 또는 WSL
- Antigravity CLI native 또는 WSL

### CLI Resolution

Provider resolver는 다음 후보를 확인한다.

Claude:

- `claude.exe`
- `claude.cmd`
- `claude.ps1`
- WSL `claude`

Codex:

- `codex.exe`
- `codex.cmd`
- `codex.ps1`
- `%APPDATA%\\npm\\codex.cmd`
- `node %APPDATA%\\npm\\node_modules\\@openai\\codex\\bin\\codex.js`
- WSL `codex`

Antigravity:

- `agy.exe`
- `agy.cmd`
- `agy.ps1`
- `antigravity.exe`
- `antigravity.cmd`
- WSL `agy`
- WSL `antigravity`

### Windows Execution Rules

- `.exe`는 args 배열로 실행한다.
- `.cmd`와 `.bat`은 필요할 때만 shell mode를 사용한다.
- `.ps1`은 `powershell.exe -NoProfile -ExecutionPolicy Bypass` 경유를 사용한다.
- Codex `.cmd`가 실패하면 `codex.js` Node entrypoint를 우선 시도한다.
- WSL provider는 `wsl.exe -e <cli>`를 사용한다.
- WSL에 넘기는 파일 경로는 `C:\\Users\\...`에서 `/mnt/c/Users/...`로 변환한다.

### Diagnostics

설정 화면에는 다음 진단을 제공한다.

- Node.js 찾음 여부
- Claude CLI 찾음 여부
- Codex CLI 찾음 여부
- Antigravity CLI 찾음 여부
- WSL 사용 가능 여부
- WSL 안 CLI 사용 가능 여부
- rHWP WASM asset 로딩 가능 여부
- Obsidian vault binary read/write 가능 여부
- 테스트 HWP/HWPX 생성 가능 여부

## 10. Security and Privacy

- 문서 binary는 기본적으로 외부 서버에 업로드하지 않는다.
- Claude/Codex/Antigravity CLI에는 필요한 text context와 제한된 첨부만 전달한다.
- API key는 V1 필수 조건이 아니다.
- AI provider가 파일을 직접 수정하지 않도록 prompt와 architecture 양쪽에서 제한한다.
- operation executor는 vault file만 수정한다.
- vault 밖 경로는 사용자 설정에서 명시적으로 허용한 경우만 사용한다.
- 저장 전 사용자가 변경 내용을 볼 수 있어야 한다.

## 11. Milestones

### M0: Spec and Architecture

- 이 spec 문서 작성
- 기존 4개 소스의 역할 확정
- operation schema 확정
- Windows provider strategy 확정

### M1: Refactor rHWP Plugin Surface

- `src/main.ts`를 기능별 모듈로 분리
- file view, toolbar, editor host, settings 분리
- 기존 build 통과
- 기존 read/edit/save 동작 보존

### M2: Document Context Extractor

- 현재 열린 문서의 paragraphs 추출
- tables preview 추출
- images metadata 추출
- AI prompt용 compact context 생성
- 큰 문서 truncation 정책 적용

### M3: AI Provider Layer

- Claude provider 추가
- Codex provider 추가
- Antigravity provider 추가
- provider diagnostics UI 추가
- Windows native/WSL path handling 추가

### M4: Operation Planner

- AI response를 operation JSON으로 제한
- schema validation 추가
- operation preview UI 추가
- malformed JSON repair flow 추가

### M5: Text and Table Operations

- text insert/replace 적용
- create table 적용
- fill table cells 적용
- insert/delete row/column 적용
- save/re-render 검증

### M6: Image Operations

- vault image 삽입
- AI-generated image 삽입
- picture properties 편집
- image delete
- export 후 재오픈 검증

### M7: Windows Hardening

- Windows native Obsidian에서 provider diagnostics 검증
- `.cmd` wrapper 검증
- PowerShell execution policy 검증
- WSL fallback 검증
- 한글 경로/공백 경로 검증

### M8: Release Candidate

- 공식 플러그인 build
- test vault deploy
- sample HWP/HWPX smoke test
- release notes
- BRAT/community install 검증

## 12. Acceptance Criteria

V1은 다음 기준을 통과해야 한다.

- `.hwp`와 `.hwpx`를 Obsidian에서 열 수 있다.
- 현재 문서의 텍스트, 표, 이미지 metadata를 AI context로 추출한다.
- Claude provider가 문서 context를 읽고 operation JSON을 생성한다.
- Codex provider가 문서 context를 읽고 operation JSON을 생성한다.
- Antigravity provider가 설치된 경우 operation JSON을 생성한다.
- AI가 만든 텍스트를 현재 문서에 삽입할 수 있다.
- AI가 만든 표를 현재 문서에 삽입할 수 있다.
- 기존 표 셀을 AI가 수정할 수 있다.
- vault 안 이미지 또는 AI 생성 이미지를 문서에 삽입할 수 있다.
- 적용 전 preview를 보여준다.
- 저장은 사용자의 명시적 동작 후에만 수행된다.
- Windows에서 CLI 경로 진단이 동작한다.
- Windows에서 Codex `.cmd` 또는 `codex.js` 우회가 동작한다.
- Windows WSL fallback이 최소 하나 이상의 provider에서 동작한다.
- 한글 파일명 문서가 열리고 저장된다.

## 13. Open Questions

- rHWP editor iframe 내부 cursor position을 Obsidian plugin host가 안정적으로 읽을 수 있는가?
- 현재 `@rhwp/editor` wrapper가 command dispatch를 외부에서 호출할 수 있는가?
- AI-generated image는 Codex image generation을 기본으로 할 것인가, provider별 생성 기능을 추상화할 것인가?
- HWP5와 HWPX에서 표/이미지 삽입 후 Hancom Office 재오픈 fidelity를 각각 어느 수준까지 보장할 것인가?
- `master-of-hwp` Python/MCP를 플러그인에 직접 포함할 것인가, 선택적 companion server로 둘 것인가?

## 14. Recommended V1 Architecture Decision

V1은 플러그인 단독 실행을 우선한다.

- 문서 렌더링과 저장: `@rhwp/core`, `@rhwp/editor`
- AI provider: Obsidian plugin의 Node runtime에서 CLI spawn
- 문서 context: 플러그인 내부 rHWP document adapter
- MCP/Python `master-of-hwp`: 고급 분석과 companion mode로 선택 제공

이 결정은 설치 부담을 줄인다. Windows 사용자가 Python 환경 없이도 기본 기능을 사용할 수 있어야 한다. Python/MCP는 고급 사용자와 자동화 워크플로우를 위한 확장 경로로 둔다.

