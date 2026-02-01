import { useState, useCallback, useRef } from 'react';
import { useCPM } from './useCPM';
import { useTimer } from './useTimer';
import { useFadeEffect } from './useFadeEffect';
import {
  CPM_THRESHOLDS,
  GAUGE_MIN,
  GAUGE_MAX,
  GAUGE_INITIAL,
  FADE_RECOVERY_GAUGE,
} from '../constants';
import { getFlowState, getGaugeChange } from '../utils/flowCalculations';
import type { SessionPhase, FlowState, SessionStats, FlowGaugeState } from '../types';

interface UseFlowStateOptions {
  onSessionEnd: (stats: SessionStats) => void;
}

export function useFlowState({ onSessionEnd }: UseFlowStateOptions) {
  const [phase, setPhase] = useState<SessionPhase>('start');
  const [text, setText] = useState('');
  const [gauge, setGauge] = useState(GAUGE_INITIAL);
  const [flowState, setFlowState] = useState<FlowState>('stopped');

  // Stats tracking
  const statsRef = useRef({
    maxCPM: 0,
    flowTimeSeconds: 0,
    fadeRecoveries: 0,
    cpmSum: 0,
    cpmCount: 0,
  });

  const lastTextLengthRef = useRef(0);

  // End session handler
  const handleSessionEnd = useCallback((reason: 'fadeDeath' | 'manual') => {
    setPhase('ended');

    const stats = statsRef.current;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;

    onSessionEnd({
      totalChars: text.length,
      totalWords: words,
      avgCPM: stats.cpmCount > 0 ? Math.round(stats.cpmSum / stats.cpmCount) : 0,
      maxCPM: stats.maxCPM,
      flowTime: stats.flowTimeSeconds,
      totalTime: stats.cpmCount, // timer.elapsedだとタイミングずれで100%超えるバグがあるため
      fadeRecoveries: stats.fadeRecoveries,
      endReason: reason,
      endedAt: new Date().toISOString(),
    });
  }, [text, onSessionEnd]);

  // CPM hook
  const cpm = useCPM();

  // Timer with tick callback
  const handleTick = useCallback(() => {
    if (phase !== 'writing' && phase !== 'fading') return;

    const currentCPM = cpm.tick();

    // Update stats
    const stats = statsRef.current;
    stats.maxCPM = Math.max(stats.maxCPM, currentCPM);
    stats.cpmSum += currentCPM;
    stats.cpmCount += 1;

    if (currentCPM >= CPM_THRESHOLDS.FLOW) {
      stats.flowTimeSeconds += 1;
    }

    // Update flow state (sync with CPM)
    setFlowState(getFlowState(currentCPM));

    // Don't update gauge if in fade mode (handled separately)
    if (phase === 'fading') return;

    // Update gauge
    const change = getGaugeChange(currentCPM);
    setGauge(prev => {
      const newGauge = Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, prev + change));

      // Trigger fade if gauge hits 0
      if (newGauge <= 0 && prev > 0) {
        setPhase('fading');
        fadeEffect.startFade();
      }

      return newGauge;
    });
  }, [phase, cpm]);

  const timer = useTimer({
    onTick: handleTick,
  });

  // Fade effect handlers
  const handleFadeComplete = useCallback(() => {
    handleSessionEnd('fadeDeath');
  }, [handleSessionEnd]);

  const handleRecovery = useCallback(() => {
    setPhase('writing');
    setGauge(FADE_RECOVERY_GAUGE);
    statsRef.current.fadeRecoveries += 1;
  }, []);

  const fadeEffect = useFadeEffect({
    onFadeComplete: handleFadeComplete,
    onRecovery: handleRecovery,
  });

  // Text change handler
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    cpm.recordInput(newText.length);

    // Track chars for fade recovery
    if (phase === 'fading') {
      const charsDelta = Math.max(0, newText.length - lastTextLengthRef.current);
      fadeEffect.recordFadeInput(charsDelta);
    }

    lastTextLengthRef.current = newText.length;
  }, [cpm, fadeEffect, phase]);

  // Start session
  const startSession = useCallback(() => {
    setPhase('writing');
    setText('');
    setGauge(GAUGE_INITIAL);
    setFlowState('stopped');
    statsRef.current = {
      maxCPM: 0,
      flowTimeSeconds: 0,
      fadeRecoveries: 0,
      cpmSum: 0,
      cpmCount: 0,
    };
    lastTextLengthRef.current = 0;
    cpm.reset();
    timer.reset();
    fadeEffect.reset();
    timer.start();
  }, [cpm, timer, fadeEffect]);

  // End session manually
  const endSession = useCallback(() => {
    timer.pause();
    handleSessionEnd('manual');
  }, [timer, handleSessionEnd]);

  // Derived state
  const gaugeState: FlowGaugeState = {
    percentage: gauge,
    state: flowState,
  };

  return {
    phase,
    text,
    handleTextChange,
    cpmData: cpm.cpmData,
    gaugeState,
    fadeState: fadeEffect.fadeState,
    timer: {
      elapsed: timer.elapsed,
    },
    startSession,
    endSession,
  };
}
