import { useState } from 'react';
import { generateSummary } from '../services/api';
import { FEATURES } from '../constants';
import type { AISummaryResult, SessionStats } from '../types';

interface AISummaryProps {
  text: string;
  stats: SessionStats;
  onResult?: (result: AISummaryResult) => void;
}

export function AISummary({ text, stats, onResult }: AISummaryProps) {
  const [result, setResult] = useState<AISummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const summary = await generateSummary(text, stats);
      setResult(summary);
      onResult?.(summary);
    } catch {
      setError('要約の生成に失敗しました。しばらく待ってから再試行してください。');
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

        </div>
      )}
    </div>
  );
}
