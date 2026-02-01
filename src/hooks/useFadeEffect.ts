import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FADE_COUNTDOWN_SECONDS,
  FADE_RECOVERY_CHARS,
  FADE_OPACITY
} from '../constants';
import type { FadeState } from '../types';

interface UseFadeEffectOptions {
  onFadeComplete: () => void;
  onRecovery: () => void;
}

export function useFadeEffect({ onFadeComplete, onRecovery }: UseFadeEffectOptions) {
  const [fadeState, setFadeState] = useState<FadeState>({
    isFading: false,
    countdown: FADE_COUNTDOWN_SECONDS,
    opacity: FADE_OPACITY.FULL,
  });

  const charsTypedDuringFadeRef = useRef(0);
  const countdownIntervalRef = useRef<number | null>(null);

  // Keep callbacks in refs to avoid stale closures in setInterval
  const onFadeCompleteRef = useRef(onFadeComplete);
  const onRecoveryRef = useRef(onRecovery);

  useEffect(() => {
    onFadeCompleteRef.current = onFadeComplete;
    onRecoveryRef.current = onRecovery;
  }, [onFadeComplete, onRecovery]);

  // Calculate opacity based on countdown
  const getOpacity = (countdown: number): number => {
    if (countdown >= 4) return FADE_OPACITY.FULL;
    if (countdown >= 2) return FADE_OPACITY.MEDIUM;
    return FADE_OPACITY.LOW;
  };

  // Start the fade countdown
  const startFade = useCallback(() => {
    if (fadeState.isFading) return;

    charsTypedDuringFadeRef.current = 0;

    setFadeState({
      isFading: true,
      countdown: FADE_COUNTDOWN_SECONDS,
      opacity: FADE_OPACITY.FULL,
    });

    countdownIntervalRef.current = window.setInterval(() => {
      setFadeState(prev => {
        const newCountdown = prev.countdown - 1;

        if (newCountdown <= 0) {
          // Fade complete - session ends
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          onFadeCompleteRef.current();
          return { ...prev, countdown: 0, opacity: FADE_OPACITY.LOW };
        }

        return {
          ...prev,
          countdown: newCountdown,
          opacity: getOpacity(newCountdown),
        };
      });
    }, 1000);
  }, [fadeState.isFading]);

  // Record chars typed during fade
  const recordFadeInput = useCallback((charsDelta: number) => {
    if (!fadeState.isFading) return;

    charsTypedDuringFadeRef.current += charsDelta;

    // Check if recovery threshold met
    if (charsTypedDuringFadeRef.current >= FADE_RECOVERY_CHARS) {
      // Recovery successful!
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      setFadeState({
        isFading: false,
        countdown: FADE_COUNTDOWN_SECONDS,
        opacity: FADE_OPACITY.FULL,
      });

      charsTypedDuringFadeRef.current = 0;
      onRecoveryRef.current();
    }
  }, [fadeState.isFading]);

  // Cancel fade (used when gauge goes above 0 before countdown)
  const cancelFade = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    charsTypedDuringFadeRef.current = 0;

    setFadeState({
      isFading: false,
      countdown: FADE_COUNTDOWN_SECONDS,
      opacity: FADE_OPACITY.FULL,
    });
  }, []);

  // Reset state
  const reset = useCallback(() => {
    cancelFade();
  }, [cancelFade]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return {
    fadeState,
    startFade,
    recordFadeInput,
    cancelFade,
    reset,
    recoveryProgress: (charsTypedDuringFadeRef.current / FADE_RECOVERY_CHARS) * 100,
  };
}
