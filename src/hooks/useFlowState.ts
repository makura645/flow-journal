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
  const phaseRef = useRef<SessionPhase>('start');
  const gaugeRef = useRef(GAUGE_INITIAL);

  // End session handler
  const handleSessionEnd = useCallback((reason: 'fadeDeath' | 'manual') => {
    phaseRef.current = 'ended';
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

  // Ref to break circular dependency: handleTick -> fadeEffect -> timer -> handleTick
  const fadeEffectRef = useRef<{ startFade: () => void; recordFadeInput: (n: number) => void; reset: () => void } | null>(null);

  // Timer with tick callback
  const handleTick = useCallback(() => {
    const currentPhase = phaseRef.current;
    if (currentPhase !== 'writing' && currentPhase !== 'fading') return;

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
    if (currentPhase === 'fading') return;

    // Update gauge
    const change = getGaugeChange(currentCPM);
    const prevGauge = gaugeRef.current;
    const newGauge = Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, prevGauge + change));
    gaugeRef.current = newGauge;
    setGauge(newGauge);

    // Trigger fade if gauge hits 0
    if (newGauge <= 0 && prevGauge > 0) {
      phaseRef.current = 'fading';
      setPhase('fading');
      fadeEffectRef.current?.startFade();
    }
  }, [cpm]);

  const timer = useTimer({
    onTick: handleTick,
  });

  // Fade effect handlers
  const handleFadeComplete = useCallback(() => {
    timer.pause();
    handleSessionEnd('fadeDeath');
  }, [timer, handleSessionEnd]);

  const handleRecovery = useCallback(() => {
    phaseRef.current = 'writing';
    setPhase('writing');
    gaugeRef.current = FADE_RECOVERY_GAUGE;
    setGauge(FADE_RECOVERY_GAUGE);
    statsRef.current.fadeRecoveries += 1;
  }, []);

  const fadeEffect = useFadeEffect({
    onFadeComplete: handleFadeComplete,
    onRecovery: handleRecovery,
  });

  // Keep fadeEffectRef in sync
  fadeEffectRef.current = fadeEffect;

  // Text change handler
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    cpm.recordInput(newText.length);

    // Track chars for fade recovery
    if (phaseRef.current === 'fading') {
      const charsDelta = Math.max(0, newText.length - lastTextLengthRef.current);
      fadeEffect.recordFadeInput(charsDelta);
    }

    lastTextLengthRef.current = newText.length;
  }, [cpm, fadeEffect]);

  // Start session
  const startSession = useCallback(() => {
    phaseRef.current = 'writing';
    setPhase('writing');
    setText('');
    gaugeRef.current = GAUGE_INITIAL;
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
    recoveryProgress: fadeEffect.recoveryProgress,
    timer: {
      elapsed: timer.elapsed,
    },
    startSession,
    endSession,
  };
}
