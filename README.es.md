# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · **Español** · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.8.0-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

Un userscript que mejora GitHub con un panel de ajustes completo, una galería
de imágenes para el markdown renderizado y iconos de archivo en color allí
donde GitHub lista archivos.

> **Estado:** temprano (`0.8.0`). Panel de ajustes con búsqueda instantánea
> (General · Galería · Iconos de archivo · Copia de seguridad · Acerca de), la
> galería de imágenes de markdown y los iconos de archivo en color. Hay más
> mejoras de GitHub planificadas.

> Las directivas `@updateURL` / `@downloadURL` del script apuntan a `main` en
> GitHub: la URL de instalación de abajo siempre lleva a la compilación más
> reciente.

## Instalación rápida

1. Instala un gestor de userscripts ([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/) o
   [ScriptCat](https://scriptcat.org/) recomendado).
2. Instala el script desde GitHub (URL raw abajo).

**URL de instalación (GitHub — la más reciente):**

```
https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)

### Instalación desde URL (panel)

| Gestor | Ruta |
|---------|------|
| Tampermonkey | Panel → **Utilities** → **Install from URL** |
| Violentmonkey | Panel → **+** → **Install from URL** |
| Greasemonkey | Menú del complemento → **New User Script** → pega la URL raw |
| ScriptCat | Instala la [extensión](https://scriptcat.org/), luego **Install from URL** con la URL raw de GitHub |

### Instalación manual

1. Abre el archivo [`github-plus.user.js`](https://github.com/NemoKing1210/github-plus/blob/main/github-plus.user.js) compilado en este repositorio (o ejecuta `npm run build` tras clonarlo).
2. Copia todo el contenido del archivo.
3. En tu gestor de userscripts, crea un script nuevo y pega el código.
4. Guarda y activa el script.

## Actualizaciones

El script incluye las directivas `@updateURL` y `@downloadURL` que apuntan al
archivo raw en GitHub, así que los gestores compatibles lo actualizan
automáticamente.

Pasos de publicación para mantenedores: consulta
[docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing).

## Funciones

### Galería de imágenes para markdown

Cada contenedor de markdown renderizado en GitHub es un conjunto de la galería:

- **Haz clic en cualquier imagen** — en el README de un repositorio, en la vista
  de un archivo `.md`, en una página de wiki, en un issue, pull request o
  comentario de revisión (en cualquier lugar donde GitHub renderice
  `.markdown-body`) — y se abre a pantalla completa en el visor integrado.
- **Recorre todo el conjunto** — `←`/`→` (o las flechas) pasan a las demás
  imágenes del mismo contenedor, la tira de miniaturas centrada salta a
  cualquiera y el contador indica dónde estás.
- **Zoom y desplazamiento** — la rueda, `+`/`−`, el doble clic y el pinch
  amplían hasta el límite configurado; arrastra para mover la imagen con
  cualquier zoom; `0` restablece y `r` gira; las imágenes vecinas se precargan
  para que la navegación sea instantánea.
- **Tamaño completo a demanda** — cuando una imagen enlaza a un archivo mayor (un
  archivo del repositorio tras una página `/blob/`, un adjunto subido, cualquier
  URL de imagen), ese archivo se prueba y se sustituye, de modo que obtienes la
  resolución original sin dejar una imagen rota si no está disponible.
- **Descarga lo que ves** — al pasar el cursor sobre una imagen de Markdown
  aparece un botón de descarga, y el visor tiene el suyo; el archivo se guarda
  con su propio nombre (una dirección de proxy se desenvuelve hasta el nombre
  original), y un ajuste oculta ambos botones.
- **Discreto por defecto** — las insignias, los fragmentos de estado, los emojis
  y los iconos diminutos nunca ocupan un lugar en la galería; las imágenes
  mantienen el aspecto propio de GitHub (solo el cursor indica que abren la
  galería), y los clics con modificadores (Ctrl/Cmd/Shift/Alt) y con el botón
  central se dejan a GitHub, así que abrir un archivo en una pestaña nueva
  funciona igual que antes.
- **Adaptado al tema** — la galería y el panel de ajustes usan las variables de
  color de GitHub, así que ambos siguen el tema elegido (claro, oscuro,
  atenuado).

### Iconos de archivo

GitHub dibuja cada archivo y carpeta con el mismo glifo gris, así que `.ts` y
`.css` se ven iguales hasta que lees el nombre. GitHub Plus les da color:

- **Tipo por extensión** — lenguajes, formatos de configuración y datos, imágenes,
  medios, archivos comprimidos y documentos reciben su propio icono; las
  extensiones compuestas como `.d.ts` y `.spec.ts` se comprueban antes que la
  extensión base.
- **Nombres conocidos** — `Dockerfile`, `package.json`, `README`, `.gitignore`,
  `tsconfig.json` y similares reciben un icono propio.
- **Rol de las carpetas** — `src`, `dist`, `node_modules`, `docs`, `.github`,
  `components`, `utils` y otras carpetas comunes también se marcan.
- **Dondequiera que GitHub liste archivos** — el árbol del repositorio y sus
  subcarpetas, la cabecera del blob, las cabeceras de archivos en pull requests y
  el árbol del diff, las listas de archivos de commits, la búsqueda de código,
  los gists y los assets de releases.
- **Discreto** — el glifo nativo de GitHub se oculta y se sustituye en su sitio;
  sin cambios de maquetación, sin bordes extra, y al desactivar la función GitHub
  vuelve a como estaba.

Los iconos son un subconjunto curado de
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
(MIT); la atribución está en [THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

### Panel de ajustes

Ábrelo con el botón de engranaje de la cabecera de GitHub, con la fila
**Ajustes de GitHub Plus** del menú del avatar (justo debajo de **Settings** de
GitHub) o con el comando de menú del gestor de userscripts. Los cambios son un
borrador: nada se guarda hasta que pulses **Guardar**; **Cancelar**, el clic en
el fondo y `Escape` descartan el borrador; **Restablecer valores predeterminados**
pide confirmación primero.

## Ajustes

Se guardan en `gp_settings_v1`.

| Clave | Valor predeterminado | Notas |
|-----|---------|------|
| `language` | `'auto'` | Idioma de la interfaz del panel de ajustes (`'auto'` sigue al navegador) |
| `gallery.enabled` | `true` | Interruptor principal de la galería de imágenes de markdown |
| `gallery.sources.markdown` | `true` | Interruptor por fuente (una entrada por fuente registrada) |
| `gallery.skipBadges` | `true` | Omite los servicios de insignias (incluidas las ocultas tras el proxy camo de GitHub y las insignias de estado de Actions), los emojis, las imágenes de ≤ 40 px de alto y las menores de 80 px en ambos ejes |
| `gallery.upgradeFullSize` | `true` | Prueba y carga el original enlazado a tamaño completo |
| `gallery.download` | `true` | Botón de descarga en el visor y al pasar el cursor sobre imágenes de Markdown |
| `gallery.thumbnails` | `true` | Tira de miniaturas en el visor |
| `gallery.loop` | `true` | Pasa de la última imagen a la primera |
| `gallery.maxZoom` | `8` | Límite de zoom (2× … 16×) |
| `toasts.enabled` | `true` | Notificaciones toast |
| `toasts.position` | `'bottom-right'` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `toasts.duration` | `5000` | Retardo de ocultación en ms (`0` mantiene el toast hasta cerrarlo) |
| `fileIcons.enabled` | `true` | Interruptor principal de los iconos de archivo y carpeta |
| `fileIcons.folders` | `true` | Iconos específicos para nombres de carpeta comunes |
| `fileIcons.specialNames` | `true` | Iconos propios para nombres de archivo conocidos |

## Cómo está construida la galería

La galería es un pequeño framework más una fuente por cada lugar donde viven
imágenes, así que añadir un lugar nuevo nunca toca la galería:

| Archivo | Rol |
|------|------|
| `src/ui/viewer.js` | La caja de luz: `openViewer({ images, index, loop, thumbnails, download, minZoom, maxZoom, resolveImage, labels, onClose })`, además de `closeViewer()` / `isViewerOpen()`. Autónoma: cualquier función puede reutilizarla. |
| `src/gallery/sources.js` | Registro de fuentes: `registerSource`, `listSources`. |
| `src/gallery/collect.js` | Recolección: normalización, filtrado (insignias/emojis/iconos pequeños), deduplicación y límite. |
| `src/gallery/index.js` | Cableado: un listener de clics en fase de captura, la hoja de estilos del cursor generada, listeners de hover delegados para el botón de descarga y el listener de ajustes. |
| `src/gallery/sources/markdown.js` | La fuente markdown: contenedores, búsqueda de imágenes y resolución del tamaño completo. |

Como la señal visual es CSS construido desde el registro y el manejo de clics es
un único listener delegado que recorre el DOM vivo, la galería sigue funcionando
tras la navegación cliente de GitHub y los re-renderizados de React sin un bucle
de escaneo ni contabilidad por imagen.

### Añadir una fuente

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

Después añade los interruptores en cuatro lugares a la vez: el módulo de la
fuente y su import, `DEFAULT_GALLERY.sources.<id>` en `src/core/constants.js` y
las claves `source.<id>` / `source.<id>Desc` en **los diez** archivos
`src/i18n/locales/*.js`. El panel de ajustes recoge la nueva fuente del registro
automáticamente.

## Desarrollo

Requiere Node.js 22 (ver `.nvmrc`).

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate)
npm run icons:build        # regenerate the embedded icon subset
npm test                   # Node test runner (unit tests)
```

Edita solo archivos bajo `src/`; `github-plus.user.js` y
`github-plus.meta.js` se generan. Consulta [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
para pruebas y depuración, [CONTRIBUTING.md](CONTRIBUTING.md) para las reglas,
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el mapa de módulos y flujos de
datos, y [DESIGN.md](DESIGN.md) antes de tocar cualquier elemento visible.

## Licencia

[MIT](LICENSE).

Los iconos de archivo incluidos proceden de Material Icon Theme (MIT); consulta
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

Un proyecto independiente, no afiliado a GitHub, Inc.
