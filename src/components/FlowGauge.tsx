import type { CSSProperties } from 'react';
import type { FlowGaugeState } from '../types';

interface FlowGaugeProps {
  gaugeState: FlowGaugeState;
  cpm: number;
  style?: CSSProperties;
}

export function FlowGauge({ gaugeState, cpm, style }: FlowGaugeProps) {
  const { percentage, state } = gaugeState;

  const getStateColor = () => {
    switch (state) {
      case 'flow': return 'var(--flow-color)';
      case 'slow': return 'var(--slow-color)';
      case 'stopped': return 'var(--stopped-color)';
    }
  };

  const getStateLabel = () => {
    switch (state) {
      case 'flow': return 'フロー';
      case 'slow': return 'スローダウン';
      case 'stopped': return '沈黙';
    }
  };

  return (
    <div className="flow-gauge" style={style}>
      <div className="gauge-bar">
        <div
          className="gauge-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getStateColor(),
          }}
        />
      </div>
      <div className="gauge-info">
        <span className="gauge-state" style={{ color: getStateColor() }}>
          {getStateLabel()}
        </span>
        <span className="gauge-cpm">{cpm} CPM</span>
      </div>
    </div>
  );
}
