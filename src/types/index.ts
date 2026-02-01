export type FlowState = 'stopped' | 'slow' | 'flow';

export type SessionPhase = 'start' | 'writing' | 'fading' | 'ended';

export interface SessionStats {
  totalChars: number;
  totalWords: number;
  avgCPM: number;
  maxCPM: number;
  flowTime: number; // seconds in flow state
  totalTime: number; // seconds
  fadeRecoveries: number;
  endReason: 'fadeDeath' | 'manual';
  endedAt: string; // ISO形式
}

export interface CPMData {
  current: number;
  history: number[];
}

export interface FlowGaugeState {
  percentage: number;
  state: FlowState;
}

export interface FadeState {
  isFading: boolean;
  countdown: number;
  opacity: number;
}

export interface AISummaryResult {
  summary: string[];
  emotions: string[];
  feedback: string;
}

