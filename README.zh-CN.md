# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · **中文（简体）** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

一个改进 GitHub 的用户脚本：完整的设置面板、渲染后 Markdown 的图片画廊、GitHub
列出文件时显示的彩色文件图标，以及这些文件的 blame 风格年龄着色。

> **状态：** 早期（`0.9.0`）。带即时搜索的设置面板（通用 · 画廊 · 文件图标 ·
> 文件年龄 · 备份 · 关于）、Markdown 图片画廊、彩色文件图标和 blame 风格的年龄
> 着色。计划加入更多 GitHub 改进。

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
  request、审查评论中（凡是 GitHub 渲染 `.markdown-body` 的地方）——它会在内置
  查看器中全屏打开。
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
- **GitHub 列出文件的每个地方**——仓库树及子目录、blob 头部、pull request 文件
  头部和 diff 树、提交文件列表、代码搜索、gist 和 release 附件。
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

### 设置面板

可从 GitHub 头部的齿轮按钮、头像菜单中的 **GitHub Plus 设置** 一行（就在 GitHub
自己的 **Settings** 下方），或用户脚本管理器的菜单命令打开。修改以草稿形式存在：
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
| `fileIcons.enabled` | `true` | 文件和文件夹图标总开关 |
| `fileIcons.folders` | `true` | 常见文件夹名的专属图标 |
| `fileIcons.specialNames` | `true` | 已知文件名的专属图标 |
| `fileAges.enabled` | `true` | 总开关；为列出的文件显示 blame 风格年龄颜色 |
| `fileAges.folders` | `true` | 同时为文件夹行着色 |

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
