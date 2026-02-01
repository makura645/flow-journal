# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## プロジェクト概要

ハッカソンプロジェクト「フロージャーナル」
- イベント: バイブコーディング大会 (https://428lab.connpass.com/event/382139/)
- テーマ: テキストエディタ x タイピング速度
- コンセプト: 止まると霞む、思考の流れを途切れさせないジャーナリングツール

## ドキュメント構造

```
docs/
├── design.md                      # MVP仕様（メイン設計書）
├── user-stories.md                # 3つのユースケース
└── journaling-best-practices.md  # 科学的根拠

theme/
├── ideas.md                       # 初期アイデア候補（15テーマ x 3案）
├── theme.md                       # テーマ元ネタ
└── step-sns.md                    # ボツ案（歩数課金SNS）
```

## 設計の重要な原則

### 科学的根拠に基づく設計

ジャーナリングで重要なのは「速さ」ではなく「止まらず書くこと」:
- Pennebaker式: 15-20分の連続書記が推奨
- 効果指標は没入度（深く書くこと）
- 速度を求めすぎると認知処理の余白が消え、ストレス増幅、ネガティブ反芻のリスク

参照: docs/journaling-best-practices.md

### コア仕様

詳細は docs/design.md を参照

- フローゲージ: CPMベースで思考の流れを可視化
- 霞むシステム: 止まると文字が薄くなり、書き続けると復活
- セッション: クイックモード1分 / 標準モード15分

## 実装時の注意

1. 日本語前提: CPM（Characters Per Minute）で測定
2. 1日で完成: MVP優先、オプショナル機能は後回し
3. 表現の配慮: 「消滅」ではなく「霞む」「霧に飲まれる」

## 技術スタック候補

- フロント: React / Vue / Vanilla JS
- 必須: テキストエリア + タイマー + CPM計測 + CSS
- オプショナル: Claude/GPT API（AIフォローアップ質問）
