# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · **한국어** · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.20.7-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

GitHub를 개선하는 사용자 스크립트입니다. 완전한 설정 패널, 렌더링된 Markdown용
이미지 갤러리, GitHub가 파일을 나열하는 모든 곳의 컬러 파일 아이콘, 그 파일들의
blame 스타일 나이 색상, 파일 크기와 원클릭 다운로드, 파일 작업용 컨텍스트 메뉴,
모든 파일의 빠른 미리보기, 페이지 번역을 제공합니다.

> **상태:** 초기(`0.20.7`). 즉시 검색이 있는 설정 패널(일반 · 갤러리 · 파일 · 번역 · 백업 ·
> 정보), Markdown 이미지 갤러리, 컬러 파일 아이콘, blame 스타일 나이 색상, 다운로드
> 버튼이 있는 파일 크기, 파일 컨텍스트 메뉴, 파일 빠른 미리보기, 페이지 번역. 더 많은 GitHub
> 개선이 예정되어 있습니다.

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

### 파일 컨텍스트 메뉴

파일을 마우스 오른쪽 버튼으로 클릭하는 것은 원하는 작업으로 가는 가장 빠른 길이지만,
GitHub 자체 메뉴에는 그런 작업이 없습니다. GitHub Plus는 파일에 대해 그 메뉴를
대체합니다:

- **빠른 작업** — 저장소 목록, 파일 트리 사이드바 또는 렌더링된 Markdown의 파일
  링크에서 파일을 마우스 오른쪽 버튼으로 클릭하면
  **열기**, **새 탭에서 열기**, **다운로드**, **내용 복사**,
  **링크 복사**, **경로 복사**를 사용할 수 있습니다. 파일 페이지나 blame 페이지에서도
  같은 메뉴가 나타납니다(**열기**는 이미 그 페이지에 있으므로 없습니다).
- **내용 복사** — 텍스트 파일의 내용은 페이지를 열지 않고 바로 클립보드로 들어갑니다.
  바이너리 파일과 1 MiB를 넘는 파일은 깨진 문자가 붙거나 탭이 멈추는 대신 명확한
  알림과 함께 거부됩니다.
- **경로 복사** — 저장소 기준 상대 경로(`src/main.js`)로, 터미널·import 문·링크에
  바로 붙여 넣을 수 있습니다.
- **도움이 되는 곳에서만** — 폴더, 이미지, 미디어, 저장소 파일을 가리키지 않는
  Markdown 링크를 포함한 일반 링크에는 기본 메뉴가 그대로 유지됩니다.
  파일을 가리키지 않는 오른쪽 클릭은 이전과 똑같이 동작합니다.
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

### 설정 패널

GitHub 헤더의 톱니바퀴 버튼, 아바타 메뉴의 **GitHub Plus 설정** 행(GitHub 자체
**Settings** 바로 아래), 또는 사용자 스크립트 관리자의 메뉴 명령으로 엽니다. 변경
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
| `fileMenu.enabled` | `true` | 파일 컨텍스트 메뉴 마스터 스위치 |
| `filePreview.enabled` | `true` | 파일 빠른 미리보기 마스터 스위치 |
| `filePreview.rowButton` | `true` | 파일 목록 행의 눈 버튼(컨텍스트 메뉴에서는 항상 **미리보기** 제공) |
| `filePreview.longPress` | `true` | 파일 이름이나 Markdown 파일 링크를 마우스 왼쪽 버튼으로 길게 눌러 미리보기 열기 |
| `filePreview.longPressMs` | `450` | 미리보기가 열릴 때까지 길게 누르는 시간(밀리초, 200–2000) |
| `filePreview.longPressRing` | `true` | 누르는 동안 포인터 위치에 표시되는 진행 원 |
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
