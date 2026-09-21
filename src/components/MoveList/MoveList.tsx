import { useEffect, useRef } from 'react';
import type { ParsedMove, MoveAnalysis, MoveClassification } from '../../types';
import { CLASSIFICATIONS } from '../../utils/classification';
import { formatTime } from '../../utils/pgn';
import './MoveList.css';

interface Props {
  moves: ParsedMove[];
  analysisResults: MoveAnalysis[] | null;
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
  openingName: string;
}

function ClassificationDot({ classification }: { classification: MoveClassification }) {
  const info = CLASSIFICATIONS[classification];
  return (
    <span
      className="classification-dot"
      style={{ backgroundColor: info.color }}
      title={info.name}
    />
  );
}

function MoveCell({
  move,
  isActive,
  analysis,
  onClick,
  activeRef,
}: {
  move: ParsedMove;
  isActive: boolean;
  analysis: MoveAnalysis | null;
  onClick: () => void;
  activeRef: React.RefObject<HTMLDivElement | null>;
}) {
  const cls = analysis?.classification;
  const symbol = cls ? CLASSIFICATIONS[cls].symbol : '';
  const symbolColor = cls ? CLASSIFICATIONS[cls].color : '';

  return (
    <div
      ref={isActive ? activeRef : null}
      className={`move-cell ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="move-main">
        {analysis && <ClassificationDot classification={analysis.classification} />}
        <span className="move-san">
          {move.san}
          {symbol && (
            <span className="move-symbol" style={{ color: symbolColor }}>
              {symbol}
            </span>
          )}
        </span>
      </div>
      {move.timeSpent !== undefined && (
        <span className={`move-time ${(move.timeSpent ?? 0) < 2 ? 'fast' : (move.timeSpent ?? 0) > 15 ? 'slow' : ''}`}>
          {formatTime(move.timeSpent)}
        </span>
      )}
    </div>
  );
}

export function MoveList({ moves, analysisResults, currentMoveIndex, onMoveClick, openingName }: Props) {
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      if (elRect.top < containerRect.top || elRect.bottom > containerRect.bottom) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentMoveIndex]);

  const movePairs: { number: number; white: { move: ParsedMove; index: number } | null; black: { move: ParsedMove; index: number } | null }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i] ? { move: moves[i], index: i } : null,
      black: moves[i + 1] ? { move: moves[i + 1], index: i + 1 } : null,
    });
  }

  return (
    <div className="move-list-panel">
      {openingName && (
        <div className="opening-name">{openingName}</div>
      )}

      <div className="move-list-container" ref={containerRef}>
        <div className="move-list-grid">
          {movePairs.map((pair) => (
            <div className="move-row" key={pair.number}>
              <div className="move-number">{pair.number}.</div>

              {pair.white ? (
                <MoveCell
                  move={pair.white.move}
                  isActive={currentMoveIndex === pair.white.index}
                  analysis={analysisResults?.[pair.white.index] ?? null}
                  onClick={() => onMoveClick(pair.white!.index)}
                  activeRef={activeRef}
                />
              ) : <div className="move-cell empty" />}

              {pair.black ? (
                <MoveCell
                  move={pair.black.move}
                  isActive={currentMoveIndex === pair.black.index}
                  analysis={analysisResults?.[pair.black.index] ?? null}
                  onClick={() => onMoveClick(pair.black!.index)}
                  activeRef={activeRef}
                />
              ) : <div className="move-cell empty" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
