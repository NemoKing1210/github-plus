# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Polski**

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.8.0-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

Userskrypt ulepszający GitHub: pełny panel ustawień, galeria obrazów dla
renderowanego Markdownu i kolorowe ikony plików wszędzie tam, gdzie GitHub
wyświetla pliki.

> **Status:** wczesny etap (`0.8.0`). Panel ustawień z natychmiastowym
> wyszukiwaniem (Ogólne · Galeria · Ikony plików · Kopia zapasowa · Informacje),
> galeria obrazów Markdownu i kolorowe ikony plików. W planach kolejne ulepszenia
> GitHuba.

> Dyrektywy `@updateURL` / `@downloadURL` skryptu wskazują na `main` w GitHubie —
> link instalacyjny poniżej zawsze prowadzi do najnowszej kompilacji.

## Szybka instalacja

1. Zainstaluj menedżer userskryptów ([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/) lub
   [ScriptCat](https://scriptcat.org/) — zalecane).
2. Zainstaluj skrypt z GitHuba (surowy link poniżej).

**Link instalacyjny (GitHub — najnowszy):**

```
https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)

### Instalacja z adresu URL (panel)

| Menedżer | Ścieżka |
|---------|------|
| Tampermonkey | Panel → **Utilities** → **Install from URL** |
| Violentmonkey | Panel → **+** → **Install from URL** |
| Greasemonkey | Menu dodatku → **New User Script** → wklej surowy URL |
| ScriptCat | Zainstaluj [rozszerzenie](https://scriptcat.org/), następnie **Install from URL** z surowym adresem GitHuba |

### Instalacja ręczna

1. Otwórz zbudowany plik [`github-plus.user.js`](https://github.com/NemoKing1210/github-plus/blob/main/github-plus.user.js) w tym repozytorium (lub uruchom `npm run build` po sklonowaniu).
2. Skopiuj całą zawartość pliku.
3. W menedżerze userskryptów utwórz nowy skrypt i wklej kod.
4. Zapisz i włącz skrypt.

## Aktualizacje

Skrypt zawiera metadane `@updateURL` i `@downloadURL` wskazujące na surowy plik w
GitHubie, więc obsługiwane menedżery aktualizują go automatycznie.

Kroki wydania dla opiekunów: zobacz
[docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing).

## Funkcje

### Galeria obrazów dla Markdownu

Każdy renderowany kontener Markdownu w GitHubie to jeden zestaw galerii:

- **Kliknij dowolny obraz** — w README repozytorium, podglądzie pliku `.md`, stronie
  wiki, zgłoszeniu, pull requeście, komentarzu recenzji (wszędzie, gdzie GitHub
  renderuje `.markdown-body`) — otworzy się pełnoekranowo w wbudowanej
  przeglądarce.
- **Przeglądaj cały zestaw** — `←`/`→` (lub strzałki) przechodzą do pozostałych
  obrazów z tego samego kontenera, wyśrodkowany pasek miniatur pozwala przeskoczyć
  w dowolne miejsce, a licznik pokazuje pozycję.
- **Powiększanie i przesuwanie** — kółko myszy, `+`/`−`, podwójne kliknięcie i
  pinch powiększają do skonfigurowanego limitu; przeciąganie przesuwa obraz przy
  każdym powiększeniu; `0` resetuje, `r` obraca; sąsiednie obrazy są wstępnie
  ładowane, więc przeglądanie jest natychmiastowe.
- **Pełny rozmiar na żądanie** — gdy obraz linkuje do większego pliku (plik
  repozytorium za stroną `/blob/`, przesłany załącznik, dowolny URL obrazu), plik
  jest sprawdzany i podstawiany, więc otrzymujesz oryginalną rozdzielczość, a gdy
  jest niedostępny, obraz się nie psuje.
- **Pobierz to, co widzisz** — po najechaniu na obraz w Markdown pojawia się
  przycisk pobierania, a przeglądarka ma własny; plik jest zapisywany pod swoją
  nazwą (adres proxy jest rozwijany do oryginalnej nazwy pliku), a jedno
  ustawienie ukrywa oba przyciski.
- **Dyskretne domyślnie** — odznaki, fragmenty statusu, emoji i maleńkie ikony
  nigdy nie zajmują miejsca w galerii; obrazy zachowują wygląd GitHuba (tylko
  kursor podpowiada, że otwierają galerię), a kliknięcia z modyfikatorami
  (Ctrl/Cmd/Shift/Alt) i środkowym przyciskiem pozostają dla GitHuba, więc
  otwieranie pliku w nowej karcie działa jak wcześniej.
- **Zgodne z motywem** — galeria i panel ustawień używają zmiennych kolorów
  GitHuba, więc oba podążają za wybranym motywem (jasny, ciemny, przygaszony).

### Ikony plików

GitHub rysuje każdy plik i folder tym samym szarym glifem, więc `.ts` i `.css`
wyglądają identycznie, dopóki nie przeczytasz nazwy. GitHub Plus je koloruje:

- **Typ według rozszerzenia** — języki, formaty konfiguracji i danych, obrazy,
  multimedia, archiwa i dokumenty dostają własną ikonę; złożone rozszerzenia,
  takie jak `.d.ts` i `.spec.ts`, są sprawdzane przed rozszerzeniem bazowym.
- **Znane nazwy plików** — `Dockerfile`, `package.json`, `README`, `.gitignore`,
  `tsconfig.json` i podobne dostają dedykowaną ikonę.
- **Role folderów** — `src`, `dist`, `node_modules`, `docs`, `.github`,
  `components`, `utils` i inne popularne foldery również są oznaczane.
- **Wszędzie, gdzie GitHub wyświetla pliki** — drzewo repozytorium i podfoldery,
  nagłówek blob, nagłówki plików w pull requestach i drzewo diffu, listy plików
  commitów, wyszukiwanie kodu, gisty i zasoby wydań.
- **Dyskretnie** — natywny glif GitHuba jest ukrywany i zastępowany w miejscu; bez
  zmian układu, bez dodatkowych obramowań, a wyłączenie funkcji przywraca GitHuba
  do stanu wyjściowego.

Ikony to wyselekcjonowany podzbiór
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
(MIT); informacja o autorstwie znajduje się w
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

### Panel ustawień

Otwórz go przyciskiem zębatki w nagłówku GitHuba, wierszem **Ustawienia GitHub Plus**
w menu awatara (tuż pod własnym **Settings** GitHuba) lub poleceniem menu menedżera
userskryptów. Zmiany są wersją roboczą: nic nie zostaje zapisane, dopóki nie
klikniesz **Zapisz**; **Anuluj**, kliknięcie w tło i `Escape` odrzucają wersję
roboczą; **Przywróć domyślne** najpierw prosi o potwierdzenie.

## Ustawienia

Przechowywane pod `gp_settings_v1`.

| Klucz | Domyślnie | Uwagi |
|-----|---------|------|
| `language` | `'auto'` | Język interfejsu panelu ustawień (`'auto'` podąża za przeglądarką) |
| `gallery.enabled` | `true` | Główny przełącznik galerii obrazów Markdownu |
| `gallery.sources.markdown` | `true` | Przełącznik dla źródła (jeden wpis na zarejestrowane źródło) |
| `gallery.skipBadges` | `true` | Pomija serwisy odznak (w tym odznaki za proxy camo GitHuba i odznaki statusu Actions), emoji, obrazy o wysokości ≤ 40 px i obrazy mniejsze niż 80 px w obu osiach |
| `gallery.upgradeFullSize` | `true` | Sprawdza i wczytuje powiązany oryginał w pełnym rozmiarze |
| `gallery.download` | `true` | Przycisk pobierania w przeglądarce i po najechaniu na obrazy Markdown |
| `gallery.thumbnails` | `true` | Pasek miniatur w przeglądarce |
| `gallery.loop` | `true` | Przejście z ostatniego obrazu do pierwszego |
| `gallery.maxZoom` | `8` | Limit powiększenia (2× … 16×) |
| `toasts.enabled` | `true` | Powiadomienia toast |
| `toasts.position` | `'bottom-right'` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `toasts.duration` | `5000` | Opóźnienie automatycznego ukrycia w ms (`0` oznacza toast do zamknięcia) |
| `fileIcons.enabled` | `true` | Główny przełącznik ikon plików i folderów |
| `fileIcons.folders` | `true` | Ikony dla popularnych nazw folderów |
| `fileIcons.specialNames` | `true` | Dedykowane ikony dla znanych nazw plików |

## Jak zbudowana jest galeria

Galeria to mały framework plus jedno źródło dla każdego miejsca, w którym są
obrazy, więc dodanie nowego miejsca nigdy nie dotyka samej galerii:

| Plik | Rola |
|------|------|
| `src/ui/viewer.js` | Lightbox: `openViewer({ images, index, loop, thumbnails, download, minZoom, maxZoom, resolveImage, labels, onClose })` oraz `closeViewer()` / `isViewerOpen()`. Samodzielny — może go użyć dowolna funkcja. |
| `src/gallery/sources.js` | Rejestr źródeł: `registerSource`, `listSources`. |
| `src/gallery/collect.js` | Zbieranie: normalizacja, filtrowanie (odznaki/emoji/małe ikony), deduplikacja, limit. |
| `src/gallery/index.js` | Połączenia: jeden nasłuch kliknięć w fazie przechwytywania, wygenerowany arkusz stylów kursora, delegowane nasłuchy najechania dla przycisku pobierania, nasłuch ustawień. |
| `src/gallery/sources/markdown.js` | Źródło Markdownu: kontenery, wyszukiwanie obrazów, ustalanie pełnego rozmiaru. |

Ponieważ wskazówka to CSS zbudowany z rejestru, a obsługa kliknięć to jeden
delegowany nasłuch przechodzący po żywym DOM, galeria działa po nawigacji po
stronie klienta GitHuba i ponownych renderach Reacta — bez pętli skanowania i bez
stanu dla każdego obrazu.

### Dodawanie źródła

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

Następnie dodaj przełączniki w czterech miejscach naraz: moduł źródła i jego
import, `DEFAULT_GALLERY.sources.<id>` w `src/core/constants.js` oraz klucze
`source.<id>` / `source.<id>Desc` we **wszystkich dziesięciu** plikach
`src/i18n/locales/*.js`. Panel ustawień automatycznie pobiera nowe źródło z
rejestru.

## Rozwój

Wymaga Node.js 22 (zobacz `.nvmrc`).

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate)
npm run icons:build        # regenerate the embedded icon subset
npm test                   # Node test runner (unit tests)
```

Edytuj tylko pliki w `src/` — `github-plus.user.js` i `github-plus.meta.js` są
generowane. Testy i debugowanie opisuje [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md),
zasady — [CONTRIBUTING.md](CONTRIBUTING.md), mapę modułów i przepływy danych —
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), a przed zmianą jakiegokolwiek
widocznego elementu przeczytaj [DESIGN.md](DESIGN.md).

## Licencja

[MIT](LICENSE).

Dołączone ikony plików pochodzą z Material Icon Theme (MIT); zobacz
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

Niezależny projekt, niepowiązany z GitHub, Inc.
