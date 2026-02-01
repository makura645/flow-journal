'use client';

import { useState, useCallback } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { JournalEditor } from '@/components/JournalEditor';
import { SessionStats } from '@/components/SessionStats';
import { AISummary } from '@/components/AISummary';
import { useFlowState } from '@/hooks/useFlowState';
import type { SessionStats as Stats } from '@/types';

type AppScreen = 'start' | 'writing' | 'result';

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [finalStats, setFinalStats] = useState<Stats | null>(null);
  const [finalText, setFinalText] = useState('');

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
    setScreen('writing');
    setTimeout(() => {
      flowState.startSession();
    }, 0);
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

          <AISummary text={finalText || flowState.text} endedAt={finalStats.endedAt} />

          <button className="restart-button" onClick={handleRestart}>
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}
