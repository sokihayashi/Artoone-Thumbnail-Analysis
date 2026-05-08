# アートゥーン！サムネ診断ツール

YouTubeチャンネル「アートゥーン！」向けのサムネイル診断・提案 Web アプリです。  
AIがサムネ画像や企画内容を分析し、構造化されたフィードバックを返します。

## 使い方

**https://sokihayashi.github.io/artoone-thumbnail-analysis/**

1. モードを選ぶ
   - **01 サムネを1から考える** — タイトル・概要・素材から構図・要素をゼロ提案
   - **02 今ある1案をレビュー** — 強み・問題点・最優先で直すべき箇所を診断
   - **03 複数の案を見比べる** — 2枚以上のサムネを比較して採用案を提示
2. フォームに入力し、サムネ画像をアップロード（クリックまたはドラッグ&ドロップ）
3. 「診断を開始」→ 結果がリアルタイムでストリーミング表示される

### 診断結果の見方

| ラベル | 内容 |
|---|---|
| **PRIORITY** | 最優先で直すべき点（青ストライプで強調） |
| **ISSUE** | 問題点・改善すべき箇所 |
| **STRENGTH** | 良い点 |
| **ACTION** | 修正指示・制作メモ |
| **NICE TO HAVE** | 余裕があれば対応したい点 |

画面上部の **TOP PRIORITY** カードに優先改善点がまとめて表示されます。

## バージョン切り替え

ヘッダーのトグルで切り替えられます。

| | 説明 | 向いている場面 |
|---|---|---|
| **かんたん** | 簡潔・短い返答 | 素早く確認したいとき |
| **詳細** | 根拠・比較・代替案まで含む長文 | 制作前に深掘りしたいとき |

## ローカル起動

```bash
npm install
npm run dev
```

`.env.local` に API キーを設定してください。

```
VITE_OPENROUTER_API_KEY=sk-or-...
# または
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

キーを設定しない場合はアプリ起動時に入力画面が表示されます。

```bash
npm run build   # 本番ビルド
```

## デプロイ

`main` ブランチへの push で GitHub Pages に自動デプロイされます。

1. リポジトリの Settings → Pages → Source を **GitHub Actions** に設定
2. Secrets に `OPENROUTER_API_KEY` または `ANTHROPIC_API_KEY` を登録

## 技術スタック

- Vite + React + TypeScript
- OpenRouter / Anthropic API（ストリーミング）
- GitHub Pages（GitHub Actions で自動デプロイ）
