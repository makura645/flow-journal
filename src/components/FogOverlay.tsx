import type { FadeState } from '../types';

interface FogOverlayProps {
  fadeState: FadeState;
}

export function FogOverlay({ fadeState }: FogOverlayProps) {
  if (!fadeState.isFading) return null;

  const fogIntensity = 1 - fadeState.opacity;

  return (
    <div
      className="fog-overlay"
      style={{
        opacity: fogIntensity,
      }}
    >
      <div className="fog-layer fog-1" />
      <div className="fog-layer fog-2" />
      <div className="fog-layer fog-3" />
    </div>
  );
}
