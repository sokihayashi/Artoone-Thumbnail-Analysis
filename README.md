# サムネ診断ツール — アートゥーン！

アートゥーン！チャンネルのサムネイル診断・提案 Web アプリです。

## 使い方

1. **https://sokihayashi.github.io/artoone-thumbnail-analysis/** にアクセス
2. モードを選択する
   - **01 — サムネを1から考える** : 企画段階・構図ゼロから提案
   - **02 — 今ある1案をレビュー** : 良い点・問題点・修正指示を出力
   - **03 — 複数の案を見比べる** : 2枚以上を比較して最良案を選定
3. フォームに入力し、サムネ画像をアップロードして「診断を開始」

## バージョン切り替え

ヘッダーのトグルで切り替えられます。

| | 説明 |
|---|---|
| **かんたん** | 簡潔・短い返答 |
| **詳細** | 根拠・比較・代替案まで含む長めのレビュー |

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

キーを設定しない場合はアプリ上でその都度入力できます。

## デプロイ

`main` ブランチへの push で GitHub Pages に自動デプロイされます。  
GitHub リポジトリの Settings → Pages → Source を **GitHub Actions** に設定し、  
Secrets に `OPENROUTER_API_KEY` または `ANTHROPIC_API_KEY` を登録してください。
