# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · **日本語** · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.29.1-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

GitHub を改善するユーザースクリプトです。充実した設定パネル、`Ctrl/⌘+K` の
コマンドパレット、レンダリングされた Markdown の画像ギャラリー、GitHub が
ファイルを一覧するあらゆる場所でのカラー ファイル アイコン、それらのファイルの
blame 風の経過日数カラー、ファイルサイズとワンクリック ダウンロード、ファイル操作
用のコンテキスト メニュー、任意のファイルのクイックプレビュー、Conventional
Commits のコミット バッジ、ページ内テキストの翻訳を提供します。

> **ステータス:** 初期段階（`0.29.1`）。インスタント検索付きの設定パネル（一般 ·
> ギャラリー · ファイル · コミット · 翻訳 · パレット · バックアップ · このアプリについて）、
> `Ctrl/⌘+K` のコマンドパレット、Markdown 画像ギャラリー、カラー ファイル アイコン、
> blame 風の経過日数カラー、ファイルサイズとダウンロード ボタン、ファイルの
> コンテキスト メニュー、ファイルのクイックプレビュー、コミット バッジ、ページ内
> 翻訳。今後さらに GitHub の改善を追加予定です。

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
  レンダリングするすべての場所）やクイックプレビュー内のレンダリングされた
  Markdown — 組み込みビューアーで全画面表示されます。
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
  コードページのファイル ツリー サイドバー、blob・tree・blame ページのファイル
  ヘッダー、pull request のファイル ヘッダーと diff ツリー、コミットの
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

### ファイルサイズとダウンロード

GitHub のディレクトリ一覧には最終更新日時はあってもサイズはなく、保存するには一度開く必要があります。
GitHub Plus はその両方をファイルの行に追加します:

- **サイズが一目で分かる** — リポジトリの一覧にある各ファイルは、専用の列に控えめなサイズを
  表示します。サイズはビューポート付近の行だけ取得し、セッション中はキャッシュします。
  サイズを取得できないファイルには何も表示しません。
- **その場でダウンロード** — 各行の左端にファイル サイズ、右端に GitHub のアイコン ボタンと同じ
  見た目のダウンロード ボタンが並びます。ファイルは元の名前で保存されます。同一オリジンの raw
  ルートによりプライベート リポジトリでも動作し、取得がブロックされた場合は新しいタブで開きます。
  GitHub のファイルページ（blob）はすでにサイズとダウンロード ボタンを表示するため、そのままにしています。
- **API の割り当てを消費しない** — サイズは GitHub API ではなく、ファイル自身の raw アドレスへの
  HEAD リクエストで取得するため、匿名の 1 時間 60 リクエストの制限には触れません。
- **控えめ** — フォルダーの列は空のままです。機能をオフにするとサイズ、ボタン、追加した列が
  すべて消え、元の GitHub に戻ります。

### ファイルのコンテキスト メニュー

ファイルの右クリックは目的の操作への最短ルートですが、GitHub 自身のメニューには
そのどれもありません。GitHub Plus はファイルに対してそのメニューを置き換えます:

- **クイック操作** — リポジトリの一覧、ファイル ツリー サイドバー、または
  レンダリングされた Markdown のファイル リンクを右クリックすると
  **開く**、**新しいタブで開く**、**ダウンロード**、**内容をコピー**、
  **リンクをコピー**、**パスをコピー** が使えます。ファイルページや blame ページでも
  同じメニューが開きます（すでにそのページにいるため **開く** はありません）。
- **内容をコピー** — テキスト ファイルの内容はページを開かずにクリップボードへ。
  バイナリ ファイルと 1 MiB を超えるファイルは、文字化けを貼り付けたりタブを
  固まらせたりする代わりに、明確な通知で断ります。
- **パスをコピー** — リポジトリからの相対パス（`src/main.js`）。ターミナル、
  インポート文、リンクにそのまま貼れます。
- **役立つ場所だけ** — フォルダー、画像、メディア、リポジトリのファイルを指さない
  Markdown リンクを含む通常のリンクではネイティブ メニューのままです。
  ファイルを指さない右クリックは以前とまったく同じに動作します。
- **キーボードでも** — コンテキスト メニュー キーでファイルのリンク位置に同じメニューが
  開き、矢印キーで移動でき、閉じるとフォーカスが戻ります。機能をオフにすると、
  どこでもブラウザーのメニューに戻ります。

### ファイルのクイックプレビュー

ページを離れずに任意のファイルを開けます — ファイル一覧の目のボタン、
レンダリングされた Markdown のファイル リンク、またはファイルのコンテキスト
メニューの**プレビュー**から:

