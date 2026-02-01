import { FADE_RECOVERY_CHARS } from '../constants';
import type { FadeState } from '../types';

interface CountdownBannerProps {
  fadeState: FadeState;
  recoveryProgress: number;
}

export function CountdownBanner({ fadeState, recoveryProgress }: CountdownBannerProps) {
  if (!fadeState.isFading) return null;

  return (
    <div className="countdown-banner">
      <div className="countdown-content">
        <div className="countdown-timer">
          <span className="countdown-number">{fadeState.countdown}</span>
          <span className="countdown-label">秒</span>
        </div>

        <div className="countdown-message">
          <p className="countdown-warning">意識が遠のいていく…</p>
          <p className="countdown-hint">
            あと {FADE_RECOVERY_CHARS - Math.floor(recoveryProgress / 100 * FADE_RECOVERY_CHARS)} 文字で戻れる
          </p>
        </div>

        <div className="recovery-progress">
          <div
            className="recovery-bar"
            style={{ width: `${Math.min(100, recoveryProgress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
