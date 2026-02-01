'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type InvoiceData = {
  invoice_id: string;
  amount: number;
  currency: string;
  lightning_invoice: string;
  checkout_url: string;
  expires_at: number;
};

type InvoiceStatus = {
  invoice_id: string;
  status: 'New' | 'Processing' | 'Settled' | 'Expired';
  amount: number;
  currency: string;
};

export default function TopupPage() {
  const [amount, setAmount] = useState(100);
  const MIN_SATS = 100;
  const MAX_SATS = 1000;
  const [balance, setBalance] = useState<number | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [status, setStatus] = useState<InvoiceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/topup?balance=true');
      const data = await response.json();
      if (response.ok) {
        setBalance(data.balance);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const createInvoice = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!invoice) return;

    setChecking(true);
    setError(null);

    try {
      const response = await fetch(`/api/topup?invoice_id=${invoice.invoice_id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setChecking(false);
    }
  };

  const copyInvoice = async () => {
    if (!invoice) return;

    try {
      await navigator.clipboard.writeText(invoice.lightning_invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy');
    }
  };

  const formatExpiry = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('ja-JP');
  };

  return (
    <div className="topup-page">
      <div className="topup-container">
        <Link href="/" className="back-link">
          &larr; 戻る
        </Link>

        <div className="balance-display">
          <span className="balance-label">残高</span>
          <span className="balance-value">
            {balance !== null ? `$${balance.toFixed(4)}` : '...'}
          </span>
          <button className="refresh-btn" onClick={fetchBalance}>↻</button>
        </div>

        <h1 className="topup-title">Top Up</h1>
        <p className="topup-description">
          AIフィードバック用のクレジットをチャージ
        </p>

        {!invoice ? (
          <div className="amount-selector">
            <label>金額 (sats)</label>
            <div className="amount-controls">
              <input
                type="range"
                min={MIN_SATS}
                max={MAX_SATS}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="amount-slider"
              />
              <input
                type="number"
                min={MIN_SATS}
                max={MAX_SATS}
                value={amount}
                onChange={(e) => setAmount(Math.min(MAX_SATS, Math.max(MIN_SATS, Number(e.target.value) || MIN_SATS)))}
                className="amount-input"
              />
            </div>
            <div className="amount-presets">
              {[100, 200, 500, 1000].map((v) => (
                <button
                  key={v}
                  className={`preset-btn ${amount === v ? 'active' : ''}`}
                  onClick={() => setAmount(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              className="topup-button"
              onClick={createInvoice}
              disabled={loading}
            >
              {loading ? 'Creating...' : `${amount} sats で Invoice 作成`}
            </button>
          </div>
        ) : (
          <div className="invoice-card">
            <div className="invoice-header">
              <span className="invoice-amount">{invoice.amount} sats</span>
              <span className="invoice-expiry">
                有効期限: {formatExpiry(invoice.expires_at)}
              </span>
            </div>

            <div className="invoice-qr">
              <a
                href={invoice.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="checkout-link"
              >
                支払いページを開く
              </a>
            </div>

            <div className="invoice-string">
              <label>Lightning Invoice:</label>
              <div className="invoice-text">
                {invoice.lightning_invoice.slice(0, 40)}...
              </div>
              <button className="copy-btn" onClick={copyInvoice}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button
              className="check-button"
              onClick={checkStatus}
              disabled={checking}
            >
              {checking ? 'Checking...' : '支払い状況を確認'}
            </button>

            {status && (
              <div className={`status-badge status-${status.status.toLowerCase()}`}>
                Status: {status.status}
              </div>
            )}

            <button
              className="new-invoice-button"
              onClick={() => {
                setInvoice(null);
                setStatus(null);
              }}
            >
              新しい Invoice を作成
            </button>
          </div>
        )}

        {error && <div className="topup-error">{error}</div>}

        <div className="topup-info">
          <h3>料金目安 (2026/02/01時点)</h3>
          <ul>
            <li>1000 sats ≈ $0.78 (BTC=$78,000換算)</li>
            <li>gpt-4o-mini 1回 ≈ $0.0001</li>
            <li>1000 sats で約 7,800 回使用可能</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .topup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .topup-container {
          max-width: 500px;
          width: 100%;
        }

        .back-link {
          display: inline-block;
          color: var(--text-secondary);
          text-decoration: none;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--text-primary);
        }

        .balance-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .balance-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .balance-value {
          font-size: 1.5rem;
          font-weight: 500;
          color: #10b981;
          font-variant-numeric: tabular-nums;
        }

        .refresh-btn {
          margin-left: auto;
          padding: 0.25rem 0.5rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          border-color: var(--normal-color);
          color: var(--text-primary);
        }

        .topup-title {
          font-size: 2rem;
          font-weight: 300;
          margin-bottom: 0.5rem;
        }

        .topup-description {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .amount-selector {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .amount-selector label {
          display: block;
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .amount-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .amount-slider {
          flex: 1;
          height: 8px;
          -webkit-appearance: none;
          background: var(--bg-tertiary);
          border-radius: 4px;
          outline: none;
        }

        .amount-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: #f7931a;
          border-radius: 50%;
          cursor: pointer;
        }

        .amount-input {
          width: 80px;
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 1rem;
          text-align: center;
        }

        .amount-presets {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .preset-btn {
          flex: 1;
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-btn:hover {
          border-color: #f7931a;
          color: var(--text-primary);
        }

        .preset-btn.active {
          background: #f7931a;
          border-color: #f7931a;
          color: white;
        }

        .topup-button {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #f7931a 0%, #ff9500 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .topup-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .topup-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .invoice-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .invoice-amount {
          font-size: 1.5rem;
          font-weight: 500;
          color: #f7931a;
        }

        .invoice-expiry {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .invoice-qr {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .checkout-link {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
          color: var(--text-primary);
          text-decoration: none;
          transition: background 0.2s;
        }

        .checkout-link:hover {
          background: var(--border-color);
        }

        .invoice-string {
          margin-bottom: 1.5rem;
        }

        .invoice-string label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .invoice-text {
          font-family: monospace;
          font-size: 0.8rem;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          word-break: break-all;
        }

        .copy-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          border-color: var(--normal-color);
          color: var(--text-primary);
        }

        .check-button {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 1rem;
        }

        .check-button:hover:not(:disabled) {
          border-color: var(--normal-color);
        }

        .check-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status-badge {
          text-align: center;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .status-new {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .status-processing {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .status-settled {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .status-expired {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .new-invoice-button {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .new-invoice-button:hover {
          color: var(--text-primary);
        }

        .topup-error {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--stopped-color);
          border-radius: 8px;
          color: var(--stopped-color);
          text-align: center;
        }

        .topup-info {
          margin-top: 2rem;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
        }

        .topup-info h3 {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .topup-info ul {
          list-style: none;
        }

        .topup-info li {
          color: var(--text-muted);
          padding: 0.25rem 0;
          padding-left: 1rem;
          position: relative;
        }

        .topup-info li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #f7931a;
        }
      `}</style>
    </div>
  );
}
