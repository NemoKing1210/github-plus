# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · **Español** · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.34.0-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

Un userscript que mejora GitHub con un panel de ajustes completo, una paleta de
comandos con `Ctrl/⌘+K`, una galería de imágenes para el markdown renderizado,
iconos de archivo en color allí donde GitHub lista archivos, colores de
antigüedad al estilo blame para esos archivos, carpetas expandibles en la lista
del repositorio, tamaños de archivo con descargas
en un clic, un menú contextual para acciones de archivo y carpeta, una vista
rápida de
cualquier archivo, insignias de Conventional Commits, traducción del contenido
de la página, un panel de repositorios similares en la barra lateral y avatares
de autores en las listas de issues y pull requests.

> **Estado:** temprano (`0.34.0`). Panel de ajustes con búsqueda instantánea
> (General · Galería · Archivos · Issues · Commits · Traducción · Paleta · Descubrir · Copia de
> seguridad · Acerca de), una paleta de comandos con `Ctrl/⌘+K`, la galería de
> imágenes de markdown, los iconos de archivo en color, los colores de
> antigüedad al estilo blame, las carpetas expandibles, los tamaños de archivo
> con botones de descarga, un
> menú contextual de archivos y carpetas, una vista rápida de archivos, insignias
> de commit, traducción de la página y avatares de autores en las listas de issues y
> pull requests. Hay más mejoras de GitHub planificadas.

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
  `.markdown-body`) o en el markdown renderizado de la vista rápida — y se abre
  a pantalla completa en el visor integrado.
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
  subcarpetas, la barra lateral del árbol de archivos en las páginas de código,
  la cabecera de archivo de las páginas blob, tree y blame, las cabeceras de
  archivos en pull requests y el árbol del diff, las listas de archivos de
  commits, la búsqueda de código, los gists y los assets de releases.
- **Discreto** — el glifo nativo de GitHub se oculta y se sustituye en su sitio;
  sin cambios de maquetación, sin bordes extra, y al desactivar la función GitHub
  vuelve a como estaba.

