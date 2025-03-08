# Silent Shout Challenge

マイクの音量を測定して、ランキングに参加するウェブアプリケーションです。どれだけ静かに叫べるかを競います。

## 機能

- マイクの音量をリアルタイムで測定
- 5秒間の測定中の最大音量を記録
- ユーザー名と最大音量のランキング表示
- モダンなUI/UXデザイン
- 小数点4桁までの精密な音量測定
- Vercel KVSを使用したスコアの永続化

## 技術スタック

- HTML5
- CSS3 (BEM命名規則)
- JavaScript (ES6+)
- Web Audio API
- Vite (ビルドツール)
- Vercel (ホスティング)
- Vercel KV (データストレージ)

## 開発環境のセットアップ

### 必要条件

- Node.js (v14以上)
- npm (v6以上)

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/silent-shout-challenge.git
cd silent-shout-challenge

# 依存関係のインストール
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてアプリケーションにアクセスできます。

### ビルド

```bash
npm run build
```

ビルドされたファイルは `dist` ディレクトリに出力されます。

## Vercelへのデプロイ

### 準備

1. [Vercel](https://vercel.com/)にアカウントを作成します
2. Vercel CLIをインストールします

```bash
npm install -g vercel
```

### Vercel KVの設定

1. Vercelダッシュボードで新しいプロジェクトを作成します
2. 「Storage」タブから「KV Database」を選択し、新しいKVデータベースを作成します
3. 作成したKVデータベースの接続情報を取得します
4. `.env.example`をコピーして`.env`ファイルを作成し、取得した接続情報を設定します

```bash
cp .env.example .env
```

### デプロイ

```bash
# Vercelにログイン
vercel login

# プロジェクトをデプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

または、GitHubリポジトリをVercelにインポートして、自動デプロイを設定することもできます。

### 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定します：

- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## 使い方

1. 「測定開始」ボタンをクリックします
2. マイクへのアクセスを許可します
3. Twitchのユーザー名を入力します
4. 「スタート」ボタンをクリックします
5. カウントダウン後、5秒間の測定が始まります
6. できるだけ静かに叫んでください
7. 測定結果がランキングに反映されます

## プロジェクト構造

```
silent-shout-challenge/
├── api/                  # Vercel API関数
│   ├── save-score.js     # スコア保存API
│   └── get-ranking.js    # ランキング取得API
├── src/                  # ソースコード
│   ├── js/               # JavaScriptファイル
│   │   ├── main.js       # メインのJavaScriptファイル
│   │   ├── audio.js      # オーディオ処理モジュール
│   │   ├── ranking.js    # ランキング管理モジュール
│   │   └── ui-controller.js # UI操作モジュール
│   ├── css/              # CSSファイル
│   │   └── main.css      # メインのCSSファイル
│   ├── assets/           # 画像などの静的ファイル
│   └── index.html        # メインのHTMLファイル
├── public/               # 公開ディレクトリ
├── dist/                 # ビルド出力ディレクトリ
├── node_modules/         # npmパッケージ
├── package.json          # プロジェクト設定
├── package-lock.json     # 依存関係のロックファイル
├── vite.config.js        # Viteの設定ファイル
├── vercel.json           # Vercel設定ファイル
├── .env.example          # 環境変数の例
└── README.md             # プロジェクトの説明
```

## ライセンス

ISC

## 貢献

1. このリポジトリをフォークします
2. 新しいブランチを作成します (`git checkout -b feature/amazing-feature`)
3. 変更をコミットします (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュします (`git push origin feature/amazing-feature`)
5. プルリクエストを作成します
