import { useState } from 'react';
import { generateSummary } from '../services/api';
import { FEATURES } from '../constants';
import type { AISummaryResult } from '../types';

interface AISummaryProps {
  text: string;
  endedAt?: string;
}

export function AISummary({ text, endedAt }: AISummaryProps) {
  const [result, setResult] = useState<AISummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    if (!result) return;

    const formatDate = (isoString?: string) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const markdown = `# Flow Journal - ${formatDate(endedAt)}

## 要約
${result.summary.map(s => `- ${s}`).join('\n')}

## 感情
${result.emotions.join(', ')}

## フィードバック
${result.feedback}`;

    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const summary = await generateSummary(text);
      setResult(summary);
    } catch (err) {
      setError('要約の生成に失敗しました。しばらく待ってから再試行してください。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!FEATURES.AI_SUMMARY) {
    return null;
  }

  return (
    <div className="ai-summary">
      {!result && !loading && (
        <button
          className="generate-button"
          onClick={handleGenerate}
          disabled={loading || !text.trim()}
        >
          AIで振り返る
        </button>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <span>分析中...</span>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="summary-result">
          <section className="summary-section">
            <h3>要約</h3>
            <ul className="summary-list">
              {result.summary.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </section>

          <section className="summary-section">
            <h3>感情</h3>
            <div className="emotion-tags">
              {result.emotions.map((emotion, i) => (
                <span key={i} className="emotion-tag">{emotion}</span>
              ))}
            </div>
          </section>

          <section className="summary-section highlight">
            <h3>フィードバック</h3>
            <p>{result.feedback}</p>
          </section>

          <button className="copy-button" onClick={handleCopyMarkdown}>
            {copied ? 'コピーしました' : 'Markdownでコピー'}
          </button>
        </div>
      )}
    </div>
  );
}
