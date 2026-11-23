# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · **한국어** · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.33.1-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

GitHub를 개선하는 사용자 스크립트입니다. 완전한 설정 패널, `Ctrl/⌘+K` 명령 팔레트,
렌더링된 Markdown용 이미지 갤러리, GitHub가 파일을 나열하는 모든 곳의 컬러 파일
아이콘, 그 파일들의 blame 스타일 나이 색상, 저장소 목록의 폴더 펼치기, 파일 크기와 원클릭 다운로드,
파일 작업용
컨텍스트 메뉴, 모든 파일의 빠른 미리보기, Conventional Commits 커밋 배지, 페이지
번역, 사이드바의 유사한 리포지토리 패널을 제공합니다.

> **상태:** 초기(`0.33.1`). 즉시 검색이 있는 설정 패널(일반 · 갤러리 · 파일 · 커밋 ·
> 번역 · 팔레트 · 탐색 · 백업 · 정보), `Ctrl/⌘+K` 명령 팔레트, Markdown 이미지 갤러리,
> 컬러 파일 아이콘, blame 스타일 나이 색상, 폴더 펼치기, 다운로드 버튼이 있는
> 파일 크기, 파일
> 컨텍스트 메뉴, 파일 빠른 미리보기, 커밋 배지, 페이지 번역. 더 많은 GitHub 개선이
> 예정되어 있습니다.

> 스크립트의 `@updateURL` / `@downloadURL`은 GitHub의 `main`을 가리키므로 아래
> 설치 URL은 항상 최신 빌드로 연결됩니다.

## 빠른 설치

