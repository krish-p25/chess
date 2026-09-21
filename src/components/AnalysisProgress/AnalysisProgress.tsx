import './AnalysisProgress.css';

interface Props {
  progress: number;
  currentMove: number;
  totalMoves: number;
  onCancel: () => void;
}

export function AnalysisProgress({ progress, currentMove, totalMoves, onCancel }: Props) {
  return (
    <div className="analysis-progress">
      <div className="analysis-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#81b64c" strokeWidth="2" className="spinning-icon">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </div>

      <div className="analysis-info">
        <div className="analysis-title">Analyzing with Stockfish</div>
        <div className="analysis-detail">
          Position {Math.min(currentMove + 1, totalMoves)} of {totalMoves}
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-percent">{progress}%</span>
      </div>

      <button className="cancel-btn" onClick={onCancel}>Cancel</button>
    </div>
  );
}
