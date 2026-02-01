import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTimerOptions {
  onTick?: () => void;
}

export function useTimer({ onTick }: UseTimerOptions = {}) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onTickRef = useRef(onTick);

  // Update refs to avoid stale closures
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const start = useCallback(() => {
    if (intervalRef.current) return;

    setIsRunning(true);
    intervalRef.current = window.setInterval(() => {
      setElapsed(prev => prev + 1);
      onTickRef.current?.();
    }, 1000);
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsed(0);
    setIsRunning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    elapsed,
    isRunning,
    start,
    pause,
    reset,
  };
}
