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

          <button className="copy-button" onClick={() => {
            if (!finalStats) return;
            const note = `🖊 FlowJournalで${formatTime(finalStats.totalTime)}書き続けた。${finalStats.totalChars}文字（${finalStats.avgCPM}CPM）\nhttps://flow-journal.vercel.app`;
            window.open(`https://nostter.app/post?content=${encodeURIComponent(note)}`, '_blank');
          }}>
            📊 統計をNostrでシェア（本文は含まれません）
          </button>

          <button className="restart-button" onClick={handleRestart}>
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}