1. 사용자 스크립트 관리자를 설치합니다([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/),
   [ScriptCat](https://scriptcat.org/) 권장).
2. GitHub에서 스크립트를 설치합니다(아래 raw URL).

**설치 URL(GitHub — 최신):**

```
https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)

### URL로 설치(대시보드)

| 관리자 | 경로 |
|---------|------|
| Tampermonkey | 대시보드 → **Utilities** → **Install from URL** |
| Violentmonkey | 대시보드 → **+** → **Install from URL** |
| Greasemonkey | 부가 기능 메뉴 → **New User Script** → raw URL 붙여넣기 |
| ScriptCat | [확장 프로그램](https://scriptcat.org/)을 설치한 뒤 GitHub raw URL로 **Install from URL** |

### 수동 설치

1. 이 저장소의 빌드된 [`github-plus.user.js`](https://github.com/NemoKing1210/github-plus/blob/main/github-plus.user.js)를 엽니다(또는 클론 후 `npm run build` 실행).
2. 파일 내용을 모두 복사합니다.
3. 사용자 스크립트 관리자에서 새 스크립트를 만들고 코드를 붙여넣습니다.
4. 저장하고 스크립트를 활성화합니다.

## 업데이트

스크립트에는 GitHub raw 파일을 가리키는 `@updateURL` 및 `@downloadURL`
메타데이터가 있어 지원되는 관리자가 자동으로 업데이트합니다.

메인테이너용 릴리스 단계:
[docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing)을 참고하세요.

## 기능

### Markdown 이미지 갤러리

GitHub에서 렌더링된 모든 Markdown 컨테이너가 하나의 갤러리 세트입니다:

- **아무 이미지나 클릭** — 저장소 README, `.md` 파일 보기, wiki 페이지, 이슈,
  풀 리퀘스트, 리뷰 댓글(GitHub가 `.markdown-body`를 렌더링하는 모든 곳) 또는
  빠른 미리보기의 렌더링된 Markdown — 내장 뷰어에서 전체 화면으로 열립니다.
- **세트 전체 탐색** — `←`/`→`(또는 화면의 화살표)로 같은 컨테이너의 다른 이미지로
  이동하고, 중앙 썸네일 스트립으로 어디든 이동할 수 있으며, 카운터가 현재 위치를
  보여 줍니다.
- **확대/이동** — 휠, `+`/`−`, 더블 클릭, 핀치로 설정한 한도까지 확대됩니다. 어떤
  배율에서도 드래그로 이미지를 옮길 수 있고, `0`은 초기화, `r`은 회전입니다. 인접
  이미지를 미리 불러와 탐색이 즉시 이루어집니다.
- **필요할 때 원본 크기** — 이미지가 더 큰 파일(`/blob/` 페이지 뒤의 저장소 파일,
  업로드된 첨부 파일, 임의의 이미지 URL)을 가리키면 해당 파일을 확인한 뒤
  교체합니다. 사용할 수 없을 때도 깨진 이미지 없이 원래 해상도를 얻습니다.
- **보이는 이미지 다운로드** — Markdown 이미지에 마우스를 올리면 다운로드 버튼이
  나타나고, 뷰어 도구 모음에도 하나가 있습니다. 파일은 원래 이름으로 저장되며
  (프록시 주소는 원래 파일 이름으로 풀립니다), 설정 하나로 두 버튼을 모두 숨길 수
  있습니다.
- **기본적으로 조용함** — 배지, 상태 스니펫, 이모지, 아주 작은 아이콘은 갤러리
  자리를 차지하지 않습니다. 이미지는 GitHub 고유의 모양을 유지하며(갤러리가 열린다는
  것은 커서로만 알림), 보조 키(Ctrl/Cmd/Shift/Alt) 클릭과 가운데 클릭은 GitHub에
  그대로 맡기므로 새 탭에서 파일 열기가 이전과 똑같이 동작합니다.
- **테마 대응** — 갤러리와 설정 패널은 GitHub 자체의 색상 변수를 사용하므로 선택한
  테마(라이트, 다크, 딤)를 따릅니다.

### 파일 아이콘

GitHub는 모든 파일과 폴더를 같은 회색 글리프로 그리므로 이름을 읽기 전까지 `.ts`와
`.css`가 똑같아 보입니다. GitHub Plus는 색을 입힙니다:

- **확장자로 유형 구분** — 언어, 구성 및 데이터 형식, 이미지, 미디어, 압축 파일,
  문서에 자체 아이콘을 부여합니다. `.d.ts`, `.spec.ts` 같은 복합 확장자는 기본
  확장자보다 먼저 일치합니다.
- **알려진 파일 이름** — `Dockerfile`, `package.json`, `README`, `.gitignore`,
  `tsconfig.json` 등에 전용 아이콘을 부여합니다.
- **폴더 역할** — `src`, `dist`, `node_modules`, `docs`, `.github`, `components`,
  `utils` 등 흔한 폴더도 표시합니다.
- **GitHub가 파일을 나열하는 모든 곳** — 저장소 트리와 하위 폴더, 코드 페이지의
  파일 트리 사이드바, blob·tree·blame 페이지의 파일 헤더, 풀 리퀘스트 파일 헤더와
  diff 트리, 커밋 파일 목록, 코드 검색, gist, 릴리스 자산.
- **조용함** — GitHub 기본 글리프를 숨기고 제자리에서 교체합니다. 레이아웃 변경도,
  추가 테두리도 없으며 기능을 끄면 GitHub가 원래대로 돌아갑니다.

아이콘은 [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
(MIT)의 엄선된 부분 집합입니다. 저작자 표시는
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES)에 있습니다.

### 파일 나이

GitHub는 각 파일이 마지막으로 변경된 지 얼마나 됐는지 이미 보여 주지만, 한눈에는
모든 날짜가 똑같아 보입니다. GitHub Plus는 blame 범례를 빌려 날짜 텍스트 자체에
색을 입힙니다:

- **한눈에 보는 나이** — 최신 날짜는 따뜻한 색(다크 테마는 `#ffd78d`, 라이트
  테마는 GitHub의 주의 골드)이고 오래된 날짜는 테마의 차분한 회색으로 바래므로,
  4개월 된 파일도 이미 오래된 것으로 보입니다. 눈금은 의도적으로 현재 쪽에
  집중되어 있어 일·주·월은 구분되지만 1년이 넘으면 그냥 회색입니다. 라이트와 다크
  테마에는 각각 전용 색역이 있어 두 테마 모두에서 색이 선명하고 읽기 쉽습니다.
- **레이아웃은 그대로** — 날짜는 GitHub 자체의 텍스트, 상대 표현, 툴팁을 유지하고
  색만 바뀝니다. 행 크기가 달라지지 않으며 접근 가능한 레이블도 GitHub가 렌더링한
  그대로입니다.
- **파일과 폴더** — 폴더 행도 색이 입혀지며(날짜는 마지막 변경을 뜻합니다), 설정
  으로 파일에만 적용할 수 있습니다.
- **조용함** — 기능을 끄면 GitHub의 원래 날짜 색으로 돌아가고 흔적이 남지 않습니다.

### 폴더 펼치기

저장소 목록은 한 번에 한 단계만 보여 주므로 경로를 따라가려면 폴더마다 페이지를
새로 불러와야 합니다. GitHub Plus는 목록을 트리로 바꿉니다:

- **한 번의 클릭으로 안을 확인** — 모든 폴더 행 앞에 셰브론이 붙고, 폴더 내용이
  바로 아래에 일반 행으로 한 단계씩 들여쓰여 나타납니다. 같은 셰브론으로 다시
  접을 수 있고, 중첩된 폴더도 얼마든지 깊이 펼칠 수 있습니다.
- **폴더 이름은 그대로 이동** — 펼치는 것은 셰브론뿐이라 이름을 그냥 클릭하면
  이전처럼 폴더가 열립니다. 셰브론은 실제 버튼(`aria-expanded`, 폴더별 레이블)이며
  키보드로도 조작할 수 있습니다.
- **다른 기능도 그대로 동작** — 중첩 행은 GitHub 행 모양을 따르므로 파일 아이콘,
  blame 스타일 나이 색상, 크기, 다운로드 버튼, 빠른 미리보기(이전/다음은 폴더
  안에서만 이동), 파일 컨텍스트 메뉴가 그대로 적용됩니다.
- **날짜와 메시지 포함** — 중첩 행마다 마지막 커밋 메시지와 나이 색상이 표시되며,
  페이지와 같은 세션에서 읽으므로 비공개 저장소도 동작하고 API 토큰을 쓰지
  않습니다.
- **정직한 한계** — 빈 폴더는 그렇다고 알려 주고, 1000개를 넘는 폴더는 처음
  1000개와 안내를 보여 주며, 요청이 실패하면 반쯤 그려진 트리 대신 폴더를 접은
  채로 토스트를 띄웁니다.
- **조용함** — 기능을 끄면 모든 셰브론과 중첩 행이 사라져 GitHub가 원래대로
  돌아가고, 페이지를 이동하면 모든 폴더가 다시 접힙니다.

### 파일 크기 및 다운로드

GitHub의 디렉터리 목록은 파일이 언제 바뀌었는지는 보여 주지만 크기는 보여 주지 않으며,
저장하려면 먼저 파일을 열어야 합니다. GitHub Plus는 두 가지를 파일 행에 바로 추가합니다:

- **한눈에 보는 크기** — 저장소 목록의 모든 파일은 전용 열에 은은한 크기를 표시합니다.
  크기는 뷰포트 근처의 행에 대해서만 요청하고 세션 동안 캐시하며, 크기를 읽을 수 없는
  파일은 아무것도 표시하지 않습니다.
- **그 자리에서 다운로드** — 각 행의 왼쪽에는 파일 크기, 오른쪽에는 GitHub의 아이콘 버튼과 같은
  모양의 다운로드 버튼이 놓입니다. 파일은 원래 이름으로 저장됩니다. 동일 출처 raw 경로 덕분에
  비공개 저장소에서도 작동하며, 요청이 차단되면 새 탭에서 엽니다. GitHub의 파일 페이지(blob)에는
  이미 크기와 다운로드 버튼이 있으므로 그대로 둡니다.
- **API 할당량 없음** — 크기는 GitHub API가 아니라 파일 자체의 raw 주소에 보내는 HEAD
  요청으로 가져오므로 시간당 60회의 익명 한도를 사용하지 않습니다.
- **은은함** — 폴더의 열은 비어 있으며, 기능을 끄면 모든 크기, 버튼, 추가한 열이 사라져 원래
  GitHub로 돌아갑니다.

### 파일 및 폴더 컨텍스트 메뉴

파일이나 폴더를 마우스 오른쪽 버튼으로 클릭하는 것은 원하는 작업으로 가는 가장 빠른
길이지만, GitHub 자체 메뉴에는 그런 작업이 없습니다. GitHub Plus는 파일과 폴더에 대해
그 메뉴를 대체합니다:

- **빠른 작업** — 저장소 목록, 파일 트리 사이드바 또는 렌더링된 Markdown의 파일
  링크에서 파일을 마우스 오른쪽 버튼으로 클릭하면
  **열기**, **새 탭에서 열기**, **다운로드**, **내용 복사**,
  **링크 복사**, **경로 복사**, **이름 복사**를 사용할 수 있습니다. 파일 페이지나
  blame 페이지에서도 같은 메뉴가 나타납니다(**열기**는 이미 그 페이지에 있으므로
  없습니다).
- **폴더도 지원** — 목록이나 사이드바의 폴더, 렌더링된 Markdown의 폴더 링크에는
  전용 짧은 메뉴가 열립니다: **열기**, **새 탭에서 열기**, **링크 복사**,
  **경로 복사**, **이름 복사**. 폴더에는 다운로드하거나 읽을 내용이 없으므로 그
  작업들은 빠집니다.
- **메뉴에서 펼치기** — 저장소 목록의 폴더에는 **펼치기** 또는 **접기**가 함께
  나옵니다. 행의 셰브론과 같은 토글을, 셰브론을 겨냥하지 않고 쓸 수 있습니다.
- **내용 복사** — 텍스트 파일의 내용은 페이지를 열지 않고 바로 클립보드로 들어갑니다.
  바이너리 파일과 1 MiB를 넘는 파일은 깨진 문자가 붙거나 탭이 멈추는 대신 명확한
  알림과 함께 거부됩니다.
- **경로 복사** — 저장소 기준 상대 경로(`src/main.js`)로, 터미널·import 문·링크에
  바로 붙여 넣을 수 있습니다.
- **이름 복사** — 항목 자체의 이름(`src`, `README.md`)만 복사합니다. import 문,
  커밋 메시지, 검색에 유용합니다.
- **도움이 되는 곳에서만** — 서브모듈, 이미지, 미디어, 저장소 파일을 가리키지 않는
  Markdown 링크를 포함한 일반 링크에는 기본 메뉴가 그대로 유지됩니다.
  파일이나 폴더를 가리키지 않는 오른쪽 클릭은 이전과 똑같이 동작합니다.
- **키보드도 지원** — 컨텍스트 메뉴 키를 누르면 파일 링크 위치에 같은 메뉴가 열리고,
  화살표 키로 이동하며 닫으면 포커스가 돌아옵니다. 기능을 끄면 어디서나 브라우저
  메뉴로 돌아갑니다.

### 파일 빠른 미리보기

페이지를 떠나지 않고 모든 파일을 열 수 있습니다 — 파일 목록의 눈 버튼,
렌더링된 Markdown의 파일 링크 또는 파일 컨텍스트 메뉴의 **미리보기**에서:

- **원본이 아닌 렌더링** — Markdown은 렌더링되고 정화되며, 소스 파일에는 구문
  강조와 줄 번호가 붙고, 이미지·동영상·오디오는 그 자리에서 재생되며, PDF는
  GitHub 페이지 정책이 프레임을 허용할 때 브라우저 자체 뷰어에서 열립니다.
  그 밖의 경우(페이지가 차단한 PDF 포함)는 깨진 프레임 대신 **GitHub에서
  열기**와 **다운로드**가 있는 정직한 카드를 보여 줍니다.
- **폴더 안에서 이동** — 같은 디렉터리의 파일이 하나의 집합이 되어 이전/다음
  버튼과 방향키로 전환할 수 있고, 현재 위치가 바닥글에 표시됩니다.
- **길게 눌러 미리보기** — 목록의 파일 이름이나 렌더링된 Markdown(빠른 미리보기
  안 포함)의 파일 링크에서 마우스 왼쪽 버튼을 길게 누르면 미리보기가 열립니다.
  길게 누르는 시간(기본 450ms)과 포인터 위치의 진행 원은 설정에서 바꿀 수 있습니다.
  짧게 클릭하면 여전히 파일이 열리고, 드래그하거나 텍스트를 선택하면 취소됩니다.
- **헤더의 작업** — GitHub에서 파일 열기, 원본 내용·링크·경로 복사, 원래 파일
  이름으로 다운로드.
- **Markdown: 미리보기 또는 소스** — 세그먼트 컨트롤로 렌더링된 Markdown과 원본
  텍스트(Markdown으로 강조)를 전환합니다.
- **비공개 저장소에서도 안전** — 상대 이미지와 링크가 동일 출처 raw 경로로
  해석되므로 비공개 README의 이미지도 유지됩니다. Markdown은 정화되고 외부
  이미지는 referrer 없이 로드됩니다.
- **정직한 제한** — 텍스트와 Markdown은 최대 2 MiB, PDF는 최대 25 MiB이며,
  강조에도 상한이 있어 거대한 파일이 탭을 멈추지 않습니다. 한도를 넘으면 카드에서
  GitHub와 원본 파일로 이동할 수 있습니다.

### 커밋 배지

Conventional Commits 형식의 커밋 제목은 `type(scope):` 접두사를 페이지에서 하나의
라벨로 보여 줍니다.

- **하나의 두 색 라벨** — 유형은 색상 세그먼트에, 범위는 차분한 세그먼트에 담겨
  하나의 둥근 윤곽을 이루고 뒤에 차분한 콜론이 붙습니다. `fix(parser): handle
  empty input` 을 한눈에 읽을 수 있으며 제목 텍스트는 한 글자도 바뀌지 않습니다.
- **종류별 색상, 나머지는 정직하게** — `feat`, `fix`, `docs`, `style`,
  `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert` 는 각자의 색을
  가지며, 그 밖의 소문자 유형은 중립 색을 받습니다(꾸미지 않게 할 수도 있음).
  `!` 접두사에는 호환되지 않는 변경을 뜻하는 빨간 표시가 붙습니다.
- **GitHub가 제목을 보여 주는 모든 곳** — 커밋 기록, 풀 리퀘스트의 **Commits**
  탭, 단일 커밋 페이지, 리포지토리 홈의 최신 커밋 블록, 클래식 커밋 보기.
  텍스트가 그대로이므로 복사, 검색, 번역이 이전과 똑같이 동작하고, 기능을 끄면
  GitHub의 원래 표시로 돌아갑니다.

### 번역

마크업을 망가뜨리지 않고 페이지 텍스트를 번역합니다 — README, 이슈나 토론,
풀 리퀘스트, 댓글, 커밋 메시지, 제목 또는 빠른 미리보기에서 연 Markdown 파일:

- **텍스트 옆의 버튼** — README 파일 헤더, 댓글의 작업 줄, 커밋이나 이슈 제목.
  GitHub에 헤더가 없으면 텍스트 위에 작은 막대가 나타납니다.
- **마크업 유지** — 링크, 이미지, 인라인 코드, 작업 체크박스, 강조가 계속
  작동합니다. 번역은 텍스트 블록만 바꾸고 주변 구조는 건드리지 않습니다.
- **버튼 또는 자동** — 기본적으로 클릭하기 전에는 아무것도 전송하지 않습니다.
  자동 모드에서는 블록이 화면에 들어올 때 번역하며 **원문 표시** 버튼은 그대로
  남습니다.
- **제자리 또는 아래** — 원문을 바꾸거나 아래에 번역을 표시합니다.
  **원문 표시**는 정확한 원문을 되돌리고, 호버 표시는 포인터나 포커스가 블록
  안에 있는 동안 원문을 볼 수 있게 합니다.
- **일반 텍스트 파일도** — 코드로 표시되는 라이선스 및 고지 파일(LICENSE, COPYING)에도 같은 버튼이 나타납니다. 번역은 파일 아래에 표시되며 코드 자체는 다시 쓰지 않습니다.
- **6개 제공업체** — 기본은 무료 Google(키 불필요, 비공식, 속도 제한)이며
  DeepL, Microsoft, Yandex, OpenAI 호환 엔드포인트 또는 자체 LibreTranslate를
  선택할 수 있습니다. 번역할 텍스트는 선택한 서비스로 전송되고 API 키는 이
  브라우저에만 저장되므로 설정 백업에 포함됩니다.
- **캐시** — 번역은 기본 24시간 동안 재사용되며(설정 가능, 0이면 캐시 끔) 설정
  페이지에서 지울 수 있습니다.

### 명령 팔레트

GitHub 어느 페이지에서든 `Ctrl/⌘+K`를 누르면 그곳에서 하는 모든 일을 검색하는 하나의
필드가 열립니다:

- **현재 위치에서 시작** — 저장소 페이지에서는 해당 저장소가 이미 경로에 들어간
  채로 팔레트가 열리므로 첫 목록은 그 저장소의 페이지입니다.
- **`Tab`으로 깊이 들어가기** — 입력 필드는 경로(`owner / repo / 폴더 / 검색어`)
  입니다. 저장소 행에서 `Tab`을 누르면 경로에 추가되고, 폴더 행에서 다시 `Tab`을
  누르면 그 폴더로 들어갑니다. 목록은 그 폴더의 파일이 되고 경로는 현재 위치 기준
  으로 표시되며, `Tab`은 트리가 허용하는 만큼 계속 들어갑니다.
  입력 필드가 비어 있을 때는 `→`와 `←`도 같은 역할을 하므로 화살표 키만으로 경로를 오갈 수 있습니다.
  `Backspace`는 마지막
  단계를 지우고, `Ctrl/⌘+Backspace`는 경로와 검색어를 비우며, 경로 세그먼트를
  클릭하면 그 아래를 모두 버립니다.
- **내 저장소** — 소유한 모든 저장소가 먼저 나오고, 행에 스타, 언어, 최근 push,
  공개 범위가 표시됩니다. `@`를 입력하면 저장소만 검색합니다.
- **스타 표시한 저장소** — 자주 돌아오는 프로젝트로, 내 저장소 다음에 오며 별표로
  표시됩니다.
- **경로에 있는 저장소의 파일** — `/`는 그 안의 모든 경로나 일치하는 검색어를
  보여 줍니다. 폴더 행에는 표시가 붙고 `Tab`으로 단계를 열 수 있으며, 파일은 보고
  있는 ref에서 GitHub로 열립니다.
- **열린 issue와 pull request** — `#`는 해당 저장소의 열린 issue와 pull request를
  보여 주며 issue 또는 pull request 배지, 작성자, 업데이트 시간이 붙습니다. 제목,
  번호, 작성자로 검색합니다. 저장소의 Issues 또는 Pull requests 행에서 `Tab`을
  누르면 `#` 없이 해당 목록을 별도 단계로 엽니다.
- **관대한 검색** — 검색어는 대소문자와 라틴 악센트를 무시하고(`cafe`로 `Café`를
  찾습니다), 단어 시작과 전체 단어를 우선하며, 공백으로 나뉜 모든 부분이
  일치해야 합니다.
- **행으로 표시되는 페이지** — 경로에 있는 저장소 자체의 페이지(Code, Issues, Pull
  requests, 새 이슈, 변경 사항 비교, Actions, Projects, Discussions, Releases, Wiki,
  Security, Insights, 소유한 경우 Settings) 또는 루트에서는 계정 페이지(프로필,
  저장소, 스타, 새 리포지토리, 알림, gists, GitHub 설정, 대시보드)가 한 행씩
  나옵니다. 저장소 행에는 `이동` 힌트가 붙고, GitHub 검색 행이 모든 검색어의
  마지막에 옵니다. 경로 안에서는 코드, `#`는 issue, `@`와 경로 밖의 자유
  검색어는 저장소를 검색합니다.
- **GitHub Plus 작업** — 패널 열기, 기능 전환, 캐시 새로 고침. `>`는 명령만
  표시합니다.
- **즐겨찾기와 최근 항목** — 자주 쓰는 항목은 `Alt+P`로 고정합니다. 고정한 행은
  별표가 붙어 맨 앞에 오며, 빈 목록과 검색 결과 모두 그렇습니다. 최근에 연 행은
  다음에 열 때 맨 위로 돌아옵니다(GitHub 계정별).
- **모든 행의 작업** — 행을 마우스 오른쪽 버튼으로 클릭하거나 `Shift+F10`을 누르면
  열기, 새 탭에서 열기, 링크·경로·클론 주소·issue 번호 복사, 고정 및 해제를 할 수
  있습니다.
- **빠르고 조용하게** — 팔레트는 캐시된 목록을 즉시 그리고, 백그라운드에서 갱신하며
  선택한 행을 유지합니다. 결과는 세션 동안과 새로 고침 사이에 ETag와 함께 캐시되므로
  API 할당량을 쓰지 않습니다. 토큰이 없어도 공개 데이터를 읽고 모든 명령이
  동작합니다.
- **선택적 GitHub 토큰** — 팔레트 설정 페이지에서 추가하면 비공개 저장소와 전체
  목록을 볼 수 있습니다(시간당 60회 대신 5,000회). 토큰은 사용 전에 검증되고 이
  브라우저에만 저장되며, 백업에 절대 기록되지 않고 `api.github.com`으로만 전송됩니다.
  캐시는 계정별로 분리되므로 계정을 바꿔도 다른 사람의 저장소가 표시되지 않습니다.
- **키보드 우선** — `↑`/`↓`로 이동, `Enter`로 열기, `Ctrl/⌘+Enter`로 새 탭에서 열기,
  `Tab`으로 저장소, 폴더, issue 목록에 들어가기, `←`/`→`로 경로 오가기, `Backspace`로 경로 한 단계 나가기, `Alt+P`로
  고정,
  `Ctrl/⌘+C`로 행 복사, `?`로 모든 키와 접두사 보기, `Esc`로 닫기(도움말 먼저).
  댓글이나 README 편집기에서 입력하는 동안에는 방해하지 않고, 탐색 시 스스로
  닫힙니다. 단축키는 프리셋이거나 팔레트 설정 페이지에서 기록한 임의의 조합입니다.

### 유사한 리포지토리

모든 공개 리포지토리 페이지의 사이드바에 보고 있는 리포지토리에 가까운 프로젝트를
**유사한 리포지토리**로 표시합니다:

- **선택할 수 있는 두 가지 데이터 소스** — **GitHub**(기본값)는 리포지토리의 주제와 기본
  언어로 `api.github.com`을 검색하고 공통 주제, 같은 언어, 비슷한 별표 수로 정렬합니다.
  **SimRepo**는 미리 계산된 유사도 데이터를 보여 줍니다. 타사이므로 패널이 열어 본
  리포지토리 이름을 전송하며, 다음 페이지에는 SimRepo 프로젝트에 별표가 필요합니다.
  설정 카드에 이 점이 분명히 적혀 있습니다.
- **한눈에 판단하는 행** — 소유자/이름, 설명, 색이 있는 기본 언어, 별표, 포크, 보관됨
  라벨, 상대적 일치율. 집합에서 가장 강한 일치가 100%로 표시됩니다.
- **페이지 나누기** — 소스에 다음 결과가 있으면 **더 보기**가 추가합니다.
- **정직한 상태** — 불러오는 중, 결과 없음, 데이터셋에 없는 리포지토리, 재설정 시간과
  함께 표시되는 조회 한도, 실패한 요청에 각각 전용 줄이 있어 사이드바에 빈 상자가 남지
  않습니다.
- **공개 리포지토리만** — GitHub가 공개로 표시한 리포지토리에서만 가져옵니다. 비공개,
  내부 또는 공개 여부를 알 수 없는 리포지토리는 요청을 보내지 않으며 패널도 표시하지
  않습니다.
- **설정** — 마스터 스위치, 데이터 소스, 페이지당 결과 수, 캐시 기간은 **탐색** 설정
  페이지에 있습니다.

### 설정 패널

아바타 메뉴의 **GitHub Plus 설정** 행(GitHub 자체 **Settings** 바로 아래), 팔레트의
설정 명령, 또는 사용자 스크립트 관리자의 메뉴 명령으로 엽니다. 변경
사항은 초안입니다: **저장**을 누르기 전에는 아무것도 기록되지 않습니다. **취소**,
배경 클릭, `Escape`는 초안을 버리고, **기본값으로 재설정**은 먼저 확인을 요청합니다.

## 설정

`gp_settings_v1`에 저장됩니다.

| 키 | 기본값 | 비고 |
|-----|---------|------|
| `language` | `'auto'` | 설정 패널 UI 언어(`'auto'`는 브라우저를 따름) |
| `gallery.enabled` | `true` | Markdown 이미지 갤러리 마스터 스위치 |
| `gallery.sources.markdown` | `true` | 소스별 스위치(등록된 소스마다 한 항목) |
| `gallery.skipBadges` | `true` | 배지 서비스(GitHub camo 프록시 뒤의 배지와 Actions 상태 배지 포함), 이모지, 높이 ≤ 40 px 이미지, 두 축 모두 80 px 미만인 이미지 건너뛰기 |
| `gallery.upgradeFullSize` | `true` | 링크된 원본 크기 이미지 확인 및 로드 |
| `gallery.download` | `true` | 뷰어와 Markdown 이미지에 마우스를 올렸을 때의 다운로드 버튼 |
| `gallery.thumbnails` | `true` | 뷰어의 썸네일 스트립 |
| `gallery.loop` | `true` | 마지막 이미지에서 처음으로 순환 |
| `gallery.maxZoom` | `8` | 확대 한도(2× … 16×) |
| `toasts.enabled` | `true` | 토스트 알림 |
| `toasts.position` | `'bottom-right'` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `toasts.duration` | `5000` | 자동 숨김 지연(ms, `0`은 닫을 때까지 유지) |
| `logging.enabled` | `false` | 콘솔 진단: GP 코드, 모듈, 세부 정보, 스택. 기본적으로 꺼짐 |
| `fileIcons.enabled` | `true` | 파일 및 폴더 아이콘 마스터 스위치 |
| `fileIcons.folders` | `true` | 흔한 폴더 이름의 전용 아이콘 |
| `fileIcons.specialNames` | `true` | 알려진 파일 이름의 전용 아이콘 |
| `fileAges.enabled` | `true` | 마스터 스위치; 나열된 파일에 blame 스타일 나이 색상 적용 |
| `fileAges.folders` | `true` | 폴더 행에도 색상 적용 |
| `fileMeta.enabled` | `true` | 파일 크기와 다운로드 버튼의 총 스위치 |
| `fileMeta.sizes` | `true` | 저장소 파일 목록에 각 파일의 크기 표시 |
| `fileMeta.download` | `true` | 저장소 파일 목록의 다운로드 버튼 |
| `fileMenu.enabled` | `true` | 파일 및 폴더 컨텍스트 메뉴 마스터 스위치 |
| `filePreview.enabled` | `true` | 파일 빠른 미리보기 마스터 스위치 |
| `filePreview.rowButton` | `true` | 파일 목록 행의 눈 버튼(컨텍스트 메뉴에서는 항상 **미리보기** 제공) |
| `filePreview.longPress` | `true` | 파일 이름이나 Markdown 파일 링크를 마우스 왼쪽 버튼으로 길게 눌러 미리보기 열기 |
| `filePreview.longPressMs` | `450` | 미리보기가 열릴 때까지 길게 누르는 시간(밀리초, 200–2000) |
| `filePreview.longPressRing` | `true` | 누르는 동안 포인터 위치에 표시되는 진행 원 |
| `folderTree.enabled` | `true` | 저장소 목록에서 폴더 행 펼치기의 마스터 스위치 |
| `commitBadges.enabled` | `true` | Conventional Commits 배지의 기본 스위치 |
| `commitBadges.unknownTypes` | `true` | 관례적인 집합 밖의 소문자 유형도 꾸미기 |
| `commitBadges.breaking` | `true` | `!` 가 붙은 호환되지 않는 변경 접두사에 빨간 표시 |
| `translate.enabled` | `true` | 페이지 번역 마스터 스위치 |
| `translate.provider` | `'google'` | `google`(무료), `deepl`, `microsoft`, `yandex`, `openai`, `libretranslate` |
| `translate.providerConfig.<id>` | 제공업체별 | 제공업체별 자격 증명과 엔드포인트(API 키, 지역, 폴더, 모델, URL) |
| `translate.targetLang` | `'auto'` | `'auto'`는 설정 언어를 따르며, 그 외에는 제공되는 언어 코드 |
| `translate.mode` | `'button'` | `button`은 클릭 시 번역, `auto`는 블록이 화면에 들어올 때 번역 |
| `translate.display` | `'replace'` | `replace`는 원문을 바꾸고, `below`는 원문 아래에 번역을 표시 |
| `translate.reveal` | `'button'` | 교체 모드: `button`은 **원문 표시**, `hover`는 호버나 포커스로 원문 표시 |
| `translate.linkLabels` | `true` | 링크 텍스트도 번역 |
| `translate.surfaces.<id>` | `true` | 위치별 스위치: `markdown`, `plaintext`, `commits`, `titles`, `preview` |
| `translate.cacheHours` | `24` | 캐시 유지 시간(시간, 0이면 끔) |
| `commandPalette.enabled` | `true` | `Ctrl/⌘+K` 명령 팔레트 마스터 스위치 |
| `commandPalette.shortcut` | `'mod+k'` | `mod+k`, `mod+shift+k`, `mod+space`, `alt+k`, `off` 또는 설정 페이지에서 기록한 조합 |
| `commandPalette.token` | `''` | 비공개 저장소와 높은 한도를 위한 선택적 GitHub 토큰(`api.github.com`으로만 전송, 내보내지 않음) |
| `commandPalette.sources.<id>` | `true` | 소스 스위치: `commands`, `repositories`, `starred`, `files`, `issues`, `recent` |
| `commandPalette.sources.issues` | `true` | 현재 저장소의 열린 issue와 pull request |
| `commandPalette.hideForks` | `false` | 저장소의 포크 숨기기 |
| `commandPalette.hideArchived` | `false` | 보관된 저장소 숨기기 |
| `commandPalette.cacheHours` | `6` | 저장소 및 파일 트리 캐시 유지 시간(시간, 0이면 끔) |
| `commandPalette.maxResults` | `30` | 결과 집합당 최대 행 수(10–100) |
| `similarRepos.enabled` | `true` | **유사한 리포지토리** 사이드바 패널 마스터 스위치 |
| `similarRepos.provider` | `'github'` | 데이터 소스: `github`(자체 검색) 또는 `simrepo`(타사) |
| `similarRepos.results` | `5` | 페이지당 결과 수(3–20) |
| `similarRepos.cacheHours` | `24` | 캐시 기간(시간, 0이면 비활성) |

## 갤러리 구조

갤러리는 작은 프레임워크와 이미지가 있는 위치마다 하나의 소스로 구성되므로 새 위치를
추가해도 갤러리 자체는 건드리지 않습니다:

| 파일 | 역할 |
|------|------|
| `src/ui/viewer.js` | 라이트박스: `openViewer({ images, index, loop, thumbnails, download, minZoom, maxZoom, resolveImage, labels, onClose })`, `closeViewer()` / `isViewerOpen()`. 독립적이어서 어떤 기능에서든 재사용할 수 있습니다. |
| `src/gallery/sources.js` | 소스 레지스트리: `registerSource`, `listSources`. |
| `src/gallery/collect.js` | 수집: 정규화, 필터링(배지/이모지/작은 아이콘), 중복 제거, 상한. |
| `src/gallery/index.js` | 연결: 캡처 단계 클릭 리스너 하나, 생성된 커서 스타일시트, 다운로드 버튼용 위임 호버 리스너, 설정 리스너. |
| `src/gallery/sources/markdown.js` | Markdown 소스: 컨테이너, 이미지 조회, 원본 크기 해석. |

어포던스는 레지스트리에서 생성된 CSS이고 클릭 처리는 살아 있는 DOM을 순회하는 단일
위임 리스너이므로, 갤러리는 스캔 루프나 이미지별 상태 관리 없이 GitHub의 클라이언트
측 탐색과 React 재렌더링 후에도 계속 동작합니다.

### 소스 추가

```js
import { registerSource } from '../sources.js';

registerSource({
  id: 'mySurface',            // also the settings switch key (gallery.sources.mySurface)
  labelKey: 'source.mySurface',
  hintKey: 'source.mySurfaceDesc',
  containerSelector: '.my-surface',   // one container = one gallery set
  cursorSelector: '.my-surface img',  // gets cursor: zoom-in while enabled
  collect(container) {
    // return [{ node, src, alt?, title?, href? }]
  },
  resolveFull(item) {
    // return the best full-size URL for item, or '' when unknown
  },
});
```

그다음 네 곳을 함께 수정합니다: 소스 모듈과 그 import,
`src/core/constants.js`의 `DEFAULT_GALLERY.sources.<id>`, 그리고 **열 개 모두의**
`src/i18n/locales/*.js`에 있는 `source.<id>` / `source.<id>Desc` 키입니다. 설정
패널은 레지스트리에서 새 소스를 자동으로 가져옵니다.

## 개발

Node.js 22가 필요합니다(`.nvmrc` 참고).

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate)
npm run icons:build        # regenerate the embedded icon subset
npm test                   # Node test runner (unit tests)
```

`src/` 아래 파일만 편집하세요 — `github-plus.user.js`와 `github-plus.meta.js`는
생성물입니다. 테스트와 디버깅은 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md), 규칙은
[CONTRIBUTING.md](CONTRIBUTING.md), 모듈 지도와 데이터 흐름은
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), 보이는 요소를 건드리기 전에는
[DESIGN.md](DESIGN.md)를 참고하세요.

## 라이선스

[MIT](LICENSE).

포함된 파일 아이콘은 Material Icon Theme(MIT)에서 가져왔습니다.
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES)를 참고하세요.

GitHub, Inc.와 무관한 독립 프로젝트입니다.
