---
marp: true
theme: default
paginate: true
backgroundColor: #2d2a24
color: #e6dfd3
style: |
  section {
    font-family: 'Noto Sans JP', sans-serif;
  }
  h1 {
    color: #c9a87c;
  }
  h2 {
    color: #a8c4a0;
  }
  code {
    background: #3d3830;
  }
  strong {
    color: #e8b87d;
  }
---

## 開発環境

- **Claude Code**
- **少しCodex**
- **VSCode**

---

## 選んだテーマ

**テキストエディタ x タイピング速度**

> 元の発想例：入力速度が下がると文字が薄くなる

---

## これ何？

- 止まると文字が**霞む**ジャーナリングツール
- 書き続ければ**復活**する
- 終わったらAIによるフィードバック

---

## ジャーナリングとは？

頭に浮かんだことを、そのまま書き出すこと

- モヤモヤした気持ちが**整理**される
- **ストレス軽減**、不安の解消に効果あり
- 大事なのは**止まらず書き続ける**こと
- 上手く書く必要はない

---

## どうやって作った？

1. **アイデア出し** → 各テーマ3案ずつ出してもらって選ぶ（1時間）
2. **リサーチ・設計** → 科学的根拠を調査、MVP仕様を整理（1時間）
3. **実装** → React + TypeScript + OpenAI API（30分）
4. **スライド作成**（10分）

---

<!-- _backgroundColor: #1a1a1a -->

# デモ

<!--
1. 1分モードで書く
2. わざと止まる → 霧が出る
3. 書く → 復活
4. 終了 → AI要約見せる
-->

---

## 工夫した点
- Claude CodeからCodexに聞いてもらう
- Playwright MCPでUIデバッグしてもらう
---

# ありがとうございました