- **生のテキストではなくレンダリング** — Markdown はレンダリングされ、
  サニタイズされます。ソース ファイルには構文ハイライトと行番号が付き、画像・
  動画・音声はその場で再生され、PDF は GitHub のページ ポリシーがフレームを
  許可する場合にブラウザー自身のビューアーで開きます。それ以外 — ページが
  ブロックした PDF を含む — は壊れたフレームではなく、**GitHub で開く**と
  **ダウンロード**を備えた正直なカードを表示します。
- **フォルダー内を移動** — 同じディレクトリのファイルがセットになり、前へ/次へ
  ボタンと矢印キーで切り替えられます。現在位置はフッターに表示されます。
- **長押しでプレビュー** — 一覧のファイル名、またはレンダリングされた Markdown
  （クイックプレビュー内を含む）のファイル リンクの上でマウスの左ボタンを押し続けると
  プレビューが開きます。
  長押し時間（既定 450 ms）とポインター位置の進行サークルは設定で変更できます。
  短いクリックはこれまでどおりファイルを開き、ドラッグやテキスト選択では
  キャンセルされます。
- **ヘッダーの操作** — GitHub でファイルを開く、生の内容・リンク・パスをコピー
  する、元のファイル名でダウンロードする。
- **Markdown: プレビューまたはソース** — セグメント コントロールで、レンダリング
  された Markdown と元のテキスト（Markdown としてハイライト）を切り替えます。
- **プライベート リポジトリでも安全** — 相対画像とリンクは同一オリジンの raw
  ルートで解決されるため、プライベートな README でも画像が表示されます。
  Markdown はサニタイズされ、外部画像は referrer なしで読み込まれます。
- **正直な上限** — テキストと Markdown は 2 MiB、PDF は 25 MiB まで、
  ハイライトにも上限があり、巨大なファイルでタブが固まりません。上限を超えると、
  カードから GitHub と生ファイルへ移動できます。

### コミット バッジ

Conventional Commits 形式のコミット件名では、`type(scope):` プレフィックスが
1 つのラベルとしてページに表示されます。

- **2 トーンの 1 つのラベル** — 型は色付きのセグメント、スコープは控えめな
  セグメントで、1 つの角丸の輪郭に収まり、その後に控えめなコロンが続きます。
  `fix(parser): handle empty input` がひと目で読め、件名の文字は 1 文字も
  変わりません。
- **種類ごとの色、それ以外には誠実に** — `feat`、`fix`、`docs`、`style`、
  `refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert` にはそれぞれ
  専用の色があり、それ以外の小文字の型は中立色になります (装飾しないことも
  できます)。`!` 付きのプレフィックスには破壊的変更の赤いマーカーが付きます。
- **GitHub が件名を表示するすべての場所** — コミット履歴、プルリクエストの
  **Commits** タブ、単一コミットのページ、リポジトリ ホームの最新コミット
  ブロック、クラシックなコミット ビュー。テキストは変わらないため、コピー、
  検索、翻訳はこれまでどおりに機能し、機能をオフにすると GitHub 本来の表示に
  戻ります。

### 翻訳

ページのテキストをマークアップを壊さずに翻訳します — README、Issue や
ディスカッション、プルリクエスト、コメント、コミット メッセージ、タイトル、
クイックプレビューで開いた Markdown ファイル:

- **テキストのそばにボタン** — README のファイル ヘッダー、コメントのアクション
  行、コミットや Issue のタイトル。GitHub にヘッダーがない場合は、テキストの
  上に小さなバーが表示されます。
- **マークアップはそのまま** — リンク、画像、インライン コード、タスクの
  チェックボックス、強調はそのまま機能します。翻訳が置き換えるのはテキスト
  ブロックだけで、周囲の構造には触れません。
- **ボタンまたは自動** — 既定ではクリックするまで何も送信しません。自動モード
  ではブロックが画面に入ると翻訳され、**原文を表示** ボタンは残ります。
- **その場または下に** — 原文を置き換えるか、下に訳文を表示します。
  **原文を表示** で正確な原文に戻り、ホバー表示ではポインターまたはフォーカスが
  ブロック内にある間だけ原文を確認できます。
- **プレーンテキストも** — コードとして表示されるライセンスや通知のファイル（LICENSE、COPYING）にも同じボタンが出ます。訳文はファイルの下に表示され、コード自体は書き換えません。
- **6 つのプロバイダー** — 既定は無料の Google（キー不要、非公式、レート制限
  あり）。ほかに DeepL、Microsoft、Yandex、OpenAI 互換エンドポイント、自前の
  LibreTranslate を選べます。翻訳するテキストは選択したサービスに送信され、
  API キーはこのブラウザーにのみ保存されるため、設定のバックアップに含まれます。
- **キャッシュ** — 訳文は既定で 24 時間再利用され（設定可能、0 で無効）、設定
  ページから消去できます。

### コマンドパレット

