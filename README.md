# サムネ診断ツール — アートゥーン！

アートゥーン！チャンネルのサムネイル診断・提案 Web アプリです。

## 使い方

1. 下記 URL にアクセスする  
   **https://sokihayashi.github.io/artoone-thumbnail-analysis/**
2. Anthropic API キーを入力する（初回のみ。localStorage に保存）
3. モードを選ぶ（1: 1から考える / 2: レビュー / 3: 比較）
4. フォームに入力してサムネ画像をアップロードし「診断する」

## バージョン切り替え

ヘッダーのトグルで切り替えられます。

- **ミニはやし** — 簡潔な返答版
- **ビッグ** — 詳細レビュー版（理由・比較・代替案まで）

## DLC（ミニCooさん）

過去動画データ `追加DLC_ミニCooさん_Ver1_0.json` を持っている場合、ヘッダーの **DLC** ボタンからアップロードすると過去傾向データを参照した診断が行われます。

## モデル選択

- **Opus 4.7** — 高精度・画像認識精度高め
- **Sonnet 4.6** — 標準・コスト効率よし

## ローカル起動

```bash
npm install
npm run dev
```

## デプロイ

`main` ブランチへの push で GitHub Pages に自動デプロイされます。  
GitHub リポジトリの Settings → Pages → Source を **GitHub Actions** に設定してください。