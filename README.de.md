# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · **Deutsch** · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.8.0-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

Ein Userscript, das GitHub verbessert: ein vollständiges Einstellungsfenster,
eine Bildergalerie für gerendertes Markdown und farbige Dateisymbole überall
dort, wo GitHub Dateien auflistet.

> **Status:** früh (`0.8.0`). Einstellungsfenster mit Sofortsuche (Allgemein ·
> Galerie · Dateisymbole · Sicherung · Info), die Markdown-Bildergalerie und
> farbige Dateisymbole. Weitere GitHub-Verbesserungen sind geplant.

> Die `@updateURL` / `@downloadURL` des Skripts zeigen auf `main` bei GitHub —
> die Installations-URL unten führt immer zur neuesten Version.

## Schnellinstallation

1. Installiere einen Userscript-Manager ([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/) oder
   [ScriptCat](https://scriptcat.org/) empfohlen).
2. Installiere das Skript von GitHub (Raw-URL unten).

**Installations-URL (GitHub — neueste):**

```
https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)

### Installation per URL (Dashboard)

| Manager | Pfad |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| Greasemonkey | Add-on-Menü → **New User Script** → Raw-URL einfügen |
| ScriptCat | Installiere die [Erweiterung](https://scriptcat.org/), dann **Install from URL** mit der GitHub-Raw-URL |

### Manuelle Installation

1. Öffne die gebaute [`github-plus.user.js`](https://github.com/NemoKing1210/github-plus/blob/main/github-plus.user.js) in diesem Repository (oder führe nach dem Klonen `npm run build` aus).
2. Kopiere den gesamten Inhalt der Datei.
3. Erstelle im Userscript-Manager ein neues Skript und füge den Code ein.
4. Speichere und aktiviere das Skript.

## Updates

Das Skript enthält die Metadaten `@updateURL` und `@downloadURL`, die auf die
Raw-Datei bei GitHub zeigen, sodass unterstützte Manager es automatisch
aktualisieren.

Release-Schritte für Maintainer: siehe
[docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing).

## Funktionen

### Bildergalerie für Markdown

Jeder gerenderte Markdown-Container auf GitHub ist ein Galerie-Set:

- **Klick auf ein beliebiges Bild** — in einer Repository-README, in der
  Ansicht einer `.md`-Datei, auf einer Wiki-Seite, in einem Issue, Pull Request
  oder Review-Kommentar (überall, wo GitHub `.markdown-body` rendert) — öffnet
  es bildschirmfüllend im integrierten Viewer.
- **Das ganze Set durchblättern** — `←`/`→` (oder die Pfeile) wechseln zu den
  anderen Bildern desselben Containers, eine zentrierte Miniaturleiste springt
  an jede Stelle, und der Zähler zeigt die aktuelle Position.
- **Zoomen und Verschieben** — Mausrad, `+`/`−`, Doppelklick und Pinch zoomen
  bis zur eingestellten Obergrenze; Ziehen verschiebt das Bild bei jedem Zoom;
  `0` setzt zurück, `r` dreht; die Nachbarbilder werden vorgeladen, damit das
  Blättern sofort wirkt.
- **Volle Größe auf Wunsch** — verlinkt ein Bild auf eine größere Datei (eine
  Repository-Datei hinter einer `/blob/`-Seite, ein hochgeladener Anhang, eine
  beliebige Bild-URL), wird diese Datei geprüft und eingesetzt. Du bekommst die
  Originalauflösung, ohne ein kaputtes Bild zu riskieren, falls sie nicht
  verfügbar ist.
- **Herunterladen, was du siehst** — beim Überfahren eines Markdown-Bildes
  erscheint eine Download-Schaltfläche, und im Viewer gibt es eine eigene; die
  Datei wird unter ihrem eigenen Namen gespeichert (eine Proxy-Adresse wird zum
  ursprünglichen Dateinamen entpackt), und eine Einstellung blendet beide aus.
- **Standardmäßig unaufdringlich** — Badges, Status-Snippets, Emojis und winzige
  Symbole belegen nie einen Galerieplatz; Bilder behalten den Look von GitHub
  (nur der Cursor deutet an, dass sie die Galerie öffnen), und Klicks mit
  Modifikatoren (Ctrl/Cmd/Shift/Alt) sowie Mittelklicks bleiben bei GitHub —
  eine Datei öffnet sich also weiterhin in einem neuen Tab.
- **Theme-kompatibel** — Galerie und Einstellungsfenster nutzen die
  Farbvariablen von GitHub und folgen damit dem gewählten Theme (hell, dunkel,
  gedimmt).

### Dateisymbole

GitHub zeichnet jede Datei und jeden Ordner mit demselben grauen Symbol, sodass
`.ts` und `.css` gleich aussehen, bis man den Namen liest. GitHub Plus färbt sie
ein:

- **Typ nach Endung** — Sprachen, Konfigurations- und Datenformate, Bilder,
  Medien, Archive und Dokumente bekommen ein eigenes Symbol; zusammengesetzte
  Endungen wie `.d.ts` und `.spec.ts` werden vor der Basisendung geprüft.
- **Bekannte Dateinamen** — `Dockerfile`, `package.json`, `README`,
  `.gitignore`, `tsconfig.json` und Verwandte bekommen ein eigenes Symbol.
- **Ordnerrollen** — `src`, `dist`, `node_modules`, `docs`, `.github`,
  `components`, `utils` und andere gängige Ordner werden ebenfalls markiert.
- **Überall, wo GitHub Dateien auflistet** — Repository-Baum und Unterordner,
  Blob-Kopfzeile, Dateiköpfe in Pull Requests und der Diff-Baum, Dateilisten von
  Commits, Codesuche, Gists und Release-Assets.
- **Unaufdringlich** — das native GitHub-Symbol wird ausgeblendet und an Ort und
  Stelle ersetzt; keine Layoutänderungen, keine zusätzlichen Rahmen, und beim
  Deaktivieren sieht GitHub wieder aus wie zuvor.

Die Symbole sind eine kuratierte Teilmenge von
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
(MIT); die Attribution steht in [THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

### Einstellungsfenster

Öffne es über die Zahnrad-Schaltfläche in der GitHub-Kopfzeile, über die Zeile
**GitHub Plus-Einstellungen** im Avatar-Menü (direkt unter GitHubs eigenem
Eintrag **Settings**) oder über den Menübefehl des Userscript-Managers.
Änderungen sind Entwürfe: Nichts wird gespeichert, bis du **Speichern** drückst;
**Abbrechen**, der Klick auf den Hintergrund und `Escape` verwerfen den Entwurf;
**Auf Standard zurücksetzen** fragt vorher nach.

## Einstellungen

Gespeichert unter `gp_settings_v1`.

| Schlüssel | Standard | Hinweise |
|-----|---------|------|
| `language` | `'auto'` | Sprache der Benutzeroberfläche des Einstellungsfensters (`'auto'` folgt dem Browser) |
| `gallery.enabled` | `true` | Hauptschalter für die Markdown-Bildergalerie |
| `gallery.sources.markdown` | `true` | Schalter pro Quelle (ein Eintrag pro registrierter Quelle) |
| `gallery.skipBadges` | `true` | Badge-Dienste überspringen (auch Badges hinter GitHubs camo-Proxy und Actions-Status-Badges), Emojis, Bilder ≤ 40 px hoch und Bilder kleiner als 80 px in beiden Achsen |
| `gallery.upgradeFullSize` | `true` | Verlinktes Original in voller Größe prüfen und laden |
| `gallery.download` | `true` | Download-Schaltfläche im Viewer und bei überfahrenen Markdown-Bildern |
| `gallery.thumbnails` | `true` | Miniaturleiste im Viewer |
| `gallery.loop` | `true` | Vom letzten Bild zum ersten springen |
| `gallery.maxZoom` | `8` | Zoom-Obergrenze (2× … 16×) |
| `toasts.enabled` | `true` | Toast-Benachrichtigungen |
| `toasts.position` | `'bottom-right'` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `toasts.duration` | `5000` | Ausblendeverzögerung in ms (`0` lässt den Toast bis zum Schließen stehen) |
| `fileIcons.enabled` | `true` | Hauptschalter für Datei- und Ordnersymbole |
| `fileIcons.folders` | `true` | Ordnerspezifische Symbole für gängige Ordnernamen |
| `fileIcons.specialNames` | `true` | Eigene Symbole für bekannte Dateinamen |

## Wie die Galerie aufgebaut ist

Die Galerie ist ein kleines Framework plus eine Quelle pro Ort, an dem Bilder
vorkommen; ein neuer Ort berührt die Galerie selbst also nie:

| Datei | Rolle |
|------|------|
| `src/ui/viewer.js` | Die Lightbox: `openViewer({ images, index, loop, thumbnails, download, minZoom, maxZoom, resolveImage, labels, onClose })` sowie `closeViewer()` / `isViewerOpen()`. Eigenständig — von jedem Feature wiederverwendbar. |
| `src/gallery/sources.js` | Quellenregister: `registerSource`, `listSources`. |
| `src/gallery/collect.js` | Sammlung: Normalisierung, Filterung (Badges/Emojis/kleine Symbole), Deduplizierung, Begrenzung. |
| `src/gallery/index.js` | Verdrahtung: ein Klick-Listener in der Capture-Phase, das generierte Cursor-Stylesheet, delegierte Hover-Listener für die Download-Schaltfläche, Einstellungs-Listener. |
| `src/gallery/sources/markdown.js` | Die Markdown-Quelle: Container, Bildsuche, Auflösung der vollen Größe. |

Da die Affordanz CSS aus dem Register ist und die Klickbehandlung ein einziger
delegierter Listener auf dem lebenden DOM, funktioniert die Galerie über
clientseitige Navigation und React-Re-Renders hinweg — ohne Scan-Schleife und
ohne Buchführung pro Bild.

### Eine Quelle hinzufügen

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

Danach ergänzt du die Schalter an vier Stellen gemeinsam: das Quellmodul +
seinen Import, `DEFAULT_GALLERY.sources.<id>` in `src/core/constants.js` und die
Schlüssel `source.<id>` / `source.<id>Desc` in **allen zehn** Dateien
`src/i18n/locales/*.js`. Das Einstellungsfenster übernimmt die neue Quelle
automatisch aus dem Register.

## Entwicklung

Erfordert Node.js 22 (siehe `.nvmrc`).

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate)
npm run icons:build        # regenerate the embedded icon subset
npm test                   # Node test runner (unit tests)
```

Bearbeite nur Dateien unter `src/` — `github-plus.user.js` und
`github-plus.meta.js` sind generiert. Siehe [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
für Test und Debugging, [CONTRIBUTING.md](CONTRIBUTING.md) für die Regeln,
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) für die Modulkarte und Datenflüsse
und [DESIGN.md](DESIGN.md) vor jeder Änderung an sichtbaren Elementen.

## Lizenz

[MIT](LICENSE).

Die gebündelten Dateisymbole stammen aus Material Icon Theme (MIT); siehe
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

Ein unabhängiges Projekt, nicht mit GitHub, Inc. verbunden.
