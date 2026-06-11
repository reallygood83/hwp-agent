# 작업 목록

## 완료

- [x] 프로젝트 README 작성.
- [x] 제품/절차/ADR 문서 작성.
- [x] `rhwp` 연동 방식 조사.
- [x] Obsidian 플러그인 빌드 파일 구성.
- [x] read-only HWP/HWPX 파일 뷰 구현.
- [x] 저장 버튼이 있는 명시적 편집 모드 전환 추가.
- [x] 편집 모드를 떠날 때 저장 여부 확인.
- [x] 빈 HWPX 파일 생성을 위한 파일 메뉴 동작 추가.
- [x] Obsidian 언어 설정 기반 한국어/영어 다국어 처리 추가.
- [x] 에디터 툴바에 rhwp 버전 표시.
- [x] 편집기 내보내기 실패 시 HWP 저장 대체 경로 추가.
- [x] 새 파일 형식, 큰 파일 처리 방식, 큰 파일 기준 용량 설정 추가.
- [x] 신뢰할 수 있는 메타데이터 API가 확인될 때까지 추측성 작성자/조직 설정 제거.
- [x] 생성/수정 시각을 보여주는 접을 수 있는 속성 패널 추가.
- [x] 속성 패널을 기본으로 접힌 상태로 유지.
- [x] rhwp 버전 라벨을 upstream GitHub 저장소에 연결.
- [x] read-only 모드에서 확장자 검증이 있는 인라인 파일 이름 변경 추가.
- [x] 새로 만든 HWP/HWPX 파일을 바로 편집 모드로 열기.
- [x] 기본 저장 확인창을 세 가지 선택지를 가진 편집 세션 모달로 교체.
- [x] 테스트 vault 배포 스크립트 추가.
- [x] 빌드 결과물을 로컬 Obsidian 테스트 vault로 배포.
- [x] 프로젝트 워크스페이스와 플러그인 저장소를 단일 `obsidian-rhwp-editor` 저장소로 통합.
- [x] `rhwp-studio`를 포함하고 편집 모드가 로컬 iframe 자산을 가리키도록 변경.
- [x] Obsidian 커뮤니티 설치의 release asset 처리 방식을 재확인하고 추가 자산 검증 필요성 기록.
- [x] `obsidian-advanced-slides` 사례를 확인해 추가 자산이 플러그인 런타임 self-hydration으로 설치됨을 검증.
- [x] `rhwp_bg.wasm`과 `rhwp-studio/`를 GitHub Release zip에서 설치하는 self-hydration 로직 추가.
- [x] `main.js`, `manifest.json`, `styles.css`, `rhwp-editor.zip` 릴리즈 산출물 생성 스크립트 추가.
- [x] tag push 시 GitHub Release asset을 생성/업로드하는 GitHub Actions workflow 추가.
- [x] 편집 모드에서 `@rhwp/editor` iframe 임베딩 구현과 로컬 `rhwp-studio` 연동 검증.
- [x] Obsidian 공식 커뮤니티 플러그인 등록 절차를 `community.obsidian.md/account/plugins` 기반으로 확인.
- [x] 커뮤니티 자동 검사 통과 후 publish 버튼으로 플러그인 공개.
- [x] Obsidian 앱의 Community plugins 브라우저에서 `rHWP Editor` 검색 및 공식 설치 확인.
- [x] Obsidian 테스트 vault에서 플러그인 로드 확인.
- [x] 실제 `.hwp` 또는 `.hwpx` 샘플 렌더링 확인.
- [x] 폐기 가능한 샘플로 편집/내보내기 왕복 확인.
- [x] Obsidian에서 편집 모드 이탈 확인창 검증.
- [x] Obsidian에서 컨텍스트 메뉴의 빈 HWP/HWPX 생성 검증.
- [x] Obsidian에서 큰 파일 확인창 검증.
- [x] read-only/편집 모드의 속성 패널 레이아웃 검증.
- [x] 커뮤니티 플러그인 설치에서 `rhwp_bg.wasm`과 `rhwp-studio/` 자산이 함께 설치되는지 검증.
- [x] 추가 자산 설치 검증 후 GitHub Release asset과 Obsidian 커뮤니티 제출 절차 확정.
- [x] Obsidian에서 read-only 인라인 이름 변경 검증.
- [x] tag `0.2.2` push 후 GitHub Release `0.2.2`에 `main.js`, `manifest.json`, `styles.css`, `rhwp-editor.zip`이 업로드되는지 확인.
- [x] 공식 커뮤니티 설치 경로에서 플러그인 설치 확인.
- [x] 커뮤니티 등록은 `obsidianmd/obsidian-releases` PR이 아니라 Obsidian 계정의 plugin submission/publish flow로 진행함을 확인.
- [x] `0.2.3`에서 편집 모드 iframe의 `rhwp-studio` CSS/JS/WASM/font/icon 자산 로딩 문제 수정.
- [x] Obsidian 테스트 vault에서 편집 모드 진입, 문서 로드, 툴바 아이콘 표시 확인.
- [x] `0.2.3` 릴리스 노트에 편집 모드 자산 로딩 버그 수정 내역 기록.
- [x] `0.2.3` tag 재사용으로 꼬인 릴리스 상태를 피하기 위해 `0.2.4` 새 patch 릴리스 준비.

## 진행 중

- [ ] `AI_RHWP_PLUGIN_SPEC.md`를 기준으로 AI 통합 rHWP 플러그인 구현 계획 확정.

## 나중에

- [ ] 현재 열린 HWP/HWPX 문서를 AI-readable context로 추출하는 adapter 추가.
- [ ] Claude Code, Codex CLI, Antigravity CLI provider 계층 추가.
- [ ] AI operation JSON schema와 preview/apply flow 추가.
- [ ] rHWP 표 생성, 표 셀 편집, 이미지 삽입 operation executor 추가.
- [ ] Windows native CLI, `.cmd` wrapper, WSL fallback 진단 추가.
- [ ] 페이지 탐색과 확대/축소 컨트롤 추가.
- [ ] 큰 문서를 위한 렌더링 캐시 추가.
- [ ] rhwp가 지원되는 쓰기 API를 제공하면 새 문서에 작성자 메타데이터 적용.
- [ ] 플러그인 빌드 결과물에 대한 자동 스모크 테스트 추가.
