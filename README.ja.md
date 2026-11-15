# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · **日本語** · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

GitHub を改善するユーザースクリプトです。充実した設定パネル、レンダリングされた
Markdown の画像ギャラリー、GitHub がファイルを一覧するあらゆる場所でのカラー
ファイル アイコン、そしてそれらのファイルの blame 風の経過日数カラーを提供します。

> **ステータス:** 初期段階（`0.9.0`）。インスタント検索付きの設定パネル（一般 ·
> ギャラリー · ファイル アイコン · ファイルの経過日数 · バックアップ · このアプリ
> について）、Markdown 画像ギャラリー、カラー ファイル アイコン、blame 風の経過
> 日数カラー。今後さらに GitHub の改善を追加予定です。

> スクリプトの `@updateURL` / `@downloadURL` は GitHub の `main` を指している
> ため、下のインストール URL は常に最新ビルドにつながります。

## クイック インストール

1. ユーザースクリプト マネージャーをインストールします（[Tampermonkey](https://www.tampermonkey.net/)、
   [Violentmonkey](https://violentmonkey.github.io/)、
   [ScriptCat](https://scriptcat.org/) を推奨）。
2. GitHub からスクリプトをインストールします（下の raw URL）。

**インストール URL（GitHub — 最新）:**

```
https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)

### URL からインストール（ダッシュボード）

| マネージャー | 手順 |
|---------|------|
| Tampermonkey | ダッシュボード → **Utilities** → **Install from URL** |
| Violentmonkey | ダッシュボード → **+** → **Install from URL** |
| Greasemonkey | アドオンのメニュー → **New User Script** → raw URL を貼り付け |
| ScriptCat | [拡張機能](https://scriptcat.org/)をインストールし、GitHub の raw URL で **Install from URL** |

### 手動インストール

1. このリポジトリのビルド済み [`github-plus.user.js`](https://github.com/NemoKing1210/github-plus/blob/main/github-plus.user.js) を開きます（またはクローン後に `npm run build` を実行）。
2. ファイルの内容をすべてコピーします。
3. ユーザースクリプト マネージャーで新しいスクリプトを作成し、コードを貼り付けます。
4. 保存してスクリプトを有効にします。

## 更新

スクリプトには GitHub の raw ファイルを指す `@updateURL` と `@downloadURL` の
メタデータが含まれているため、対応マネージャーでは自動的に更新されます。

メンテナー向けのリリース手順:
[docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing) を参照して
ください。

## 機能

### Markdown の画像ギャラリー

GitHub 上のレンダリングされた Markdown コンテナーはそれぞれ 1 つのギャラリー
セットになります:

- **任意の画像をクリック** — リポジトリの README、`.md` ファイルの表示、wiki
  ページ、issue、pull request、レビュー コメント（GitHub が `.markdown-body` を
  レンダリングするすべての場所）— 組み込みビューアーで全画面表示されます。
- **セット全体を閲覧** — `←`/`→`（または画面上の矢印）で同じコンテナーの他の画像
  へ移動し、中央のサムネイル ストリップでどこへでもジャンプでき、カウンターが
  現在位置を示します。
- **ズームとパン** — ホイール、`+`/`−`、ダブルクリック、ピンチで設定した上限まで
  拡大できます。どのズームでもドラッグで画像を動かせ、`0` でリセット、`r` で回転
  します。隣接画像を先読みするので閲覧はすぐに切り替わります。
- **必要なときに原寸** — 画像がより大きなファイル（`/blob/` ページの背後にある
  リポジトリ ファイル、アップロードされた添付、任意の画像 URL）にリンクしている
  場合、そのファイルを試して差し替えます。利用できない場合も壊れた画像にはならず、
  元の解像度が得られます。
- **表示中の画像をダウンロード** — Markdown 画像にマウスを合わせるとダウンロード
  ボタンが表示され、ビューアーのツールバーにも用意されています。ファイルは元の
  名前で保存され（プロキシのアドレスは元のファイル名に戻されます）、1 つの設定で
  両方のボタンを隠せます。
- **既定で控えめ** — バッジ、ステータス スニペット、絵文字、極小アイコンは
  ギャラリーの枠を消費しません。画像は GitHub 本来の見た目を保ち（ギャラリーが
  開くことを示すのはカーソルだけ）、修飾キー付きクリック（Ctrl/Cmd/Shift/Alt）と
  中クリックは GitHub に任せるので、新しいタブでファイルを開く動作はこれまでどおり
  です。
- **テーマ対応** — ギャラリーと設定パネルは GitHub 自身の色変数を使うため、選択中
  のテーマ（ライト、ダーク、ディム）に従います。

### ファイル アイコン

GitHub はすべてのファイルとフォルダーを同じ灰色のグリフで描くため、名前を読むまで
`.ts` と `.css` は同じに見えます。GitHub Plus はそれらを色分けします:

- **拡張子による種類** — 言語、設定とデータ形式、画像、メディア、アーカイブ、
  ドキュメントに専用アイコンを付けます。`.d.ts` や `.spec.ts` のような複合拡張子は
  基本拡張子より先に照合されます。
- **既知のファイル名** — `Dockerfile`、`package.json`、`README`、`.gitignore`、
  `tsconfig.json` などに専用アイコンを付けます。
- **フォルダーの役割** — `src`、`dist`、`node_modules`、`docs`、`.github`、
  `components`、`utils` などの一般的なフォルダーもマークします。
- **GitHub がファイルを一覧するあらゆる場所** — リポジトリ ツリーとサブフォルダー、
  blob ヘッダー、pull request のファイル ヘッダーと diff ツリー、コミットの
  ファイル一覧、コード検索、gist、リリース アセット。
- **控えめ** — GitHub ネイティブのグリフを隠してその場で置き換えます。レイアウト
  変更も余計な枠もなく、機能を無効にすれば GitHub は元の状態に戻ります。

アイコンは [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
（MIT）の厳選されたサブセットです。帰属表示は
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES) にあります。

### ファイルの経過日数

GitHub は各ファイルが最後に変更されてからの時間をすでに表示しますが、ひと目では
どの日付も同じに見えます。GitHub Plus は blame の凡例を借りて、日付のテキスト
そのものを色付けします:

- **ひと目で経過日数** — 最新の日付は暖色（ダーク テーマでは `#ffd78d`、ライト
  では GitHub のアテンション ゴールド）で、古い日付はテーマの落ち着いたグレーへ
  薄れていくため、4 か月前のファイルはすでに古く見えます。スケールは意図的に現在
  寄りで、日・週・月は区別でき、1 年を超えると単なるグレーになります。ライトと
  ダークのテーマにはそれぞれ専用の色域があるため、どちらでも色は鮮やかで読みやすい
  ままです。
- **レイアウトは変わりません** — 日付は GitHub 自身のテキスト、相対表現、ツール
  チップを保ち、変わるのは色だけです。行が再配置されることはなく、アクセシブルな
  ラベルも GitHub が描画したもののままです。
- **ファイルとフォルダー** — フォルダーの行も色付けされます（日付はその最終変更を
  示します）。設定でファイルのみに制限できます。
- **控えめ** — 機能を無効にすると GitHub 本来の日付色に戻り、痕跡は残りません。

### 設定パネル

GitHub ヘッダーの歯車ボタン、アバター メニューの **GitHub Plus の設定** 行
（GitHub 自身の **Settings** のすぐ下）、またはユーザースクリプト マネージャーの
メニュー コマンドから開けます。変更は下書きです: **保存** を押すまで何も保存
されません。**キャンセル**、背景のクリック、`Escape` で下書きを破棄し、
**デフォルトに戻す** は先に確認を求めます。

## 設定

`gp_settings_v1` に保存されます。

| キー | 既定値 | 説明 |
|-----|---------|------|
| `language` | `'auto'` | 設定パネルの UI 言語（`'auto'` はブラウザーに従う） |
| `gallery.enabled` | `true` | Markdown 画像ギャラリーのマスター スイッチ |
| `gallery.sources.markdown` | `true` | ソースごとのスイッチ（登録済みソースごとに 1 項目） |
| `gallery.skipBadges` | `true` | バッジ サービス（GitHub の camo プロキシ背後のバッジや Actions ステータス バッジを含む）、絵文字、高さ ≤ 40 px の画像、両軸とも 80 px 未満の画像をスキップ |
| `gallery.upgradeFullSize` | `true` | リンクされた原寸画像を試して読み込む |
| `gallery.download` | `true` | ビューアー内と Markdown 画像のホバー時のダウンロードボタン |
| `gallery.thumbnails` | `true` | ビューアーのサムネイル ストリップ |
| `gallery.loop` | `true` | 最後の画像から最初へ循環 |
| `gallery.maxZoom` | `8` | ズーム上限（2× … 16×） |
| `toasts.enabled` | `true` | トースト通知 |
| `toasts.position` | `'bottom-right'` | `bottom-right`、`bottom-left`、`top-right`、`top-left` |
| `toasts.duration` | `5000` | 自動非表示までの遅延（ミリ秒、`0` は閉じるまで表示） |
| `fileIcons.enabled` | `true` | ファイルとフォルダーのアイコンのマスター スイッチ |
| `fileIcons.folders` | `true` | 一般的なフォルダー名の専用アイコン |
| `fileIcons.specialNames` | `true` | 既知のファイル名の専用アイコン |
| `fileAges.enabled` | `true` | マスター スイッチ。一覧のファイルに blame 風の経過日数カラーを付ける |
| `fileAges.folders` | `true` | フォルダーの行にも色を付ける |

## ギャラリーの仕組み

ギャラリーは小さなフレームワークと、画像が存在する場所ごとの 1 つのソースで構成
されているため、場所を追加してもギャラリー自体には触れません:

| ファイル | 役割 |
|------|------|
| `src/ui/viewer.js` | ライトボックス: `openViewer({ images, index, loop, thumbnails, download, minZoom, maxZoom, resolveImage, labels, onClose })` と `closeViewer()` / `isViewerOpen()`。自己完結しており、どの機能からも再利用できます。 |
| `src/gallery/sources.js` | ソース レジストリ: `registerSource`、`listSources`。 |
| `src/gallery/collect.js` | 収集: 正規化、フィルタリング（バッジ/絵文字/小さいアイコン）、重複排除、上限。 |
| `src/gallery/index.js` | 配線: キャプチャ フェーズのクリック リスナー 1 つ、生成されるカーソル スタイルシート、ダウンロード ボタン用の委譲ホバー リスナー、設定リスナー。 |
| `src/gallery/sources/markdown.js` | Markdown ソース: コンテナー、画像検索、原寸解決。 |

アフォーダンスはレジストリから生成された CSS で、クリック処理は生きた DOM を
たどる 1 つの委譲リスナーなので、ギャラリーはスキャン ループや画像ごとの状態管理
なしで、GitHub のクライアント側ナビゲーションや React の再レンダリング後も動作
します。

### ソースを追加する

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

次に 4 か所を同時に更新します: ソース モジュールとその import、
`src/core/constants.js` の `DEFAULT_GALLERY.sources.<id>`、そして **10 個すべての**
`src/i18n/locales/*.js` の `source.<id>` / `source.<id>Desc` キーです。設定パネルは
レジストリから新しいソースを自動的に取得します。

## 開発

Node.js 22 が必要です（`.nvmrc` を参照）。

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate)
npm run icons:build        # regenerate the embedded icon subset
npm test                   # Node test runner (unit tests)
```

編集するのは `src/` 配下のファイルだけです — `github-plus.user.js` と
`github-plus.meta.js` は生成物です。テストとデバッグは
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)、ルールは
[CONTRIBUTING.md](CONTRIBUTING.md)、モジュール マップとデータ フローは
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)、見える要素に触れる前に
[DESIGN.md](DESIGN.md) を参照してください。

## ライセンス

[MIT](LICENSE)。

同梱のファイル アイコンは Material Icon Theme（MIT）由来です。詳細は
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES) を参照してください。

GitHub, Inc. とは無関係の独立したプロジェクトです。
