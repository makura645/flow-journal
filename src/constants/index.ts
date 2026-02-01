// CPM thresholds and gauge changes
export const CPM_THRESHOLDS = {
  FLOW: 100,     // Flow Zone (100+ CPM)
  SLOW: 40,      // Slow (少し厳しく)
  STOPPED: 1,    // Almost stopped
} as const;

export const GAUGE_CHANGES = {
  FLOW: 1.5,     // +1.5%/sec when CPM >= 100
  SLOW: -1,      // -1%/sec when CPM 40-100
  STOPPING: -3,  // -3%/sec when CPM 1-40
  STOPPED: -12,  // -12%/sec when CPM 0
} as const;

// Fade system
export const FADE_COUNTDOWN_SECONDS = 3;
export const FADE_RECOVERY_CHARS = 8;
export const FADE_RECOVERY_GAUGE = 40;

// Opacity levels during fade
export const FADE_OPACITY = {
  FULL: 1.0,
  MEDIUM: 0.5,
  LOW: 0.2,
} as const;

// CPM calculation window
export const CPM_WINDOW_SECONDS = 2;

// Gauge limits
export const GAUGE_MIN = 0;
export const GAUGE_MAX = 100;
export const GAUGE_INITIAL = 50;

// Update interval
export const UPDATE_INTERVAL_MS = 1000;

// Feature flags
export const FEATURES = {
  AI_SUMMARY: true,           // AI機能全体のON/OFF
} as const;

// API endpoints (for serverless mode)
export const API_ENDPOINTS = {
  SUMMARY: '/api/summary',
} as const;

