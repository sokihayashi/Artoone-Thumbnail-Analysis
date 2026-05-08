# サムネ診断ツール — アートゥーン！

アートゥーン！チャンネルのサムネイル診断・提案 Web アプリです。

## 使い方

1. **https://sokihayashi.github.io/artoone-thumbnail-analysis/** にアクセス
2. API キーを入力（初回のみ。ブラウザの localStorage に保存）
   - **OpenRouter**（推奨）— 無料モデルあり。[openrouter.ai/keys](https://openrouter.ai/keys) で発行
   - **Anthropic** — [console.anthropic.com](https://console.anthropic.com/) で発行
3. モードを選択する
   - **01 — サムネを1から考える** : 企画段階・構図ゼロから提案
   - **02 — 今ある1案をレビュー** : 良い点・問題点・修正指示を出力
   - **03 — 複数の案を見比べる** : 2枚以上を比較して最良案を選定
4. フォームに入力し、サムネ画像をアップロードして「診断を開始」

## バージョン切り替え

ヘッダーのトグルで切り替えられます。

| | 説明 |
|---|---|
| **かんたん** | 簡潔・短い返答 |
| **詳細** | 根拠・比較・代替案まで含む長めのレビュー |

## モデル選択

APIキーを手動入力した場合、ヘッダーでプロバイダーとモデルを変更できます。

| プロバイダー | モデル | 特徴 |
|---|---|---|
| OpenRouter | Claude Haiku 4.5（デフォルト） | 速い・低コスト |
| OpenRouter | Claude Sonnet 4.6 | 高精度 |
| OpenRouter | Gemini 2.5 Flash | 安価 |
| OpenRouter | Nemotron Nano 12B VL | 無料 |
| Anthropic | Sonnet 4.6 | 標準 |
| Anthropic | Opus 4.7 | 最高精度 |

## ローカル起動

```bash
npm install
npm run dev
```

## デプロイ

`main` ブランチへの push で GitHub Pages に自動デプロイされます。  
GitHub リポジトリの Settings → Pages → Source を **GitHub Actions** に設定してください。
