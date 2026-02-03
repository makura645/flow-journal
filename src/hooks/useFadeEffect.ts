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

  const [charsTypedDuringFade, setCharsTypedDuringFade] = useState(0);
  const charsTypedRef = useRef(0);
  const countdownIntervalRef = useRef<number | null>(null);
  const countdownRef = useRef(FADE_COUNTDOWN_SECONDS);
  const isFadingRef = useRef(false);

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
    if (isFadingRef.current) return;

    charsTypedRef.current = 0;
    setCharsTypedDuringFade(0);
    isFadingRef.current = true;
    countdownRef.current = FADE_COUNTDOWN_SECONDS;

    setFadeState({
      isFading: true,
      countdown: FADE_COUNTDOWN_SECONDS,
      opacity: FADE_OPACITY.FULL,
    });

    countdownIntervalRef.current = window.setInterval(() => {
      countdownRef.current -= 1;
      const newCountdown = countdownRef.current;

      if (newCountdown <= 0) {
        // Clear interval first, then update state and call callback
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        isFadingRef.current = false;

        setFadeState({ isFading: true, countdown: 0, opacity: FADE_OPACITY.LOW });
        onFadeCompleteRef.current();
      } else {
        setFadeState({
          isFading: true,
          countdown: newCountdown,
          opacity: getOpacity(newCountdown),
        });
      }
    }, 1000);
  }, []);

  // Record chars typed during fade
  const recordFadeInput = useCallback((charsDelta: number) => {
    if (!isFadingRef.current) return;

    charsTypedRef.current += charsDelta;
    const newCount = charsTypedRef.current;
    setCharsTypedDuringFade(newCount);

    // Check if recovery threshold met
    if (newCount >= FADE_RECOVERY_CHARS) {
      // Recovery successful!
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      charsTypedRef.current = 0;
      setCharsTypedDuringFade(0);
      isFadingRef.current = false;

      setFadeState({
        isFading: false,
        countdown: FADE_COUNTDOWN_SECONDS,
        opacity: FADE_OPACITY.FULL,
      });

      onRecoveryRef.current();
    }
  }, []);

  // Cancel fade (used when gauge goes above 0 before countdown)
  const cancelFade = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    charsTypedRef.current = 0;
    setCharsTypedDuringFade(0);
    isFadingRef.current = false;
    countdownRef.current = FADE_COUNTDOWN_SECONDS;

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
    recoveryProgress: (charsTypedDuringFade / FADE_RECOVERY_CHARS) * 100,
  };
}
