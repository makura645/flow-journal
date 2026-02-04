import { useRef, useEffect } from 'react';
import { FlowGauge } from './FlowGauge';
import { FogOverlay } from './FogOverlay';
import { CountdownBanner } from './CountdownBanner';
import type { FlowGaugeState, FadeState, CPMData } from '../types';

interface JournalEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  gaugeState: FlowGaugeState;
  fadeState: FadeState;
  recoveryProgress: number;
  cpmData: CPMData;
  elapsed: number;
  onEnd: () => void;
}

export function JournalEditor({
  text,
  onTextChange,
  gaugeState,
  fadeState,
  recoveryProgress,
  cpmData,
  elapsed,
  onEnd,
}: JournalEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // 非制御コンポーネント: onInputで値を同期
  const handleInput = () => {
    if (textareaRef.current) {
      onTextChange(textareaRef.current.value);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="journal-editor">
      <header className="editor-header">
        <div className="timer" style={{ opacity: Math.max(0, 1 - elapsed / 60), transition: 'opacity 1s ease' }}>
          <span className="timer-elapsed">{formatTime(elapsed)}</span>
          <span className="timer-label">経過</span>
        </div>

        <FlowGauge gaugeState={gaugeState} cpm={cpmData.current} style={{ opacity: Math.max(0, 1 - elapsed / 60), transition: 'opacity 1s ease' }} />

        <div className="header-actions">
          <button className="end-button" onClick={onEnd}>
            終了
          </button>
        </div>
      </header>

      <div className="editor-container">
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          defaultValue=""
          onInput={handleInput}
          placeholder="思いつくままに書き始めてください..."
          style={{
            opacity: gaugeState.percentage >= 50
              ? 1.0
              : gaugeState.percentage / 50,
          }}
        />

        <FogOverlay fadeState={fadeState} />
        <CountdownBanner fadeState={fadeState} recoveryProgress={recoveryProgress} />
      </div>

      <footer className="editor-footer">
        <span className="char-count">{text.length} 文字</span>
      </footer>
    </div>
  );
}
