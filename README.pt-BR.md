# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · **Português (Brasil)** · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.14.2-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

Um userscript que melhora o GitHub com um painel de configurações completo, uma
galeria de imagens para markdown renderizado, ícones de arquivo coloridos onde o
GitHub lista arquivos, idades coloridas no estilo blame para esses arquivos,
tamanhos de arquivo com downloads em um clique, um menu de contexto para ações
de arquivo e uma pré-visualização rápida de qualquer arquivo.

> **Status:** inicial (`0.14.2`). Painel de configurações com busca instantânea
> (Geral · Galeria · Arquivos · Backup · Sobre), a galeria de imagens de
> markdown, ícones de arquivo coloridos, idades coloridas no estilo blame,
> tamanhos de arquivo com botões de download, um menu de contexto de arquivos e
> uma pré-visualização rápida de arquivos. Mais melhorias no GitHub estão
> planejadas.

> As diretivas `@updateURL` / `@downloadURL` do script apontam para `main` no
> GitHub — a URL de instalação abaixo sempre leva à compilação mais recente.

## Instalação rápida

1. Instale um gerenciador de userscripts ([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/) ou
   [ScriptCat](https://scriptcat.org/) recomendado).
2. Instale o script pelo GitHub (URL bruta abaixo).

**URL de instalação (GitHub — a mais recente):**

```
https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)

### Instalação por URL (painel)

| Gerenciador | Caminho |
|---------|------|
| Tampermonkey | Painel → **Utilities** → **Install from URL** |
| Violentmonkey | Painel → **+** → **Install from URL** |
| Greasemonkey | Menu da extensão → **New User Script** → cole a URL bruta |
| ScriptCat | Instale a [extensão](https://scriptcat.org/), depois **Install from URL** com a URL bruta do GitHub |

### Instalação manual

1. Abra o arquivo [`github-plus.user.js`](https://github.com/NemoKing1210/github-plus/blob/main/github-plus.user.js) compilado neste repositório (ou execute `npm run build` após clonar).
2. Copie todo o conteúdo do arquivo.
3. No seu gerenciador de userscripts, crie um script novo e cole o código.
4. Salve e ative o script.

## Atualizações

O script inclui as diretivas `@updateURL` e `@downloadURL` apontando para o
arquivo bruto no GitHub, então gerenciadores compatíveis o atualizam
automaticamente.

Passos de release para mantenedores: veja
[docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing).

## Recursos

### Galeria de imagens para markdown

Cada contêiner de markdown renderizado no GitHub é um conjunto da galeria:

- **Clique em qualquer imagem** — no README de um repositório, na visualização
  de um arquivo `.md`, numa página de wiki, numa issue, pull request, comentário
  de revisão (onde quer que o GitHub renderize `.markdown-body`) — e ela abre em
  tela cheia no visualizador integrado.
- **Navegue pelo conjunto inteiro** — `←`/`→` (ou as setas) vão para as outras
  imagens do mesmo contêiner, a faixa de miniaturas centralizada salta para
  qualquer uma e o contador mostra a posição atual.
- **Zoom e arraste** — roda do mouse, `+`/`−`, clique duplo e pinça ampliam até
  o limite configurado; arraste para mover a imagem em qualquer zoom; `0`
  redefine, `r` gira; as imagens vizinhas são pré-carregadas para a navegação
  ser instantânea.
- **Tamanho real sob demanda** — quando uma imagem aponta para um arquivo maior
  (um arquivo do repositório atrás de uma página `/blob/`, um anexo enviado,
  qualquer URL de imagem), esse arquivo é testado e substituído, então você
  recebe a resolução original sem uma imagem quebrada se ele não estiver
  disponível.
- **Baixe o que você vê** — passe o mouse sobre uma imagem Markdown para ver um
  botão de download, e o visualizador tem o seu; o arquivo é salvo com o próprio
  nome (um endereço de proxy é desembrulhado até o nome original), e uma
  configuração oculta os dois botões.
- **Discreto por padrão** — badges, trechos de status, emojis e ícones minúsculos
  nunca ocupam uma vaga na galeria; as imagens mantêm a aparência do próprio
  GitHub (só o cursor indica que abrem a galeria), e cliques com modificadores
  (Ctrl/Cmd/Shift/Alt) e com o botão do meio ficam para o GitHub, então abrir um
  arquivo em nova aba continua igual.
- **Adaptado ao tema** — a galeria e o painel de configurações usam as variáveis
  de cor do GitHub, então ambos seguem o tema escolhido (claro, escuro,
  esmaecido).

### Ícones de arquivo

O GitHub desenha cada arquivo e pasta com o mesmo glifo cinza, então `.ts` e
`.css` parecem iguais até você ler o nome. O GitHub Plus colore:

- **Tipo por extensão** — linguagens, formatos de configuração e dados, imagens,
  mídia, arquivos compactados e documentos ganham seu próprio ícone; extensões
  compostas como `.d.ts` e `.spec.ts` são verificadas antes da extensão base.
- **Nomes conhecidos** — `Dockerfile`, `package.json`, `README`, `.gitignore`,
  `tsconfig.json` e semelhantes ganham um ícone dedicado.
- **Papel das pastas** — `src`, `dist`, `node_modules`, `docs`, `.github`,
  `components`, `utils` e outras pastas comuns também são marcadas.
- **Onde o GitHub lista arquivos** — a árvore do repositório e subpastas, a
  barra lateral da árvore de arquivos nas páginas de código, o cabeçalho de
  arquivo das páginas blob, tree e blame, os cabeçalhos de arquivos em pull
  requests e a árvore do diff, listas de arquivos de commits, busca de código,
  gists e assets de release.
- **Discreto** — o glifo nativo do GitHub é ocultado e substituído no lugar; sem
  mudanças de layout, sem bordas extras, e desativar o recurso devolve o GitHub
  ao estado original.

Os ícones são um subconjunto curado do
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
(MIT); a atribuição está em [THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

### Idade dos arquivos

O GitHub já mostra há quanto tempo cada arquivo mudou, mas todas as datas
parecem iguais à primeira vista. O GitHub Plus pega a legenda do blame e colore
o próprio texto da data:

- **Um olhar, uma idade** — as datas mais recentes são quentes (`#ffd78d` no
  tema escuro, o dourado de atenção no claro) e as antigas desbotam para o cinza
  atenuado do tema, então um arquivo de quatro meses já parece antigo. A escala é
  propositalmente concentrada no presente: dias, semanas e meses continuam
  distinguíveis e tudo acima de um ano é cinza. Temas claros e escuros têm sua
  própria escala, então a cor continua forte e legível nos dois.
- **Nada se move** — a data mantém o texto, a redação relativa e a dica do
  GitHub; só a cor muda, então nenhuma linha é redimensionada e o rótulo
  acessível é exatamente o que o GitHub renderizou.
- **Arquivos e pastas** — as linhas de pastas também recebem cor (a data indica
  sua última alteração) e uma configuração limita o recurso aos arquivos.
- **Discreto** — desativar o recurso restaura a cor de data do GitHub e não
  deixa vestígio.

### Tamanhos e downloads de arquivos

A listagem de diretórios do GitHub mostra quando um arquivo mudou, mas não o seu
tamanho, e para salvá-lo é preciso abri-lo antes. O GitHub Plus adiciona os dois
diretamente às linhas de arquivo:

- **Tamanho num relance** — cada arquivo de uma listagem do repositório ganha um
  tamanho discreto em uma coluna própria. Os tamanhos são buscados apenas para as
  linhas próximas da área visível, guardados em cache para a sessão, e um arquivo
  cujo tamanho não pode ser lido simplesmente não mostra nenhum.
- **Download ali mesmo** — cada linha de arquivo mostra o tamanho na borda
  esquerda da coluna e, na borda direita, um botão de download no estilo dos
  botões de ícone do GitHub. O arquivo é salvo com o próprio nome; a rota raw de
  mesma origem mantém os repositórios privados funcionando, e uma busca bloqueada
  abre o arquivo em uma nova aba. A visualização blob do GitHub já mostra o
  tamanho e um botão próprio, então ela não é alterada.
- **Sem cota de API** — os tamanhos vêm de uma requisição HEAD no endereço raw
  do próprio arquivo, não da API do GitHub, então o limite anônimo de 60
  requisições por hora nunca é usado.
- **Discreto** — pastas mantêm uma célula vazia, e desativar o recurso remove
  cada tamanho, botão e célula, devolvendo o GitHub original.

### Menu de contexto de arquivos

Clicar com o botão direito em um arquivo é o caminho mais rápido para o que você
quer fazer com ele — e o menu do próprio GitHub não oferece nada disso. O GitHub
Plus o substitui para arquivos:

- **Ações rápidas** — clique com o botão direito em um arquivo de uma listagem
  do repositório ou da barra lateral da árvore de arquivos para **Abrir**,
  **Abrir em nova aba**, **Baixar**, **Copiar conteúdo**, **Copiar link** e
  **Copiar caminho**. Na página de um arquivo ou de blame aparece o mesmo menu
  (sem **Abrir**, pois você já está lá).
- **Copiar o conteúdo** — o conteúdo de um arquivo de texto vai direto para a
  área de transferência sem abrir a página; arquivos binários e qualquer coisa
  acima de 1 MiB são recusados com um aviso claro, em vez de colar lixo ou
  travar a aba.
- **Copiar o caminho** — o caminho relativo ao repositório (`src/main.js`),
  pronto para colar em um terminal, um import ou um link.
- **Só onde ajuda** — o menu nativo permanece intacto para pastas, imagens,
  mídia e links comuns; um clique direito que não aponta para um arquivo se
  comporta como antes.
- **Também pelo teclado** — a tecla de menu de contexto abre o mesmo menu no
  link do arquivo, com navegação pelas setas e foco restaurado ao fechar;
  desativar o recurso devolve o menu do navegador em todos os lugares.

### Pré-visualização rápida de arquivos

Abra qualquer arquivo sem sair da página — pelo botão de olho em uma lista de
arquivos ou por **Pré-visualização** no menu de contexto do arquivo:

- **Renderizado, não bruto** — o markdown é renderizado e sanitizado, arquivos
  de código ganham realce de sintaxe e números de linha, imagens, vídeo e áudio
  são reproduzidos no local, e PDFs abrem no visualizador do próprio navegador
  quando a política da página do GitHub permite o quadro. Qualquer outra coisa —
  inclusive um PDF que a página bloqueie — mostra um cartão honesto com **Abrir
  no GitHub** e **Baixar** em vez de um quadro quebrado.
- **Navegue pela pasta** — os arquivos do mesmo diretório formam um conjunto: os
  botões anterior/próximo e as setas do teclado alternam entre eles, com a
  posição atual no rodapé.
- **Ações no cabeçalho** — abra o arquivo no GitHub, copie seu conteúdo bruto,
  link ou caminho, ou baixe-o com o próprio nome.
- **Markdown: pré-visualização ou fonte** — um controle segmentado alterna entre
  o markdown renderizado e seu texto original, realçado como markdown.
- **Seguro com repositórios privados** — imagens e links relativos passam pela
  rota raw da mesma origem, então um README privado mantém suas imagens; o
  markdown é sanitizado e imagens externas carregam sem referrer.
- **Limites honestos** — texto e markdown até 2 MiB, PDFs até 25 MiB, e o realce
  tem um teto para que um arquivo enorme não congele a aba; acima do limite, o
  cartão aponta para o GitHub e o arquivo bruto.

### Painel de configurações

Abra-o pelo botão de engrenagem no cabeçalho do GitHub, pela linha
**Configurações do GitHub Plus** no menu do avatar (logo abaixo do **Settings**
do GitHub) ou pelo comando de menu do gerenciador de userscripts. As alterações
são um rascunho: nada é salvo até você clicar em **Salvar**; **Cancelar**, o
clique no fundo e `Escape` descartam o rascunho; **Restaurar padrões** pede
confirmação antes.

## Configurações

Armazenadas em `gp_settings_v1`.

| Chave | Padrão | Observações |
|-----|---------|------|
| `language` | `'auto'` | Idioma da interface do painel de configurações (`'auto'` segue o navegador) |
| `gallery.enabled` | `true` | Chave mestre da galeria de imagens de markdown |
| `gallery.sources.markdown` | `true` | Chave por fonte (uma entrada por fonte registrada) |
| `gallery.skipBadges` | `true` | Ignora serviços de badge (inclusive badges atrás do proxy camo do GitHub e badges de status do Actions), emojis, imagens com ≤ 40 px de altura e imagens menores que 80 px nos dois eixos |
| `gallery.upgradeFullSize` | `true` | Testa e carrega o original vinculado em tamanho real |
| `gallery.download` | `true` | Botão de download no visualizador e ao passar o mouse sobre imagens Markdown |
| `gallery.thumbnails` | `true` | Faixa de miniaturas no visualizador |
| `gallery.loop` | `true` | Passa da última imagem para a primeira |
| `gallery.maxZoom` | `8` | Limite de zoom (2× … 16×) |
| `toasts.enabled` | `true` | Notificações toast |
| `toasts.position` | `'bottom-right'` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `toasts.duration` | `5000` | Atraso de ocultação em ms (`0` mantém o toast até ser fechado) |
| `fileIcons.enabled` | `true` | Chave mestre dos ícones de arquivo e pasta |
| `fileIcons.folders` | `true` | Ícones específicos para nomes de pasta comuns |
| `fileIcons.specialNames` | `true` | Ícones dedicados para nomes de arquivo conhecidos |
| `fileAges.enabled` | `true` | Chave mestre; cores de idade no estilo blame para os arquivos listados |
| `fileAges.folders` | `true` | Colorir também as linhas de pastas |
| `fileMeta.enabled` | `true` | Chave mestra para tamanhos e botões de download |
| `fileMeta.sizes` | `true` | Mostrar o tamanho de cada arquivo nas listagens do repositório |
| `fileMeta.download` | `true` | Botão de download nas listagens do repositório |
| `fileMenu.enabled` | `true` | Chave mestra do menu de contexto de arquivos |
| `filePreview.enabled` | `true` | Chave mestra da pré-visualização rápida de arquivos |
| `filePreview.rowButton` | `true` | Botão de olho nas linhas da lista de arquivos (o menu de contexto sempre oferece **Pré-visualização**) |

## Como a galeria é construída

A galeria é um pequeno framework mais uma fonte por lugar onde existem imagens,
então adicionar um lugar novo nunca mexe na galeria:

| Arquivo | Papel |
|------|------|
| `src/ui/viewer.js` | A lightbox: `openViewer({ images, index, loop, thumbnails, download, minZoom, maxZoom, resolveImage, labels, onClose })`, além de `closeViewer()` / `isViewerOpen()`. Autônoma — reutilizável por qualquer recurso. |
| `src/gallery/sources.js` | Registro de fontes: `registerSource`, `listSources`. |
| `src/gallery/collect.js` | Coleta: normalização, filtragem (badges/emojis/ícones pequenos), deduplicação e limite. |
| `src/gallery/index.js` | Ligação: um listener de cliques em fase de captura, a folha de estilos do cursor gerada, listeners de hover delegados para o botão de download e o listener de configurações. |
| `src/gallery/sources/markdown.js` | A fonte markdown: contêineres, busca de imagens e resolução do tamanho real. |

Como o indicador é CSS construído a partir do registro e o tratamento de cliques
é um único listener delegado que percorre o DOM vivo, a galeria continua
funcionando após a navegação do lado do cliente do GitHub e re-renderizações do
React, sem laço de varredura nem controle por imagem.

### Adicionar uma fonte

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

Depois adicione as chaves em quatro lugares ao mesmo tempo: o módulo da fonte e
seu import, `DEFAULT_GALLERY.sources.<id>` em `src/core/constants.js` e as chaves
`source.<id>` / `source.<id>Desc` nos **dez** arquivos
`src/i18n/locales/*.js`. O painel de configurações pega a nova fonte do registro
automaticamente.

## Desenvolvimento

Requer Node.js 22 (veja `.nvmrc`).

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate)
npm run icons:build        # regenerate the embedded icon subset
npm test                   # Node test runner (unit tests)
```

Edite somente arquivos em `src/` — `github-plus.user.js` e
`github-plus.meta.js` são gerados. Veja [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
para testes e depuração, [CONTRIBUTING.md](CONTRIBUTING.md) para as regras,
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para o mapa de módulos e fluxos de
dados, e [DESIGN.md](DESIGN.md) antes de tocar em qualquer elemento visível.

## Licença

[MIT](LICENSE).

Os ícones de arquivo incluídos vêm do Material Icon Theme (MIT); veja
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

Um projeto independente, sem afiliação com a GitHub, Inc.
