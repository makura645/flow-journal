import { CPM_THRESHOLDS, GAUGE_CHANGES } from '../constants';
import type { FlowState } from '../types';

export function getFlowState(cpm: number): FlowState {
  if (cpm >= CPM_THRESHOLDS.FLOW) return 'flow';
  if (cpm >= CPM_THRESHOLDS.SLOW) return 'slow';
  return 'stopped';
}

export function getGaugeChange(cpm: number): number {
  if (cpm >= CPM_THRESHOLDS.FLOW) return GAUGE_CHANGES.FLOW;
  if (cpm >= CPM_THRESHOLDS.SLOW) return GAUGE_CHANGES.SLOW;
  if (cpm >= CPM_THRESHOLDS.STOPPED) return GAUGE_CHANGES.STOPPING;
  return GAUGE_CHANGES.STOPPED;
}
