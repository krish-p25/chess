import type { EngineEvaluation } from '../../types';
import { winProbability } from '../../utils/classification';
import './EvalBar.css';

interface Props {
  evaluation: EngineEvaluation | null;
  flipped: boolean;
}

function formatEval(ev: EngineEvaluation): string {
  if (ev.type === 'mate') {
    return `M${Math.abs(ev.value)}`;
  }
  const val = Math.abs(ev.value) / 100;
  return val.toFixed(1);
}

export function EvalBar({ evaluation, flipped }: Props) {
  let whitePercent = 50;
  let evalText = '0.0';
  let isWhiteAdvantage = true;

  if (evaluation) {
    const cp = evaluation.type === 'cp' ? evaluation.value : (evaluation.value > 0 ? 1000 : -1000);
    whitePercent = winProbability(cp) * 100;
    whitePercent = Math.max(3, Math.min(97, whitePercent));
    evalText = formatEval(evaluation);
    isWhiteAdvantage = evaluation.type === 'mate' ? evaluation.value > 0 : evaluation.value >= 0;
  }

  const topColor = flipped ? 'white' : 'black';
  const bottomColor = flipped ? 'black' : 'white';
  const topPercent = flipped ? whitePercent : (100 - whitePercent);
  const bottomPercent = 100 - topPercent;

  return (
    <div className="eval-bar">
      <div
        className={`eval-section eval-${topColor}`}
        style={{ flex: topPercent }}
      >
        {((topColor === 'white' && isWhiteAdvantage) || (topColor === 'black' && !isWhiteAdvantage)) && (
          <span className="eval-text">{evalText}</span>
        )}
      </div>
      <div
        className={`eval-section eval-${bottomColor}`}
        style={{ flex: bottomPercent }}
      >
        {((bottomColor === 'white' && isWhiteAdvantage) || (bottomColor === 'black' && !isWhiteAdvantage)) && (
          <span className="eval-text">{evalText}</span>
        )}
      </div>
    </div>
  );
}
