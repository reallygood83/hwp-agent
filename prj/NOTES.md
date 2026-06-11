# 개발 노트

## 2026-06-11: 0.2.3 편집 모드 로컬 자산 로딩 수정

### 증상

Obsidian 안에서 read-only HWP/HWPX 렌더링은 정상 동작했지만, 편집 모드 진입 시 `rhwp-studio` iframe이 깨졌다.

확인한 단계별 증상은 다음과 같다.

- `rhwp-studio/index.html`의 메뉴 HTML이 CSS 없이 본문에 그대로 노출됨.
- CSS/JS 경로를 resource URL로 바꾼 뒤에는 `Cannot read properties of undefined (reading '__wbindgen_malloc')` 오류가 표시됨.
- WASM 초기화를 우회한 뒤 편집기 UI와 문서 로드는 되었지만, 툴바 아이콘 sprite 이미지가 보이지 않음.

### 원인

`@rhwp/editor`는 iframe에 `studioUrl`만 넘기고, 내부 `rhwp-studio`는 일반 웹 서버 루트에서 실행되는 정적 앱으로 빌드되어 있었다. Obsidian 플러그인 폴더의 `app://...` resource URL로 직접 열면 다음 조건이 맞지 않았다.

- `index.html`의 상대 CSS/JS 링크가 iframe 안에서 안정적으로 해석되지 않았다.
- 번들 JS에는 `/assets/rhwp_bg-*.wasm`, `fonts/*.woff2`, dynamic import 경로처럼 웹 서버 루트 기준 경로가 박혀 있었다.
- `rhwp-studio`의 초기화 흐름은 WASM 초기화 실패를 내부 UI 오류로 처리하고도 부모 iframe 요청에는 `ready`를 true처럼 응답할 수 있었다. 그래서 부모 플러그인은 파일을 전송했고, 실제 문서 생성 시점에 초기화되지 않은 WASM 바인딩의 `__wbindgen_malloc` 참조가 터졌다.
- 아이콘은 CSS background의 외부 SVG resource URL로 남아 있어서 iframe의 inline CSS 안에서 표시되지 않았다.

### 해결

편집 모드 진입 전에 플러그인이 `rhwp-studio-obsidian/` 런타임 엔트리포인트를 생성하도록 변경했다.

- 원본 `rhwp-studio/index.html`을 읽어 CSS와 메인 JS 엔트리를 찾는다.
- CSS와 메인 JS를 생성 HTML 안에 inline으로 삽입해 iframe의 외부 module script 로딩 문제를 제거한다.
- JS 안의 WASM, font, CanvasKit renderer 경로를 Obsidian `getResourcePath()` URL로 재작성한다.
- rhwp 메인 WASM은 `app://...wasm` fetch에 의존하지 않고, 플러그인이 WASM bytes를 읽어 base64로 inline한 뒤 `@rhwp/core` 초기화 함수에 직접 전달한다.
- CSS 안의 SVG sprite는 `data:image/svg+xml` URL로 inline해 툴바/메뉴 아이콘이 외부 SVG 로딩에 의존하지 않게 한다.
- 생성물인 `rhwp-studio-obsidian/`은 `.gitignore`에 추가했다.

### 검증

로컬 테스트 vault에 배포하고 Obsidian에서 확인했다.

- read-only 모드에서 기존 문서 렌더링 정상.
- edit 모드 진입 정상.
- 편집기 UI, 문서 본문, ruler, status bar 렌더링 정상.
- 툴바 아이콘 sprite 표시 정상.
- `npm run build`, `npm run deploy:test-vault`, `npm run package:release` 성공.

### 주의

`rhwp-studio` upstream 빌드를 교체하면 번들 파일명, WASM 파일명, dynamic import 패턴이 바뀔 수 있다. 이 경우 `findHtmlAssetPath`, `findMainWasmPath`, `findRendererImportPath`, `inlineRhwpWasm`의 패턴을 다시 확인해야 한다.

### 릴리스 워크플로 후속 수정

처음 `0.2.3` tag를 push했을 때 GitHub Actions `Release #4`가 artifact attestation 단계에서 실패했다.

- 실패 메시지: `Failed to persist attestation: Requires authentication`
- 릴리스 asset 생성과 검증은 끝났지만, attestation 실패 때문에 GitHub Release 업로드 단계까지 진행되지 않았다.
- 릴리스 asset 업로드가 우선이므로 `actions/attest@v4` 단계를 제거하고 workflow 권한을 `contents: write`만 남겼다.
- GitHub Release 본문은 루트 `RELEASE_NOTES.md`의 해당 tag 섹션을 읽어 사용하도록 변경했다.
- `0.2.3` Release가 성공적으로 생성되고 asset의 `manifest.json`도 `0.2.3`이었지만, Obsidian 커뮤니티 포털은 한동안 `No release matches your manifest version` 메시지를 표시할 수 있었다. 첫 실패한 scan/tag 상태나 GitHub release 캐시를 포털이 잠시 들고 있는 것으로 보이며, GitHub Release asset을 직접 확인한 뒤 잠시 기다렸다가 `Check for new releases`를 다시 실행한다.

