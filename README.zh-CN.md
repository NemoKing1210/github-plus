# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · **中文（简体）** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.23.0-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

一个改进 GitHub 的用户脚本：完整的设置面板、`Ctrl/⌘+K` 命令面板、渲染后 Markdown
的图片画廊、GitHub 列出文件时显示的彩色文件图标、这些文件的 blame 风格年龄着色、
文件大小与一键下载，用于文件操作的上下文菜单、任意文件的快速预览，以及页面内容的
翻译。

> **状态：** 早期（`0.23.0`）。带即时搜索的设置面板（通用 · 画廊 · 文件 · 翻译 ·
> 面板 · 备份 · 关于）、`Ctrl/⌘+K` 命令面板、Markdown 图片画廊、彩色文件图标、
> blame 风格的年龄着色、带下载按钮的文件大小、文件上下文菜单、快速文件预览，以及
> 页面翻译。计划加入更多 GitHub 改进。

> 脚本的 `@updateURL` / `@downloadURL` 指向 GitHub 的 `main` 分支——下面的安装
> 链接始终指向最新构建。

## 快速安装

1. 安装一个用户脚本管理器（推荐 [Tampermonkey](https://www.tampermonkey.net/)、
   [Violentmonkey](https://violentmonkey.github.io/) 或
   [ScriptCat](https://scriptcat.org/)）。
2. 从 GitHub 安装脚本（下方 raw 链接）。

**安装链接（GitHub — 最新）：**

```
https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)

### 通过 URL 安装（面板）

| 管理器 | 路径 |
|---------|------|
| Tampermonkey | 面板 → **Utilities** → **Install from URL** |
| Violentmonkey | 面板 → **+** → **Install from URL** |
| Greasemonkey | 附加组件菜单 → **New User Script** → 粘贴 raw 链接 |
| ScriptCat | 安装[扩展](https://scriptcat.org/)，然后用 GitHub raw 链接选择 **Install from URL** |

### 手动安装

1. 打开本仓库中构建好的 [`github-plus.user.js`](https://github.com/NemoKing1210/github-plus/blob/main/github-plus.user.js)（或克隆后运行 `npm run build`）。
2. 复制文件的全部内容。
3. 在用户脚本管理器中新建脚本并粘贴代码。
4. 保存并启用脚本。

## 更新

脚本包含指向 GitHub raw 文件的 `@updateURL` 和 `@downloadURL` 元数据，因此支持
的管理器会自动更新。

维护者的发布步骤：参见
[docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing)。

## 功能

### Markdown 图片画廊

GitHub 上每个渲染后的 Markdown 容器都是一个画廊集合：

- **点击任意图片**——在仓库 README、`.md` 文件视图、wiki 页面、issue、pull
  request、审查评论中（凡是 GitHub 渲染 `.markdown-body` 的地方）或快速预览中
  渲染的 Markdown 里——它会在内置查看器中全屏打开。
- **浏览整个集合**——`←`/`→`（或屏幕箭头）切换到同一容器中的其他图片，居中的
  缩略图条可跳到任意一张，计数器显示当前位置。
- **缩放与平移**——滚轮、`+`/`−`、双击和双指缩放可放大到设定上限；任意缩放级别
  都可拖动图片；`0` 重置，`r` 旋转；相邻图片会预加载，翻看几乎瞬间完成。
- **按需加载原始大小**——如果图片链接到更大的文件（`/blob/` 页面背后的仓库文件、
  已上传的附件、任意图片 URL），会先检测该文件再替换，这样你能看到原始分辨率；
  若文件不可用也不会出现破图。
- **下载所见内容**——将鼠标悬停在 Markdown 图片上会显示下载按钮，查看器工具栏
  中也有一个；文件以自己的文件名保存（代理地址会还原为原始文件名），一个设置
  即可同时隐藏这两个按钮。
- **默认克制**——徽章、状态片段、表情和极小图标绝不会占用画廊位置；图片保持
  GitHub 自身外观（只有光标提示可打开画廊），带修饰键（Ctrl/Cmd/Shift/Alt）的
  点击和中键点击仍交给 GitHub，因此在新标签页打开文件与以前完全一致。
- **跟随主题**——画廊和设置面板使用 GitHub 自身的颜色变量，因此都会跟随所选主题
  （浅色、深色、暗淡）。

### 文件图标

GitHub 用同一个灰色字形绘制所有文件和文件夹，所以 `.ts` 和 `.css` 在读到名字前
看起来一样。GitHub Plus 为它们着色：

- **按扩展名识别类型**——语言、配置和数据格式、图片、媒体、压缩包和文档都有各自
  的图标；`.d.ts`、`.spec.ts` 这类复合扩展名会先于基础扩展名匹配。
- **已知文件名**——`Dockerfile`、`package.json`、`README`、`.gitignore`、
  `tsconfig.json` 等都有专属图标。
- **文件夹角色**——`src`、`dist`、`node_modules`、`docs`、`.github`、
  `components`、`utils` 等常见文件夹也会标记。
- **GitHub 列出文件的每个地方**——仓库树及子目录、代码页面的文件树侧边栏、blob、
  tree 和 blame 页面的文件头部、pull request 文件头部和 diff 树、提交文件列表、
  代码搜索、gist 和 release 附件。
- **克制**——隐藏 GitHub 原生字形并在原位置替换；不改变布局、不加多余边框，禁用
  该功能即可恢复 GitHub 原样。

图标是 [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
（MIT）的精简子集；署名见 [THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES)。

### 文件年龄

GitHub 已经显示每个文件最后一次更改距今多久，但一眼看去所有日期都一样。GitHub
Plus 借用 blame 的色阶，直接给日期文字着色：

- **一眼看出年龄**——最新日期是暖色（深色主题为 `#ffd78d`，浅色主题为 GitHub 的
  注意金色），较旧的日期逐渐褪为主题的低调灰色，因此四个月前的文件已经显得陈旧。
  色阶有意向近期倾斜：天、周、月仍可区分，超过一年的日期只是灰色。浅色和深色主题
  各有自己的色带，因此在两种主题下颜色都保持鲜明、清晰可读。
- **布局不变**——日期保留 GitHub 自己的文字、相对时间和提示；只有颜色改变，所以
  行不会重新排版，辅助技术读取的标签也仍是 GitHub 渲染的内容。
- **文件和文件夹**——文件夹行也会着色（日期表示其最后一次更改），一项设置可以只用
  于文件。
- **克制**——关闭功能后恢复 GitHub 自己的日期颜色，不留下任何痕迹。

### 文件大小与下载

GitHub 的目录列表只显示文件最后一次修改的时间，不显示大小；要保存文件还得先打开它。
GitHub Plus 把两者直接加到文件行上：

- **一眼看到大小** — 仓库列表中的每个文件都会在专属列中显示一个低调的大小。
  只为接近视口的行请求大小，并在本次会话中缓存；读不到大小的文件则不显示。
- **就地下载** — 每个文件行的左侧显示文件大小，右侧是与 GitHub 图标按钮样式一致的下载按钮。
  文件按自身名称保存；同源的 raw 路径保证私有仓库同样可用，请求被阻止时会改为在新标签页中打开。
  GitHub 的文件页面（blob）本身已显示大小和下载按钮，因此不再额外添加。
- **不消耗 API 配额** — 大小通过对文件自身 raw 地址的 HEAD 请求获得，而不是 GitHub API，
  因此从不触碰每小时 60 次的匿名限额。
- **低调** — 文件夹对应的一列保持为空；关闭该功能后所有大小、按钮和新增列都会消失，页面恢复为原生 GitHub。

### 文件上下文菜单

右键单击文件是最快的操作入口——而 GitHub 自带的菜单并不提供这些操作。GitHub Plus
会为文件替换该菜单：

- **快捷操作** — 在仓库文件列表、文件树侧边栏或渲染后的 Markdown 中右键单击文件链接，可**打开**、
  **在新标签页中打开**、**下载**、**复制内容**、**复制链接**和**复制路径**。
  在文件页面或 blame 页面中会出现同样的菜单（不含**打开**，因为你已经在该页面）。
- **复制内容** — 文本文件的内容无需打开页面即可直接进入剪贴板；二进制文件和超过
  1 MiB 的文件会被明确提示拒绝，而不是粘贴乱码或卡住标签页。
- **复制路径** — 相对于仓库的路径（`src/main.js`），可直接粘贴到终端、导入语句或链接中。
- **只在有用之处生效** — 文件夹、图片、媒体和普通链接（包括不指向仓库文件的
  Markdown 链接）仍使用原生菜单；没有指向文件的右键单击行为与之前完全一致。
- **也支持键盘** — 上下文菜单键会在文件链接处打开同一菜单，支持方向键导航，关闭后
  焦点会回到原处；关闭该功能后各处都会恢复浏览器菜单。

### 快速文件预览

无需离开页面即可打开任意文件——使用文件列表中的眼睛按钮、渲染后 Markdown 中的
文件链接，或文件右键菜单中的**预览**：

- **渲染而非原始文本** — Markdown 会被渲染并净化，源代码文件获得语法高亮和
  行号，图片、视频和音频就地播放，PDF 在 GitHub 页面策略允许嵌入框架时于
  浏览器自带的查看器中打开。其他情况——包括被页面阻止的 PDF——都会显示一张
  诚实的卡片，提供 **在 GitHub 上打开** 和 **下载**，而不是损坏的框架。
- **在文件夹中切换** — 同一目录中的文件组成一个集合：上一页/下一页按钮和方向键
  可在其间切换，页脚显示当前位置。
- **按住预览** — 在列表中的文件名或渲染后 Markdown 中的文件链接（包括快速预览里
  已打开的内容）上按住鼠标左键即可打开预览；按住时长（默认 450 毫秒）和指针处的
  进度圆圈均可配置；快速单击仍会打开文件，拖动或选中文本则会取消。
- **页头操作** — 在 GitHub 上打开文件、复制其原始内容、链接或路径，或以自己的
  文件名下载。
- **Markdown：预览或源码** — 分段控件可在渲染后的 Markdown 与其原始文本（按
  Markdown 高亮）之间切换。
- **私有仓库也安全** — 相对图片和链接通过同源 raw 路由解析，因此私有 README 的
  图片仍能显示；Markdown 经过净化，外部图片加载时不发送 referrer。
- **诚实的限制** — 文本和 Markdown 最大 2 MiB，PDF 最大 25 MiB，高亮也有上限，
  避免超大文件卡住标签页；超出限制时，卡片会指向 GitHub 和原始文件。

### 翻译

在不破坏标记的前提下翻译页面文本——README、议题或讨论、拉取请求、评论、
提交信息、标题，或快速预览中打开的 Markdown 文件：

- **按钮就在文本旁** —— README 文件头、评论的操作栏、提交或议题标题处。GitHub
  没有现成标题栏时，文本上方会出现一条小工具栏。
- **标记保持不变** —— 链接、图片、行内代码、任务复选框和强调都能继续使用：翻译
  替换的是文本块，而不是它周围的结构。
- **按钮或自动** —— 默认不点击就不会发送任何内容；自动模式会在区块进入视野时
  翻译，并保留 **显示原文** 按钮。
- **就地或下方** —— 可替换原文，也可在原文下方显示译文；**显示原文** 会恢复精确
  的原文，悬停显示可在指针或焦点位于区块内时临时查看。
- **还包括纯文本文件** —— 以代码形式显示的许可证和声明文件（LICENSE、COPYING）也会出现同一个按钮；译文显示在文件下方，代码本身不会被改写。
- **六种服务** —— 默认使用免费的 Google（无需密钥，非官方且有速率限制），也可
  选择 DeepL、Microsoft、Yandex、兼容 OpenAI 的端点或自建 LibreTranslate。待翻译
  文本会发送到所选服务；API 密钥只保存在此浏览器中，因此设置备份会包含它们。
- **缓存** —— 译文默认复用 24 小时（可配置；0 表示关闭缓存），并可在设置页清除。

### 命令面板

在任意 GitHub 页面按下 `Ctrl/⌘+K`，即可用一个搜索框覆盖你在 GitHub 上的一切操作：

- **头部按钮** —— 命令面板按钮位于 GitHub 头部操作区的最前面，可从任意页面打开面板，
  并显示当前快捷键。
- **你的仓库** —— 你拥有的所有仓库，自己的排在前面，详情面板显示星标、语言、
  最近推送和可见性。输入 `@` 只搜索仓库。
- **星标仓库** —— 你反复回访的项目，排在自有仓库之后并带有星标。
- **当前仓库的文件** —— `#` 列出当前仓库的所有路径（或与之匹配的查询）；文件会在
  GitHub 上按你正在浏览的版本打开。
- **打开的 issue 和 pull request** —— 当前仓库中打开的 issue 和 pull request，
  带有 issue 或 pull request 标记；详情面板显示作者、更新时间和评论数，可按标题、
  编号或作者搜索。
- **GitHub 页面和 GitHub Plus 操作** —— 打开你的 issue、pull request、通知或设置；
  打开 GitHub Plus 面板；切换它的功能；刷新缓存。`>` 只列出命令，`?` 把查询交给
  GitHub 自己的搜索。
- **收藏与最近** —— 用 `Alt+P` 固定常用条目；固定行带有星标并排在最前，空列表和
  搜索结果都是如此。最近打开的行会在下次打开时回到顶部，并按 GitHub 账号分别记录。
- **任意行的操作** —— 右键单击一行、按 `Shift+F10` 或点击 `⋯` 按钮，即可打开、
  在新标签页打开、复制链接、路径、克隆地址或 issue 编号，以及固定或取消固定。
- **快速且安静** —— 命令面板立即渲染缓存列表，在后台刷新，并保持当前选中行。结果
  在本次会话和多次刷新之间都带 ETag 缓存，因此不会消耗 API 配额；没有令牌时读取
  公开数据，所有命令依然可用。
- **可选的 GitHub 令牌** —— 在命令面板的设置页添加后，可查看私有仓库和完整列表
  （每小时 5 000 次请求，而非 60 次）。令牌在使用前会先验证，只保存在此浏览器中，
  永远不会写入备份，并且只发送到 `api.github.com`；缓存按账号隔离，切换账号绝不会
  显示他人的仓库。
- **键盘优先** —— `↑`/`↓` 移动，`Enter` 打开，`Ctrl/⌘+Enter` 在新标签页打开，
  `Alt+P` 固定，`Esc` 先清空查询再关闭；在评论或 README 编辑器中输入时命令面板不会
  打扰，导航时会自动关闭。快捷键可以是预设，也可以是在命令面板设置页录制的任意组合。

### 设置面板

可从头像菜单中的 **GitHub Plus 设置** 一行（就在 GitHub 自己的 **Settings**
下方）、命令面板的设置命令，或用户脚本管理器的菜单命令打开。修改以草稿形式存在：
按下**保存**前不会写入任何内容；**取消**、点击遮罩和 `Escape` 会丢弃草稿；
**恢复默认设置**会先请求确认。

## 设置

保存在 `gp_settings_v1` 下。

| 键 | 默认值 | 说明 |
|-----|---------|------|
| `language` | `'auto'` | 设置面板界面语言（`'auto'` 跟随浏览器） |
| `gallery.enabled` | `true` | Markdown 图片画廊总开关 |
| `gallery.sources.markdown` | `true` | 按来源的开关（每个已注册来源一项） |
| `gallery.skipBadges` | `true` | 跳过徽章服务（包括 GitHub camo 代理后的徽章和 Actions 状态徽章）、表情、高度 ≤ 40 px 的图片以及两个方向都小于 80 px 的图片 |
| `gallery.upgradeFullSize` | `true` | 检测并加载链接的原始大图 |
| `gallery.download` | `true` | 查看器中以及悬停 Markdown 图片时的下载按钮 |
| `gallery.thumbnails` | `true` | 查看器中的缩略图条 |
| `gallery.loop` | `true` | 从最后一张循环到第一张 |
| `gallery.maxZoom` | `8` | 缩放上限（2× … 16×） |
| `toasts.enabled` | `true` | Toast 通知 |
| `toasts.position` | `'bottom-right'` | `bottom-right`、`bottom-left`、`top-right`、`top-left` |
| `toasts.duration` | `5000` | 自动隐藏延迟（毫秒，`0` 表示保持到手动关闭） |
| `logging.enabled` | `false` | 控制台诊断：GP 代码、模块、详情和堆栈；默认关闭 |
| `fileIcons.enabled` | `true` | 文件和文件夹图标总开关 |
| `fileIcons.folders` | `true` | 常见文件夹名的专属图标 |
| `fileIcons.specialNames` | `true` | 已知文件名的专属图标 |
| `fileAges.enabled` | `true` | 总开关；为列出的文件显示 blame 风格年龄颜色 |
| `fileAges.folders` | `true` | 同时为文件夹行着色 |
| `fileMeta.enabled` | `true` | 文件大小与下载按钮的总开关 |
| `fileMeta.sizes` | `true` | 在仓库文件列表中显示每个文件的大小 |
| `fileMeta.download` | `true` | 仓库文件列表中的下载按钮 |
| `fileMenu.enabled` | `true` | 文件上下文菜单总开关 |
| `filePreview.enabled` | `true` | 快速文件预览总开关 |
| `filePreview.rowButton` | `true` | 文件列表行中的眼睛按钮（右键菜单始终提供**预览**） |
| `filePreview.longPress` | `true` | 在文件名或 Markdown 文件链接上按住鼠标左键以打开预览 |
| `filePreview.longPressMs` | `450` | 打开预览前的按住时长（毫秒，200–2000） |
| `filePreview.longPressRing` | `true` | 按住时在指针处显示进度圆圈 |
| `translate.enabled` | `true` | 页面翻译的总开关 |
| `translate.provider` | `'google'` | `google`（免费）、`deepl`、`microsoft`、`yandex`、`openai`、`libretranslate` |
| `translate.providerConfig.<id>` | 依服务而定 | 各服务的凭据与端点（API 密钥、区域、文件夹、模型、URL） |
| `translate.targetLang` | `'auto'` | `'auto'` 跟随设置语言；否则为任一可选语言代码 |
| `translate.mode` | `'button'` | `button` 点击时翻译；`auto` 在区块滚动进入视野时翻译 |
| `translate.display` | `'replace'` | `replace` 替换原文；`below` 在原文下方显示译文 |
| `translate.reveal` | `'button'` | 替换模式：`button` 显示 **显示原文**；`hover` 在悬停或聚焦时查看原文 |
| `translate.linkLabels` | `true` | 同时翻译链接文字 |
| `translate.surfaces.<id>` | `true` | 各位置开关：`markdown`、`plaintext`、`commits`、`titles`、`preview` |
| `translate.cacheHours` | `24` | 缓存时长（小时，0 表示关闭缓存） |
| `commandPalette.enabled` | `true` | `Ctrl/⌘+K` 命令面板的总开关 |
| `commandPalette.shortcut` | `'mod+k'` | `mod+k`、`mod+shift+k`、`mod+space`、`alt+k`、`off`，或在设置页录制的组合 |
| `commandPalette.token` | `''` | 可选的 GitHub 令牌，用于私有仓库和更高限额（只发送到 `api.github.com`，不会导出） |
| `commandPalette.sources.<id>` | `true` | 来源开关：`commands`、`repositories`、`starred`、`files`、`issues`、`recent` |
| `commandPalette.sources.issues` | `true` | 当前仓库中打开的 issue 和 pull request |
| `commandPalette.hideForks` | `false` | 隐藏仓库的 fork |
| `commandPalette.hideArchived` | `false` | 隐藏已归档的仓库 |
| `commandPalette.showDetails` | `true` | 列表旁的详情面板（低于 760 px 时无论如何都会隐藏） |
| `commandPalette.cacheHours` | `6` | 仓库和文件树缓存的时长（小时，0 表示关闭缓存） |
| `commandPalette.maxResults` | `30` | 每组结果的最大行数（10–100） |

## 画廊的构建方式

画廊是一个小型框架，外加每个图片来源一个 source，因此新增来源永远不会改动画廊
本身：

| 文件 | 作用 |
|------|------|
| `src/ui/viewer.js` | 灯箱：`openViewer({ images, index, loop, thumbnails, download, minZoom, maxZoom, resolveImage, labels, onClose })`，以及 `closeViewer()` / `isViewerOpen()`。自成一体，可被任何功能复用。 |
| `src/gallery/sources.js` | 来源注册表：`registerSource`、`listSources`。 |
| `src/gallery/collect.js` | 收集：规范化、过滤（徽章/表情/小图标）、去重、数量上限。 |
| `src/gallery/index.js` | 接线：一个捕获阶段的点击监听器、生成的鼠标指针样式表、用于下载按钮的委托悬停监听器和设置监听器。 |
| `src/gallery/sources/markdown.js` | Markdown 来源：容器、图片查找、原始大小解析。 |

由于可见提示是由注册表生成的 CSS，点击处理是一个遍历实时 DOM 的委托监听器，
画廊在 GitHub 的客户端导航和 React 重新渲染后仍能工作，无需扫描循环，也无需逐图
记录状态。

### 添加来源

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

然后同时在四处添加开关：来源模块及其 import、`src/core/constants.js` 中的
`DEFAULT_GALLERY.sources.<id>`，以及**全部十个** `src/i18n/locales/*.js` 文件中的
`source.<id>` / `source.<id>Desc` 键。设置面板会自动从注册表读取新来源。

## 开发

需要 Node.js 22（见 `.nvmrc`）。

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate)
npm run icons:build        # regenerate the embedded icon subset
npm test                   # Node test runner (unit tests)
```

只编辑 `src/` 下的文件——`github-plus.user.js` 和 `github-plus.meta.js` 是生成
产物。测试和调试见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)，规则见
[CONTRIBUTING.md](CONTRIBUTING.md)，模块图和数据流见
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，改动任何可见元素前请先读
[DESIGN.md](DESIGN.md)。

## 许可证

[MIT](LICENSE)。

内置文件图标来自 Material Icon Theme（MIT）；见
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES)。

独立项目，与 GitHub, Inc. 无关联。
