'use client';

import { useState, useCallback, useRef } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { JournalEditor } from '@/components/JournalEditor';
import { SessionStats } from '@/components/SessionStats';
import { AISummary } from '@/components/AISummary';
import { useFlowState } from '@/hooks/useFlowState';
import type { SessionStats as Stats, AISummaryResult } from '@/types';

type AppScreen = 'start' | 'writing' | 'result';

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [finalStats, setFinalStats] = useState<Stats | null>(null);
  const [finalText, setFinalText] = useState('');
  const [copied, setCopied] = useState(false);
  const aiResultRef = useRef<AISummaryResult | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}分${s}秒` : `${s}秒`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const handleCopyMarkdown = async () => {
    if (!finalStats) return;
    const text = finalText || '';
    const ai = aiResultRef.current;
    let markdown = `# Flow Journal - ${formatDate(finalStats.endedAt)}\n\n${finalStats.totalChars}文字 / 平均${finalStats.avgCPM}CPM / ${formatTime(finalStats.totalTime)}`;
    markdown += `\n\n## 原文\n${text}`;
    if (ai) {
      markdown += `\n\n## 要約\n${ai.summary.map(s => `- ${s}`).join('\n')}\n\n## 感情\n${ai.emotions.join(', ')}\n\n## フィードバック\n${ai.feedback}`;
    }
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSessionEnd = useCallback((stats: Stats) => {
    setFinalStats(stats);
    setScreen('result');
  }, []);

  const flowState = useFlowState({
    onSessionEnd: handleSessionEnd,
  });

  const handleStart = () => {
    setFinalStats(null);
    setFinalText('');
    flowState.startSession();
    setScreen('writing');
  };

  const handleEnd = () => {
    setFinalText(flowState.text);
    flowState.endSession();
  };

  const handleRestart = () => {
    setScreen('start');
    setFinalStats(null);
    setFinalText('');
  };

  return (
    <div className="app">
      {screen === 'start' && <StartScreen onStart={handleStart} />}

      {screen === 'writing' && (
        <JournalEditor
          text={flowState.text}
          onTextChange={flowState.handleTextChange}
          gaugeState={flowState.gaugeState}
          fadeState={flowState.fadeState}
          recoveryProgress={flowState.recoveryProgress}
          cpmData={flowState.cpmData}
          elapsed={flowState.timer.elapsed}
          onEnd={handleEnd}
        />
      )}

      {screen === 'result' && finalStats && (
        <div className="result-screen">
          <SessionStats stats={finalStats} />

          <div className="written-text">
            <h3>あなたが書いたこと</h3>
            <div className="text-content">{finalText || flowState.text}</div>
          </div>

          <AISummary text={finalText || flowState.text} stats={finalStats} onResult={(r) => { aiResultRef.current = r; }} />

          <button className="copy-button" onClick={handleCopyMarkdown}>
            {copied ? 'コピーしました' : 'Markdownでコピー'}
          </button>

          <div className="share-buttons">
            <button className="share-button" onClick={() => {
              if (!finalStats) return;
              const note = `🖊 FlowJournalで${formatTime(finalStats.totalTime)}、${finalStats.totalChars}文字書き続けた（${finalStats.avgCPM}CPM）\nhttps://flowj.vercel.app`;
              window.open(`https://nostter.app/post?content=${encodeURIComponent(note)}`, '_blank');
            }}>
              <svg className="nostr-icon" viewBox="0 0 256 256" width="16" height="16" fill="currentColor"><path d="M210.8 199.4c0 3.1-2.5 5.7-5.7 5.7h-68c-3.1 0-5.7-2.5-5.7-5.7v-15.5c.3-19 2.3-37.2 6.5-45.5 2.5-5 6.7-7.7 11.5-9.1 9.1-2.7 24.9-.9 31.7-1.2 0 0 20.4.8 20.4-10.7s-9.1-8.6-9.1-8.6c-10 .3-17.7-.4-22.6-2.4-8.3-3.3-8.6-9.2-8.6-11.2-.4-23.1-34.5-25.9-64.5-20.1-32.8 6.2.4 53.3.4 116.1v8.4c0 3.1-2.6 5.6-5.7 5.6H57.7c-3.1 0-5.7-2.5-5.7-5.7v-144c0-3.1 2.5-5.7 5.7-5.7h31.7c3.1 0 5.7 2.5 5.7 5.7 0 4.7 5.2 7.2 9 4.5 11.4-8.2 26-12.5 42.4-12.5 36.6 0 64.4 21.4 64.4 68.7v83.2ZM150 99.3c0-6.7-5.4-12.1-12.1-12.1s-12.1 5.4-12.1 12.1 5.4 12.1 12.1 12.1S150 106 150 99.3Z"/></svg>
              Nostrで投稿
            </button>
            <button className="share-button" onClick={() => {
              if (!finalStats) return;
              const note = `🖊 FlowJournalで${formatTime(finalStats.totalTime)}、${finalStats.totalChars}文字書き続けた（${finalStats.avgCPM}CPM）\nhttps://flowj.vercel.app`;
              window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(note)}`, '_blank');
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Xで投稿
            </button>
            <p className="share-note">統計のみで本文やAI分析は含まれません</p>
          </div>

          <button className="restart-button" onClick={handleRestart}>
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}
