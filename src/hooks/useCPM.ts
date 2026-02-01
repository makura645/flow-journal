import { useState, useCallback, useRef } from 'react';
import { CPM_WINDOW_SECONDS } from '../constants';
import type { CPMData } from '../types';

export function useCPM() {
  const [cpmData, setCpmData] = useState<CPMData>({
    current: 0,
    history: [],
  });

  // Track character counts per second for the sliding window
  const charCountsRef = useRef<number[]>([]);
  const currentSecondCharsRef = useRef(0);
  const lastTextLengthRef = useRef(0);

  // Called when text changes
  const recordInput = useCallback((textLength: number) => {
    const charsDelta = Math.max(0, textLength - lastTextLengthRef.current);
    currentSecondCharsRef.current += charsDelta;
    lastTextLengthRef.current = textLength;
  }, []);

  // Called every second to update CPM
  const tick = useCallback(() => {
    // Add current second's chars to history
    const newCounts = [...charCountsRef.current, currentSecondCharsRef.current];

    // Keep only last N seconds
    while (newCounts.length > CPM_WINDOW_SECONDS) {
      newCounts.shift();
    }

    charCountsRef.current = newCounts;

    // Calculate CPM from sliding window
    const totalChars = newCounts.reduce((sum, c) => sum + c, 0);
    const windowSeconds = Math.min(newCounts.length, CPM_WINDOW_SECONDS);
    const cpm = windowSeconds > 0 ? Math.round((totalChars / windowSeconds) * 60) : 0;

    setCpmData(prev => ({
      current: cpm,
      history: [...prev.history, cpm].slice(-60), // Keep last 60 values
    }));

    // Reset for next second
    currentSecondCharsRef.current = 0;

    return cpm;
  }, []);

  const reset = useCallback(() => {
    charCountsRef.current = [];
    currentSecondCharsRef.current = 0;
    lastTextLengthRef.current = 0;
    setCpmData({ current: 0, history: [] });
  }, []);

  return {
    cpmData,
    recordInput,
    tick,
    reset,
  };
}
