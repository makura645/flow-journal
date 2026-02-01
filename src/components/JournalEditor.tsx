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
  cpmData: CPMData;
  elapsed: number;
  onEnd: () => void;
}

export function JournalEditor({
  text,
  onTextChange,
  gaugeState,
  fadeState,
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
        <div className="timer">
          <span className="timer-elapsed">{formatTime(elapsed)}</span>
          <span className="timer-label">経過</span>
        </div>

        <FlowGauge gaugeState={gaugeState} cpm={cpmData.current} />

        <button className="end-button" onClick={onEnd}>
          終了
        </button>
      </header>

      <div className="editor-container">
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          defaultValue=""
          onInput={handleInput}
          placeholder="思いつくままに書き始めてください..."
          style={{
            opacity: fadeState.opacity,
          }}
        />

        <FogOverlay fadeState={fadeState} />
        <CountdownBanner fadeState={fadeState} recoveryProgress={0} />
      </div>

      <footer className="editor-footer">
        <span className="char-count">{text.length} 文字</span>
      </footer>
    </div>
  );
}
