import { describe, it, expect } from 'vitest';
import { getFlowState, getGaugeChange } from './flowCalculations';
import { CPM_THRESHOLDS, GAUGE_CHANGES } from '../constants';

describe('getFlowState', () => {
  it('returns flow when CPM >= FLOW threshold', () => {
    expect(getFlowState(CPM_THRESHOLDS.FLOW)).toBe('flow');
    expect(getFlowState(CPM_THRESHOLDS.FLOW + 1)).toBe('flow');
    expect(getFlowState(100)).toBe('flow');
  });

  it('returns slow when CPM >= SLOW and < FLOW', () => {
    expect(getFlowState(CPM_THRESHOLDS.SLOW)).toBe('slow');
    expect(getFlowState(CPM_THRESHOLDS.FLOW - 1)).toBe('slow');
    expect(getFlowState(50)).toBe('slow');
  });

  it('returns stopped when CPM < SLOW', () => {
    expect(getFlowState(CPM_THRESHOLDS.SLOW - 1)).toBe('stopped');
    expect(getFlowState(0)).toBe('stopped');
    expect(getFlowState(10)).toBe('stopped');
  });

  // Boundary tests
  it('boundary: exactly at FLOW threshold', () => {
    expect(getFlowState(75)).toBe('flow');
    expect(getFlowState(74)).toBe('slow');
  });

  it('boundary: exactly at SLOW threshold', () => {
    expect(getFlowState(30)).toBe('slow');
    expect(getFlowState(29)).toBe('stopped');
  });
});

describe('getGaugeChange', () => {
  it('returns FLOW change when CPM >= FLOW threshold', () => {
    expect(getGaugeChange(CPM_THRESHOLDS.FLOW)).toBe(GAUGE_CHANGES.FLOW);
    expect(getGaugeChange(100)).toBe(GAUGE_CHANGES.FLOW);
  });

  it('returns SLOW change when CPM >= SLOW and < FLOW', () => {
    expect(getGaugeChange(CPM_THRESHOLDS.SLOW)).toBe(GAUGE_CHANGES.SLOW);
    expect(getGaugeChange(CPM_THRESHOLDS.FLOW - 1)).toBe(GAUGE_CHANGES.SLOW);
  });

  it('returns STOPPING change when CPM >= STOPPED and < SLOW', () => {
    expect(getGaugeChange(CPM_THRESHOLDS.STOPPED)).toBe(GAUGE_CHANGES.STOPPING);
    expect(getGaugeChange(CPM_THRESHOLDS.SLOW - 1)).toBe(GAUGE_CHANGES.STOPPING);
    expect(getGaugeChange(10)).toBe(GAUGE_CHANGES.STOPPING);
  });

  it('returns STOPPED change when CPM < STOPPED (i.e., 0)', () => {
    expect(getGaugeChange(0)).toBe(GAUGE_CHANGES.STOPPED);
  });

  // Boundary tests
  it('boundary: exactly at FLOW threshold', () => {
    expect(getGaugeChange(75)).toBe(1.5);
    expect(getGaugeChange(74)).toBe(-1);
  });

  it('boundary: exactly at SLOW threshold', () => {
    expect(getGaugeChange(30)).toBe(-1);
    expect(getGaugeChange(29)).toBe(-3);
  });

  it('boundary: exactly at STOPPED threshold', () => {
    expect(getGaugeChange(1)).toBe(-3);
    expect(getGaugeChange(0)).toBe(-8);
  });
});

describe('getFlowState and getGaugeChange consistency', () => {
  it('flow state and gauge change use same thresholds', () => {
    // When state is flow, gauge should increase
    const flowCPM = CPM_THRESHOLDS.FLOW;
    expect(getFlowState(flowCPM)).toBe('flow');
    expect(getGaugeChange(flowCPM)).toBeGreaterThan(0);

    // When state is slow, gauge should decrease
    const slowCPM = CPM_THRESHOLDS.SLOW;
    expect(getFlowState(slowCPM)).toBe('slow');
    expect(getGaugeChange(slowCPM)).toBeLessThan(0);

    // When state is stopped, gauge should decrease faster
    const stoppedCPM = 0;
    expect(getFlowState(stoppedCPM)).toBe('stopped');
    expect(getGaugeChange(stoppedCPM)).toBeLessThan(getGaugeChange(slowCPM));
  });

  it('at boundary 74-75, state and gauge change together', () => {
    // At 74: slow + decreasing
    expect(getFlowState(74)).toBe('slow');
    expect(getGaugeChange(74)).toBe(-1);

    // At 75: flow + increasing
    expect(getFlowState(75)).toBe('flow');
    expect(getGaugeChange(75)).toBe(1.5);
  });
});