Los iconos son un subconjunto curado de
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
(MIT); la atribución está en [THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

### Antigüedad de archivos

GitHub ya muestra cuánto tiempo hace que cambió cada archivo, pero todas las
fechas se ven iguales de un vistazo. GitHub Plus toma la leyenda de blame y
colorea el propio texto de la fecha:

- **Un vistazo, una edad** — las fechas más recientes son cálidas (`#ffd78d` en
  el tema oscuro, el dorado de atención en el claro) y las antiguas se difuminan
  hacia el gris atenuado del tema, así que un archivo de hace cuatro meses ya se
  ve antiguo. La escala está deliberadamente cargada hacia el presente: días,
  semanas y meses siguen siendo distinguibles y todo lo que supera un año es
  gris liso. Los temas claros y oscuros tienen su propia gama, así que el color
  sigue siendo fuerte y legible en ambos.
- **Nada se mueve** — la fecha conserva el texto, la redacción relativa y la
  información emergente de GitHub; solo cambia su color, así que ninguna fila se
  redimensiona y la etiqueta accesible es exactamente la que GitHub renderizó.
- **Archivos y carpetas** — las filas de carpetas también se colorean (la fecha
  indica su último cambio) y un ajuste limita la función a los archivos.
- **Discreto** — al desactivar la función vuelve el color propio de GitHub y no
  queda ningún rastro.

### Carpetas expandibles

Una lista de repositorio muestra solo un nivel a la vez, así que seguir una ruta
supone una carga de página por carpeta. GitHub Plus convierte la lista en un
árbol:

- **Un clic para mirar dentro** — cada fila de carpeta empieza con un chevrón;
  el contenido de la carpeta aparece justo debajo como filas normales, con
  sangría de un paso por nivel, y el mismo chevrón las vuelve a plegar. Las
  carpetas anidadas se expanden igual, hasta cualquier profundidad.
- **El nombre de la carpeta sigue navegando** — solo el chevrón expande, así que
  un clic normal en el nombre abre la carpeta como antes; el chevrón es un botón
  real (`aria-expanded`, una etiqueta por carpeta) y se maneja con el teclado.
- **Todo lo demás sigue funcionando** — las filas anidadas tienen la forma de las
  filas de GitHub, así que los iconos de archivo, los colores de antigüedad
  estilo blame, los tamaños, los botones de descarga, la vista rápida (con
  anterior/siguiente dentro de la carpeta) y el menú contextual funcionan sin
  más.
- **Fechas y mensajes incluidos** — cada fila anidada muestra el mensaje del
  último commit y el color de antigüedad, leídos de la misma sesión que la
  página, así que los repositorios privados funcionan y no se gasta ningún token
  de API.
- **Límites honestos** — una carpeta vacía lo dice, una carpeta de más de 1000
  entradas muestra las primeras 1000 con una nota, y una petición fallida deja la
  carpeta plegada con un aviso en lugar de un árbol a medias.
- **Discreto** — al desactivar la función desaparecen todos los chevrones y
  filas anidadas y GitHub queda como estaba; tras navegar, todas las carpetas
  vuelven a estar plegadas.

### Tamaños y descargas de archivos

La lista de directorios de GitHub muestra cuándo cambió un archivo, pero no su
tamaño, y para guardarlo hay que abrirlo primero. GitHub Plus añade ambas cosas a
las filas de archivos:

- **Tamaño de un vistazo** — cada archivo de una lista del repositorio recibe un
  tamaño atenuado en una columna propia. Los tamaños se piden solo para las
  filas cercanas a la ventana visible, se guardan en caché para la sesión y un
  archivo cuyo tamaño no se puede leer simplemente no muestra ninguno.
- **Descarga en el sitio** — cada fila de archivo muestra su tamaño en el borde
  izquierdo de la columna y, en el borde derecho, un botón de descarga con el
  estilo de los botones de icono de GitHub. El archivo se guarda con su propio
  nombre; la ruta raw del mismo origen mantiene operativos los repositorios
  privados, y si la petición se bloquea el archivo se abre en una pestaña nueva.
  La vista blob de GitHub ya muestra el tamaño y su propio botón, así que no se
  toca.
- **Sin cuota de API** — los tamaños vienen de una petición HEAD a la dirección
  raw del propio archivo, no de la API de GitHub, así que el límite anónimo de
  60 peticiones por hora nunca se toca.
- **Discreto** — las carpetas mantienen una celda vacía, y al desactivar la
  función desaparecen todos los tamaños, botones y celdas, dejando el GitHub de
  siempre.

### Menú contextual de archivos y carpetas

Hacer clic derecho en un archivo o una carpeta es la vía más rápida a lo que
quieres hacer con él, y el menú propio de GitHub no ofrece nada de eso. GitHub
Plus lo sustituye para los archivos y las carpetas:

- **Acciones rápidas** — clic derecho en un archivo de una lista del repositorio,
  de la barra lateral del árbol de archivos o en un enlace a un archivo dentro de
  markdown renderizado abre **Abrir**, **Abrir en una
  pestaña nueva**, **Descargar**, **Copiar contenido**, **Copiar enlace**,
  **Copiar ruta** y **Copiar nombre**. En la página de un archivo o de blame
  aparece el mismo menú (sin **Abrir**, porque ya estás allí).
- **También las carpetas** — una carpeta de la lista, del árbol lateral o un
  enlace a una carpeta en markdown renderizado tiene su propio menú corto:
  **Abrir**, **Abrir en una pestaña nueva**, **Copiar enlace**, **Copiar ruta** y
  **Copiar nombre**. En una carpeta no hay nada que descargar ni leer, así que
  esas acciones no aparecen.
- **Expandir desde el menú** — en una carpeta de la lista del repositorio el menú
  ofrece **Expandir** o **Contraer**: el mismo control que la flecha de la fila,
  sin tener que acertarle.
- **Copiar el contenido** — el contenido de un archivo de texto va directo al
  portapapeles sin abrir la página; los archivos binarios y todo lo que supere
  1 MiB se rechazan con un aviso claro, en lugar de pegar basura o bloquear la
  pestaña.
- **Copiar la ruta** — la ruta relativa al repositorio (`src/main.js`), lista
  para pegarla en una terminal, un import o un enlace.
- **Copiar el nombre** — solo el nombre del elemento (`src`, `README.md`), para
  un import, un mensaje de commit o una búsqueda.
- **Solo donde ayuda** — el menú nativo sigue intacto para submódulos, imágenes,
  multimedia y enlaces normales (también los enlaces de markdown que no apuntan
  a ningún archivo del repositorio); un clic derecho que no apunta a un archivo
  ni a una carpeta se comporta como antes.
- **También con teclado** — la tecla de menú contextual abre el mismo menú en el
  enlace del archivo, con navegación por flechas y el foco restaurado al
  cerrarlo; al desactivar la función vuelve el menú del navegador en todas
  partes.

### Vista rápida de archivos

Abre cualquier archivo sin salir de la página: con el botón de ojo de una lista
de archivos, con un enlace a un archivo en markdown renderizado o con **Vista
previa** en el menú contextual del archivo:

- **Renderizado, no en bruto** — el markdown se renderiza y se sanea, los
  archivos de código reciben resaltado de sintaxis y números de línea, las
  imágenes, el vídeo y el audio se reproducen en el sitio, y los PDF se abren en
  el visor del propio navegador cuando la política de la página de GitHub
  permite el marco. Todo lo demás —incluido un PDF que la página bloquee— muestra
  una tarjeta honesta con **Abrir en GitHub** y **Descargar** en lugar de un
  marco roto.
- **Recorre la carpeta** — los archivos del mismo directorio forman un conjunto:
  los botones anterior/siguiente y las teclas de flecha cambian entre ellos, con
  la posición actual en el pie.
- **Mantén para previsualizar** — mantén pulsado el botón izquierdo sobre el
  nombre de un archivo en una lista o sobre un enlace a un archivo en markdown
  renderizado (también dentro de la propia vista rápida) para abrir su vista
  previa; el tiempo de pulsación (450 ms por defecto) y el círculo de progreso
  junto al puntero son configurables; un clic rápido sigue abriendo el archivo,
  y arrastrar o seleccionar texto cancela el gesto.
- **Acciones en la cabecera** — abre el archivo en GitHub, copia su contenido
  sin formato, su enlace o su ruta, o descárgalo con su propio nombre.
- **Markdown: vista previa o código** — un control segmentado alterna entre el
  markdown renderizado y su texto original, resaltado como markdown.
- **Seguro con repositorios privados** — las imágenes y enlaces relativos se
  resuelven por la ruta raw del mismo origen, así que un README privado conserva
  sus imágenes; el markdown se sanea y las imágenes externas se cargan sin
  referrer.
- **Límites honestos** — texto y markdown hasta 2 MiB, PDF hasta 25 MiB, y el
  resaltado tiene un tope para que un archivo enorme no congele la pestaña; por
  encima del límite, la tarjeta lleva a GitHub y al archivo sin formato.

### Insignias de commit

Los asuntos de Conventional Commits muestran su prefijo `type(scope):` como una
sola etiqueta en la página:

- **Una etiqueta de dos tonos** — el tipo en un segmento de color y el ámbito en
  uno atenuado dentro de un mismo contorno redondeado, con los dos puntos
  atenuados después, así que `fix(parser): handle empty input` se lee de un
  vistazo sin cambiar ni un carácter del asunto.
- **Color por tipo, honestidad con el resto** — `feat`, `fix`, `docs`, `style`,
  `refactor`, `perf`, `test`, `build`, `ci`, `chore` y `revert` tienen cada uno
  su color; los demás tipos en minúsculas reciben uno neutro (y pueden quedarse
  sin decorar), y un prefijo con `!` muestra un marcador rojo de cambio
  incompatible.
- **Dondequiera que GitHub muestre un asunto** — el historial de commits, la
  pestaña **Commits** de una pull request, la página de un commit suelto, el
  bloque del último commit en la portada del repositorio y las vistas clásicas
  de commits. El texto no cambia, así que copiar, buscar y traducir funcionan
  igual que antes, y desactivar la función restaura el aspecto propio de GitHub.

### Avatares de autores

El autor de cada fila de las listas de issues y pull requests recupera su
avatar:

- **Una cara junto al usuario** — cada fila muestra el avatar redondo de 16 px
  justo antes del nombre en la propia línea de metadatos de GitHub, así que la
  lista se lee como la cabecera de un comentario y no como una columna de
  usuarios.
- **Dos listas, una regla** — las páginas de Issues y Pull Requests del
  repositorio y los paneles de la cuenta comparten la vista de lista de GitHub,
  así que el avatar aparece en todas; hacer clic en el nombre sigue filtrando la
  lista igual que antes.
- **Se apaga en la página Issues** — un interruptor restaura el marcado de
  GitHub; una cuenta de bot o de aplicación sin ruta de avatar conserva
  simplemente su usuario.

### Traducción

Traduce el texto de una página sin perder su marcado — un README, un issue o
debate, un pull request, un comentario, mensajes de commit, un título o el
archivo markdown abierto en la vista rápida:

- **Un botón donde está el texto** — en el encabezado del README, en la fila de
  acciones de un comentario, en un commit, en el título de un issue, en la
  cabecera de un release o en la cabecera de una tarjeta del feed. Cuando GitHub
  no ofrece encabezado, aparece una pequeña barra sobre el texto.
- **El marcado se conserva** — enlaces, imágenes, código en línea, casillas de
  tareas y énfasis siguen funcionando: la traducción sustituye bloques de texto,
  nunca la estructura que los rodea.
- **Con botón o automática** — por defecto no se envía nada hasta que pulses; el
  modo automático traduce un bloque al entrar en pantalla y conserva su botón
  **Mostrar original**.
- **En el sitio o debajo** — sustituye el texto original o muestra la traducción
  debajo; **Mostrar original** restaura el texto exacto, y la vista al pasar el
  ratón permite asomarse mientras el puntero o el foco está dentro del bloque.
- **También archivos de texto** — los archivos de licencia y avisos (LICENSE,
  COPYING) mostrados como código reciben el mismo botón; la traducción aparece
  debajo del archivo y el código nunca se reescribe.
- **Seis proveedores** — Google gratuito por defecto (sin clave, no oficial y
  con límite de peticiones), o DeepL, Microsoft, Yandex, un endpoint compatible
  con OpenAI o tu propia instancia de LibreTranslate. El texto traducido se
  envía al proveedor elegido; las claves API se quedan en este navegador, así
  que una copia de seguridad de los ajustes las contiene.
- **En caché** — una traducción se reutiliza 24 horas por defecto (configurable;
  0 desactiva la caché) y puede vaciarse desde la página de ajustes.

### Paleta de comandos

Pulsa `Ctrl/⌘+K` en cualquier página de GitHub para abrir un único campo de
búsqueda sobre todo lo que haces allí:

- **Empieza donde estás** — en una página de repositorio la paleta se abre con
  ese repositorio ya en su ruta, así que la primera lista son sus páginas.
- **Profundiza con `Tab`** — el campo es una ruta (`owner / repo / carpeta /
  consulta`). Pulsa `Tab` en una fila de repositorio para añadirlo, y `Tab` de
  nuevo en una fila de carpeta para entrar en ella: la lista pasa a ser los
  archivos de esa carpeta, con rutas relativas al lugar en el que estás, y `Tab`
  sigue bajando tan profundo como permita el árbol. `→` y `←` hacen lo mismo
  con el campo vacío, así que puedes recorrer la ruta sin soltar las flechas.
  `Backspace` quita el último
  nivel, `Ctrl/⌘+Backspace` limpia la ruta y la consulta, y hacer clic en un
  segmento de la ruta descarta todo lo que hay debajo.
- **Tus repositorios** — todos los que posees, los propios primero, con
  estrellas, lenguaje, último push y visibilidad en la fila. Escribe `@` para
  buscar solo repositorios.
- **Repositorios con estrella** — los proyectos a los que vuelves una y otra vez;
  van después de los tuyos y llevan una estrella.
- **Archivos del repositorio de la ruta** — `/` muestra todas sus rutas o una
  consulta que coincida; las filas de carpeta están marcadas y se abren como
  nivel con `Tab`, y un archivo se abre en GitHub en la revisión que estás
  viendo.
- **Issues y pull requests abiertos** — `#` muestra los issues y pull requests
  abiertos del repositorio, con su distintivo de issue o pull request, autor y
  fecha de actualización; búscalos por título, número o autor. Pulsa `Tab` en la
  fila Issues o Pull requests del repositorio para abrir esa lista como nivel
  propio, sin escribir `#`.
- **Búsqueda tolerante** — las consultas ignoran mayúsculas y acentos latinos
  (`cafe` encuentra `Café`), prefieren inicios y palabras completas y se dividen
  por espacios, con todas las partes obligatorias.
- **Páginas como filas** — las páginas propias del repositorio de la ruta (Code,
  Issues, Pull requests, nueva incidencia, comparar cambios, Actions, Projects,
  Discussions, Releases, Wiki, Security, Insights y Settings si es tuyo) o, en el
  nivel raíz, las páginas de tu cuenta (perfil, repositorios, estrellas, nuevo
  repositorio, notificaciones, gists, ajustes de GitHub, panel), cada una a una
  fila; una fila de repositorio se etiqueta `Ir a`, y una fila de búsqueda de
  GitHub cierra cada consulta: código dentro de la ruta, issues para `#`,
  repositorios para `@` y para una consulta libre fuera de una ruta.
- **Acciones de GitHub Plus** — abre el panel, activa o desactiva sus funciones o
  actualiza la caché; `>` para comandos.
- **Favoritos y recientes** — fija lo que usas constantemente (`Alt+P`); las
  filas fijadas llevan una estrella y van primero, tanto en la lista vacía como
  en los resultados de búsqueda. Las filas abiertas recientemente vuelven arriba
  la próxima vez, por separado para cada cuenta de GitHub.
- **Acciones en cualquier fila** — haz clic derecho en una fila o pulsa
  `Shift+F10` para abrirla, abrirla en una pestaña nueva, copiar su enlace, ruta,
  dirección de clonación o número de issue, y fijarla o quitarla.
- **Rápida y discreta** — la paleta muestra al instante la lista en caché, la
  actualiza en segundo plano y mantiene tu selección. Los resultados se guardan
  con ETags durante la sesión y entre recargas, así que la paleta no gasta cuota
  de API; sin token lee datos públicos y todos los comandos siguen funcionando.
- **Token de GitHub opcional** — añádelo en la página de ajustes de la paleta
  para ver repositorios privados y listas completas (5 000 solicitudes por hora
  en lugar de 60). El token se verifica antes de usarse, se guarda solo en este
  navegador, nunca se escribe en una copia de seguridad y se envía solo a
  `api.github.com`; la caché pertenece a cada cuenta, así que cambiar de cuenta
  nunca muestra repositorios ajenos.
- **Primero el teclado** — `↑`/`↓` mueven la selección, `Enter` abre,
  `Ctrl/⌘+Enter` abre en una pestaña nueva, `Tab` entra en un repositorio,
  carpeta o lista de issues, `←`/`→` recorren la ruta, `Backspace` sale de un nivel de la ruta, `Alt+P` fija, `Ctrl/⌘+C`
  copia la fila,
  `?` muestra todas las teclas y prefijos, y `Esc` cierra (primero la ayuda); la
  paleta no estorba mientras escribes en un editor de comentarios o README y se
  cierra sola al navegar. El atajo es una opción predefinida o cualquier
  combinación que grabes en la página de ajustes de la paleta.

### Repositorios similares

Cada página de repositorio público gana en la barra lateral una sección
**Repositorios similares** con proyectos cercanos al que estás leyendo:

- **Dos orígenes de datos a elegir** — **GitHub** (el predeterminado) busca por
  los temas y el lenguaje principal del repositorio en `api.github.com` y
  ordena los resultados por temas compartidos, el mismo lenguaje y un número de
  estrellas comparable. **SimRepo** muestra datos de similitud precalculados; es
  un tercero, así que el panel le envía el nombre del repositorio que abriste y
  sus páginas siguientes exigen una estrella en el proyecto SimRepo, algo que la
  tarjeta de ajustes dice con claridad.
- **Una fila que se juzga de un vistazo** — propietario/nombre, la descripción,
  el lenguaje principal con su color, estrellas, forks, una etiqueta de
  archivado y un porcentaje de coincidencia relativo; la mejor coincidencia del
  conjunto se lee como 100%.
- **Paginación** — **Ver más** añade los siguientes resultados cuando el origen
  los tiene.
- **Estados honestos** — cargando, sin resultados, un repositorio fuera del
  conjunto de datos, un límite de consultas alcanzado con su hora de
  restablecimiento y una solicitud fallida tienen cada uno su propia línea, así
  que la barra lateral nunca muestra una caja vacía.
- **Solo públicos** — el panel solo se pide en un repositorio que GitHub marca
  como público; un repositorio privado, interno o de visibilidad desconocida
  nunca envía una solicitud, y allí no aparece el panel.
- **Tus ajustes** — el interruptor principal, el origen de datos, los resultados
  por página y la vida de la caché están en la página **Descubrir**.

### Panel de ajustes

Ábrelo con la fila **Ajustes de GitHub Plus** del menú del avatar (justo debajo
de **Settings** de GitHub), con el comando de ajustes de la paleta o con el
comando de menú del gestor de userscripts. Los cambios son un
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
| `logging.enabled` | `false` | Diagnóstico en la consola con códigos GP, módulo, detalles y pila; desactivado por defecto |
| `fileIcons.enabled` | `true` | Interruptor principal de los iconos de archivo y carpeta |
| `fileIcons.folders` | `true` | Iconos específicos para nombres de carpeta comunes |
| `fileIcons.specialNames` | `true` | Iconos propios para nombres de archivo conocidos |
| `fileAges.enabled` | `true` | Interruptor principal; colores de antigüedad estilo blame para los archivos listados |
| `fileAges.folders` | `true` | Colorear también las filas de carpetas |
| `fileMeta.enabled` | `true` | Interruptor principal de tamaños y botones de descarga |
| `fileMeta.sizes` | `true` | Mostrar el tamaño de cada archivo en las listas del repositorio |
| `fileMeta.download` | `true` | Botón de descarga en las listas del repositorio |
| `fileMenu.enabled` | `true` | Interruptor principal del menú contextual de archivos y carpetas |
| `filePreview.enabled` | `true` | Interruptor principal de la vista rápida de archivos |
| `filePreview.rowButton` | `true` | Botón de ojo en las filas de la lista de archivos (el menú contextual siempre ofrece **Vista previa**) |
| `filePreview.longPress` | `true` | Mantener el botón izquierdo sobre un nombre de archivo o un enlace de markdown para abrir la vista previa |
| `filePreview.longPressMs` | `450` | Tiempo de pulsación en ms antes de abrir la vista previa (200–2000) |
| `filePreview.longPressRing` | `true` | Círculo de progreso junto al puntero mientras se mantiene |
| `folderTree.enabled` | `true` | Interruptor principal de las carpetas expandibles en las listas de repositorio |
| `commitBadges.enabled` | `true` | Interruptor principal de las insignias de Conventional Commits |
| `commitBadges.unknownTypes` | `true` | Dar estilo también a los tipos en minúsculas fuera del conjunto convencional |
| `commitBadges.breaking` | `true` | Marcador rojo para un prefijo `!` de cambio incompatible |
| `listAvatars.enabled` | `true` | Interruptor de los avatares de autores en las listas de issues y pull requests |
| `translate.enabled` | `true` | Interruptor principal de la traducción en la página |
| `translate.provider` | `'google'` | `google` (gratuito), `deepl`, `microsoft`, `yandex`, `openai`, `libretranslate` |
| `translate.providerConfig.<id>` | según el proveedor | Credenciales y endpoint por proveedor (clave API, región, carpeta, modelo, URL) |
| `translate.targetLang` | `'auto'` | `'auto'` sigue el idioma de los ajustes; si no, cualquier código ofrecido |
| `translate.mode` | `'button'` | `button` traduce al hacer clic; `auto` traduce los bloques al entrar en pantalla |
| `translate.display` | `'replace'` | `replace` sustituye el texto; `below` muestra la traducción bajo el original |
| `translate.reveal` | `'button'` | Modo sustitución: `button` muestra **Mostrar original**; `hover` enseña el original al pasar el ratón o con el foco |
| `translate.linkLabels` | `true` | Traducir también el texto de los enlaces |
| `translate.surfaces.<id>` | `true` | Interruptores por lugar: `markdown`, `plaintext`, `commits`, `titles`, `preview` |
| `translate.cacheHours` | `24` | Duración de la caché en horas (0 la desactiva) |
| `commandPalette.enabled` | `true` | Interruptor principal de la paleta de comandos `Ctrl/⌘+K` |
| `commandPalette.shortcut` | `'mod+k'` | `mod+k`, `mod+shift+k`, `mod+space`, `alt+k`, `off` o una combinación grabada en la página de ajustes |
| `commandPalette.token` | `''` | Token de GitHub opcional para repositorios privados y límites más altos (solo a `api.github.com`, nunca se exporta) |
| `commandPalette.sources.<id>` | `true` | Interruptores de origen: `commands`, `repositories`, `starred`, `files`, `issues`, `recent` |
| `commandPalette.sources.issues` | `true` | Issues y pull requests abiertos del repositorio actual |
| `commandPalette.hideForks` | `false` | Ocultar forks de repositorios |
| `commandPalette.hideArchived` | `false` | Ocultar repositorios archivados |
| `commandPalette.cacheHours` | `6` | Duración de la caché de repositorios y árboles de archivos en horas (0 la desactiva) |
| `commandPalette.maxResults` | `30` | Número máximo de filas por conjunto de resultados (10–100) |
| `similarRepos.enabled` | `true` | Interruptor principal de la barra lateral **Repositorios similares** |
| `similarRepos.provider` | `'github'` | Origen de datos: `github` (búsqueda propia) o `simrepo` (tercero) |
| `similarRepos.results` | `5` | Resultados por página (3–20) |
| `similarRepos.cacheHours` | `24` | Vida de la caché en horas (0 la desactiva) |

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
