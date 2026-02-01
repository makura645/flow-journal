# PayPerQ 使い方ガイド

登録不要・サブスク不要の従量課金AIサービス。

## 公式ドキュメント

- **公式サイト**: https://ppq.ai
- **API Docs**: https://ppq.ai/api-docs
- **Pricing**: https://ppq.ai/pricing
- **Topup API**: https://ppq.ai/api-topups

---

## 1. APIキーの入手

### 手順

1. https://ppq.ai にアクセス
2. 自動的にCredit IDとAPIキーが発行される（登録不要）
3. 左メニュー「Get an API Key!」または https://ppq.ai/api-docs でAPIキー確認

### APIキー形式

```
sk-xxxxxxxxxx
```

**注意**: `sk-` で始まる（`ppq_`ではない）

### 重要: Credit IDの保存

- Credit ID（例: `9ace6732-0195-49fc-9be2-763f2be05735`）はブラウザに保存される
- ブラウザデータが消えると復旧に必要なので、どこかにメモしておく
- 復旧方法: 「How it Works / FAQ」セクションから

---

## 2. 残高確認

**残高確認専用のAPIは存在しない。**

代わりに小さなリクエストを送って確認:

```bash
curl -s https://api.ppq.ai/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-YOUR_API_KEY" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 1}' | jq .
```

- **正常レスポンス** → 残高あり
- **エラー** → 残高不足
  ```json
  {"error": "Payment Required", "message": "Insufficient balance"}
  ```

---

## 3. チャージ（Topup）

### Web UIからチャージ

1. https://ppq.ai で残高ボタン（$0.00）をクリック
2. 「Add Funds」を選択
3. 支払い方法を選択:
   - **Bitcoin Lightning** (5%ボーナス)
   - クレジットカード
   - USDT/USDC
   - Monero, Litecoin, Ethereum, Solana等

4. 金額を入力（最低$0.10から）
5. 支払い実行

### API経由でチャージ（Lightning）

#### Invoice作成

```bash
curl -s -X POST https://api.ppq.ai/topup/create/btc-lightning \
  -H "Authorization: Bearer sk-YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 0.1, "currency": "USD"}' | jq .
```

**パラメータ**:
- `amount`: 金額
- `currency`: `USD` / `SATS` / `BTC`

**レスポンス例**:
```json
{
  "invoice_id": "HcrwbTp8Ux2n5pdXn6EZ9H",
  "amount": 0.1,
  "currency": "USD",
  "lightning_invoice": "lnbc1270n1p5hacc...",
  "crypto_amount_due": 0.00000127,
  "checkout_url": "https://btcpay0.voltageapp.io/i/...",
  "expires_at": 1769924230
}
```

**料金目安**: $0.10 ≈ 127 sats

#### Invoice状態確認

```bash
curl -s -X GET "https://api.ppq.ai/topup/status/{invoice_id}" \
  -H "Authorization: Bearer sk-YOUR_API_KEY" | jq .
```

**レスポンス例（支払い完了時）**:
```json
{
  "invoice_id": "HcrwbTp8Ux2n5pdXn6EZ9H",
  "status": "Settled",
  "amount": 0.1,
  "currency": "USD",
  "payment_method": "Bitcoin Lightning",
  "amount_paid": 0.00000127,
  "amount_due": 0
}
```

**ステータス**:
- `New` - 未払い
- `Processing` - 処理中
- `Settled` - 支払い完了
- `Expired` - 期限切れ

#### 支払い方法一覧

| メソッド | エンドポイント | 備考 |
|---------|---------------|------|
| Lightning | `/topup/create/btc-lightning` | 5%ボーナス |
| Bitcoin On-chain | `/topup/create/btc` | |
| Litecoin | `/topup/create/ltc` | |
| Liquid Bitcoin | `/topup/create/lbtc` | |
| Monero | `/topup/create/xmr` | |

---

## 4. API利用

### Base URL

```
https://api.ppq.ai
```

### Chat Completions（OpenAI互換）

```bash
curl -s https://api.ppq.ai/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-YOUR_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }' | jq .
```

### 利用可能モデル（抜粋）

| モデル | Input | Output |
|--------|-------|--------|
| gpt-4o | $2.50/1M | $10.00/1M |
| gpt-4o-mini | $0.15/1M | $0.60/1M |
| claude-sonnet-4.5 | $3.00/1M | $15.00/1M |
| claude-haiku-4.5 | $1.00/1M | $5.00/1M |
| gemini-2.5-flash | $0.21/1M | $1.75/1M |

全モデル一覧: https://ppq.ai/pricing

---

## 5. 環境変数設定

```bash
export PAYPERQ_API_KEY="sk-YOUR_API_KEY"

# OpenAI互換ツールで使用する場合
export OPENAI_API_KEY="sk-YOUR_API_KEY"
export OPENAI_BASE_URL="https://api.ppq.ai"
```

---

## 料金目安

- 1クエリ（gpt-4o-mini）: 約$0.000003
- $0.10で数百クエリ可能
- $1で約50回のGPT-4oクエリ