### Codex 작업 중 혼동한 지점

이 수정은 Codex가 저장소를 직접 수정, 빌드, 배포, push하면서 진행했다. 당시 혼동이 있었던 이유는 다음과 같다.

- 편집 모드 실패가 한 가지 버그가 아니라 `index.html` 외부 CSS/JS 로딩 실패, rhwp WASM 초기화 실패, SVG sprite 표시 실패가 순서대로 드러나는 다층 문제였다.
- 첫 화면의 "메뉴 HTML이 본문에 노출됨" 증상만 보고 CSS/resource URL 문제로 좁혔지만, 이후 `__wbindgen_malloc` 오류가 나오면서 iframe 내부 WASM 초기화 실패도 별도 원인임이 확인됐다.
- `@rhwp/editor`는 iframe이 `ready`라고 응답하면 부모 플러그인이 정상이라고 판단한다. 하지만 `rhwp-studio` 내부에서는 WASM 초기화 실패를 UI 오류로 처리하면서도 부모의 `ready` 요청에는 성공처럼 응답할 수 있어, Codex가 초기에 "자산 경로만 고치면 된다"고 과소평가했다.
- GitHub Actions 릴리스는 브랜치 push가 아니라 semver tag push에서만 실행되는데, Codex가 처음에는 `main`/`dev` push 후 릴리스가 곧 생길 것처럼 판단했다. 실제로는 `0.2.3` tag push가 필요했다.
- `actions/attest@v4` 실패는 릴리스 파일 생성 실패가 아니라 attestation 저장 권한/인증 문제였다. 릴리스 asset 업로드가 목적이므로 해당 단계를 제거하는 방향으로 정리했다.

다음에 비슷한 문제가 생기면, "HTML 노출", "WASM 초기화", "sprite/icon 표시", "Release workflow trigger"를 각각 별도 단계로 보고 확인해야 한다.

### 0.2.4로 재발행한 이유

`0.2.3`은 GitHub Release asset 자체는 생성되었지만, 같은 tag를 force-push로 여러 번 옮기며 다음 상태가 섞였다.

- 첫 `0.2.3` workflow는 artifact attestation 단계에서 실패했다.
- 이후 같은 tag를 새 커밋으로 옮겨 asset upload는 성공했지만, 다시 notes extraction workflow를 고치며 같은 tag를 재사용했고 최신 commit check가 실패로 남았다.
- Obsidian 커뮤니티 포털도 한동안 `No release matches your manifest version` 메시지를 표시했다.

semver release tag는 한 번 공개되면 사실상 immutable하게 다루는 편이 안전하다. 이미 스캔되거나 실패한 tag를 계속 재사용하면 GitHub Actions check, GitHub Release, Obsidian 커뮤니티 포털 캐시가 서로 다른 상태를 볼 수 있다.

따라서 `0.2.3`을 더 고치지 않고, 같은 편집 모드 수정 사항을 `0.2.4`로 새로 발행한다. 이후 릴리스에서는 tag force-push를 피하고, 문제가 생기면 다음 patch version을 올린다.

## 2026-06-11: `prj/` 문서를 main에 공개하기로 변경

처음에는 `prj/`를 `dev` 브랜치에만 두고 `main`에서는 제외했다. 그 이유는 Obsidian 커뮤니티 플러그인 설치/검증이 GitHub repository를 통째로 clone하거나 source archive를 기준으로 플러그인을 만든다고 오해했기 때문이다.

실제로 Obsidian 커뮤니티 플러그인 배포에서 중요한 것은 `manifest.json`의 `version`과 같은 GitHub Release tag, 그리고 그 release에 첨부된 asset이다. 기본 설치 asset은 `manifest.json`, `main.js`, `styles.css`이며, 이 플러그인은 추가 자산 설치를 위해 `rhwp-editor.zip`도 함께 올린다.

따라서 `prj/`가 `main`에 있어도 release asset에 포함하지 않으면 사용자의 플러그인 설치물에는 섞이지 않는다. `prj/`는 배포 파일이 아니라 공개 저장소의 개발 기록이다.

운영 방침을 다음처럼 바꾼다.

- `prj/`는 `main`에도 포함한다.
- `prj/`에는 공개해도 되는 개발 기록만 남긴다.
- 개인 장비 경로, 토큰, 비공개 계정 정보, 임시 vault 절대 경로는 커밋하지 않는다.
- 릴리스 전에는 `prj/`에 민감 정보가 없는지 확인한다.
- release asset과 `rhwp-editor.zip`에는 플러그인 실행에 필요한 파일만 포함하고 `prj/`는 넣지 않는다.