どの GitHub ページでも `Ctrl/⌘+K` を押すと、そこで行うすべてを対象にした 1 つの
検索フィールドが開きます:

- **現在地から始まる** — リポジトリのページでは、そのリポジトリがすでにパスに
  入った状態でパレットが開くため、最初の一覧はそのリポジトリのページです。
- **`Tab` で深く進む** — 入力欄はパス（`owner / repo / フォルダー / クエリ`）です。
  リポジトリの行で `Tab` を押すとパスに追加され、フォルダーの行でもう一度 `Tab` を
  押すとそのフォルダーに入ります。一覧はそのフォルダーのファイルになり、パスは
  現在地からの相対表示になり、`Tab` はツリーが許す限り深く進めます。
  入力欄が空のときは `→` と `←` も同じ働きをするので、矢印キーだけでパスをたどれます。
  `Backspace` で
  最後の階層を削除、`Ctrl/⌘+Backspace` でパスとクエリを消去、パスの区間をクリック
  するとそれより下の階層をすべて破棄します。
- **自分のリポジトリ** — 所有するすべてのリポジトリ。自分のものが先頭で、行に
  スター、言語、最終 push、公開範囲が表示されます。`@` を入力するとリポジトリ
  だけを検索します。
- **スター付きリポジトリ** — 何度も戻ってくるプロジェクト。自分のリポジトリの後に
  並び、スターで示されます。
- **パス内のリポジトリのファイル** — `/` でそのすべてのパス、または一致する
  クエリを表示します。フォルダーの行には印が付き、`Tab` で階層として開けます。
  ファイルは閲覧中のリビジョンで GitHub 上に開きます。
- **オープンな issue と pull request** — `#` でそのリポジトリのオープンな issue と
  pull request を表示します。issue または pull request のバッジ、作成者、更新日時が
  付きます。タイトル、番号、作成者で検索できます。リポジトリの Issues または
  Pull requests の行で `Tab` を押すと、`#` を入力せずにその一覧を独立した階層と
  して開けます。
- **寛容なマッチング** — クエリは大文字小文字とラテン語のアクセントを無視し
  （`cafe` で `Café` が見つかります）、語頭と語全体を優先し、空白で分割して
  すべての語を必要とします。
- **ページを行として表示** — パス内のリポジトリ自身のページ（Code、Issues、Pull
  requests、新しいイシュー、変更を比較、Actions、Projects、Discussions、Releases、
  Wiki、Security、Insights、所有していれば Settings）、またはルートではアカウントの
  ページ（プロフィール、リポジトリ、スター、新しいリポジトリ、通知、gists、
  GitHub の設定、ダッシュボード）が 1 行ずつ並びます。リポジトリの行には `移動` の
  ヒントが付き、GitHub 検索の行が各クエリの最後に並びます。パス内ではコード、
  `#` では issue、`@` とパス外の自由なクエリではリポジトリを検索します。
- **GitHub Plus の操作** — パネルを開く、機能を切り替える、キャッシュを更新する。
  `>` でコマンドのみ表示します。
- **お気に入りと最近使った項目** — よく使うものは `Alt+P` でピン留めできます。
  ピン留めした行はスターが付いて先頭に並びます（空の一覧でも検索結果でも）。最近
  開いた行は次回開いたときに先頭へ戻ります（GitHub アカウントごと）。
- **各行の操作** — 行を右クリックするか `Shift+F10` で、開く、新しいタブで開く、
  リンク・パス・クローン用アドレス・issue 番号のコピー、ピン留めと解除ができます。
- **高速で控えめ** — パレットはキャッシュ済みの一覧をすぐに表示し、バックグラウンド
  で更新しながら選択行を保ちます。結果は ETag 付きでセッション中も再読み込み後も
  キャッシュされるため、API の割り当てを消費しません。トークンがなくても公開
  データを読み取り、すべてのコマンドが使えます。
- **任意の GitHub トークン** — パレットの設定ページで追加すると、プライベート
  リポジトリと完全な一覧を表示できます（1 時間 60 回ではなく 5,000 回）。トークンは
  使用前に検証され、このブラウザーにのみ保存され、バックアップには決して書き込まれ
  ず、`api.github.com` にだけ送信されます。キャッシュはアカウントごとに分かれる
  ため、アカウントを切り替えても他人のリポジトリが表示されることはありません。
- **キーボード優先** — `↑`/`↓` で移動、`Enter` で開く、`Ctrl/⌘+Enter` で新しい
  タブに開く、`Tab` でリポジトリ、フォルダー、issue 一覧に入る、`←`/`→` でパスをたどる、`Backspace` でパスの階層を
  戻る、`Alt+P` で
  ピン留め、`Ctrl/⌘+C` で行をコピー、`?` ですべてのキーとプレフィックスを表示、
  `Esc` で閉じます（ヘルプが先）。コメントや README のエディターで入力中は邪魔を
  せず、ナビゲーション時には自動で閉じます。ショートカットはプリセットか、
  パレットの設定ページで記録した任意の組み合わせです。

