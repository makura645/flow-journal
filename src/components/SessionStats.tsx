import type { SessionStats as Stats } from '../types';

interface SessionStatsProps {
  stats: Stats;
}

export function SessionStats({ stats }: SessionStatsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEndReasonMessage = () => {
    switch (stats.endReason) {
      case 'fadeDeath':
        return 'ここで筆を置きました';
      case 'manual':
        return '手動終了';
    }
  };

  return (
    <div className="session-stats">
      <h2 className="stats-title">{getEndReasonMessage()}</h2>

      <div className="stats-row">
        <div className="stat-item">
          <span className="stat-value">{stats.totalChars}</span>
          <span className="stat-label">文字</span>
        </div>

        <div className="stat-item">
          <span className="stat-value">{stats.avgCPM}</span>
          <span className="stat-label">平均CPM</span>
        </div>

        <div className="stat-item">
          <span className="stat-value">{formatTime(stats.totalTime)}</span>
          <span className="stat-label">時間</span>
        </div>
      </div>
    </div>
  );
}
