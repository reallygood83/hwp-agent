# 릴리스 노트

## 0.2.4

### Fixed

- `0.2.3` tag를 force-push로 여러 번 움직이며 GitHub Actions/Release/Obsidian 포털 상태가 애매해진 문제를 피하기 위해, 동일한 편집 모드 자산 로딩 수정 사항을 깨끗한 새 tag로 재발행한다.
- Obsidian 편집 모드에서 `rhwp-studio` iframe이 CSS 없이 HTML 메뉴 텍스트로 노출되던 문제를 수정한 상태를 포함한다.
- 편집 모드에서 rhwp WASM 초기화 실패 후 `Cannot read properties of undefined (reading '__wbindgen_malloc')` 오류가 발생하던 문제를 수정한 상태를 포함한다.
- 편집 모드 툴바와 메뉴의 SVG sprite 아이콘이 표시되지 않던 문제를 수정한 상태를 포함한다.

### Changed

- 편집 모드는 Obsidian 전용 `rhwp-studio-obsidian/` 런타임 엔트리포인트를 생성한다.
- 생성 엔트리포인트는 CSS와 메인 JS를 inline하고, WASM/font/보조 renderer 경로를 Obsidian resource URL 또는 inline data로 재작성한다.
- `0.2.3` tag를 더 재사용하지 않고 `0.2.4` tag를 새로 발행한다.

## 0.2.3

### Fixed

- Obsidian 편집 모드에서 `rhwp-studio` iframe이 CSS 없이 HTML 메뉴 텍스트로 노출되던 문제를 수정했다.
- 편집 모드에서 rhwp WASM 초기화가 실패한 뒤 파일 로드 시 `Cannot read properties of undefined (reading '__wbindgen_malloc')` 오류가 발생하던 문제를 수정했다.
- 편집 모드 툴바와 메뉴의 SVG sprite 아이콘이 표시되지 않던 문제를 수정했다.

### Changed

- 편집 모드 진입 시 Obsidian 전용 `rhwp-studio-obsidian/` 런타임 엔트리포인트를 생성한다.
- 생성 엔트리포인트는 CSS와 메인 JS를 inline하고, WASM/font/보조 renderer 경로를 Obsidian resource URL 또는 inline data로 재작성한다.
- rhwp 메인 WASM은 iframe 내부 fetch 대신 플러그인이 읽은 bytes를 직접 전달해 초기화한다.