### 設定パネル

アバター メニューの **GitHub Plus の設定** 行（GitHub 自身の **Settings** の
すぐ下）、パレットの設定コマンド、またはユーザースクリプト マネージャーの
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
| `logging.enabled` | `false` | コンソール診断（GP コード、モジュール、詳細、スタック）。既定ではオフ |
| `fileIcons.enabled` | `true` | ファイルとフォルダーのアイコンのマスター スイッチ |
| `fileIcons.folders` | `true` | 一般的なフォルダー名の専用アイコン |
| `fileIcons.specialNames` | `true` | 既知のファイル名の専用アイコン |
| `fileAges.enabled` | `true` | マスター スイッチ。一覧のファイルに blame 風の経過日数カラーを付ける |
| `fileAges.folders` | `true` | フォルダーの行にも色を付ける |
| `fileMeta.enabled` | `true` | ファイルサイズとダウンロード ボタンの総合スイッチ |
| `fileMeta.sizes` | `true` | リポジトリのファイル一覧に各ファイルのサイズを表示 |
| `fileMeta.download` | `true` | リポジトリのファイル一覧のダウンロード ボタン |
| `fileMenu.enabled` | `true` | ファイルのコンテキスト メニューのマスター スイッチ |
| `filePreview.enabled` | `true` | ファイルのクイックプレビューのマスター スイッチ |
| `filePreview.rowButton` | `true` | ファイル一覧の行に目のボタンを表示（コンテキスト メニューでは常に**プレビュー**を選べます） |
| `filePreview.longPress` | `true` | ファイル名または Markdown のファイル リンクをマウスの左ボタンで長押ししてプレビューを開く |
| `filePreview.longPressMs` | `450` | プレビューが開くまでの長押し時間（ミリ秒、200–2000） |
| `filePreview.longPressRing` | `true` | 長押し中にポインター位置へ表示する進行サークル |
| `commitBadges.enabled` | `true` | Conventional Commits バッジのメイン スイッチ |
| `commitBadges.unknownTypes` | `true` | 慣例的なセット以外の小文字の型にもスタイルを適用 |
| `commitBadges.breaking` | `true` | `!` 付きの破壊的変更プレフィックスに赤いマーカーを表示 |
| `translate.enabled` | `true` | ページ翻訳のマスター スイッチ |
| `translate.provider` | `'google'` | `google`（無料）、`deepl`、`microsoft`、`yandex`、`openai`、`libretranslate` |
| `translate.providerConfig.<id>` | プロバイダーごと | プロバイダー別の認証情報とエンドポイント（API キー、リージョン、フォルダー、モデル、URL） |
| `translate.targetLang` | `'auto'` | `'auto'` は設定の言語に従う。それ以外は提供される言語コード |
| `translate.mode` | `'button'` | `button` はクリック時に翻訳。`auto` はブロックが画面に入ると翻訳 |
| `translate.display` | `'replace'` | `replace` は原文を置換。`below` は原文の下に訳文を表示 |
| `translate.reveal` | `'button'` | 置換モード: `button` は **原文を表示**。`hover` はホバーまたはフォーカスで原文を表示 |
| `translate.linkLabels` | `true` | リンクのテキストも翻訳 |
| `translate.surfaces.<id>` | `true` | 場所ごとのスイッチ: `markdown`、`plaintext`、`commits`、`titles`、`preview` |
| `translate.cacheHours` | `24` | キャッシュの保持時間（時間、0 で無効） |
| `commandPalette.enabled` | `true` | `Ctrl/⌘+K` コマンドパレットのマスター スイッチ |
| `commandPalette.shortcut` | `'mod+k'` | `mod+k`、`mod+shift+k`、`mod+space`、`alt+k`、`off`、または設定ページで記録した組み合わせ |
| `commandPalette.token` | `''` | プライベート リポジトリと高い制限のための任意の GitHub トークン（`api.github.com` にのみ送信、エクスポートされません） |
| `commandPalette.sources.<id>` | `true` | ソースのスイッチ: `commands`、`repositories`、`starred`、`files`、`issues`、`recent` |
| `commandPalette.sources.issues` | `true` | 現在のリポジトリのオープンな issue と pull request |
| `commandPalette.hideForks` | `false` | リポジトリのフォークを隠す |
| `commandPalette.hideArchived` | `false` | アーカイブ済みリポジトリを隠す |
| `commandPalette.cacheHours` | `6` | リポジトリとファイル ツリーのキャッシュ保持時間（時間、0 で無効） |
| `commandPalette.maxResults` | `30` | 結果セットあたりの最大行数（10–100） |

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
