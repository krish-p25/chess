import { Chessboard } from 'react-chessboard';
import type { MoveClassification } from '../../types';
import { CLASSIFICATIONS } from '../../utils/classification';
import './Board.css';

interface Props {
  fen: string;
  orientation: 'white' | 'black';
  lastMove: { from: string; to: string } | null;
  classification: MoveClassification | null;
  bestMove: { from: string; to: string } | null;
  boardWidth: number;
}

function squareToPixel(square: string, orientation: 'white' | 'black', squareSize: number) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 7 - rank : rank;
  return {
    x: col * squareSize + squareSize / 2,
    y: row * squareSize + squareSize / 2,
  };
}

function BestMoveArrow({ from, to, boardWidth, orientation }: {
  from: string;
  to: string;
  boardWidth: number;
  orientation: 'white' | 'black';
}) {
  const squareSize = boardWidth / 8;
  const start = squareToPixel(from, orientation, squareSize);
  const end = squareToPixel(to, orientation, squareSize);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const headLength = squareSize * 0.35;
  const headWidth = squareSize * 0.35;
  const shaftWidth = squareSize * 0.18;
  const shortenStart = squareSize * 0.1;
  const shortenEnd = squareSize * 0.05;

  const effectiveLength = length - shortenStart - shortenEnd;
  const shaftLength = effectiveLength - headLength;

  const hw = shaftWidth / 2;
  const hhw = headWidth / 2;

  const points = [
    [shortenStart, -hw],
    [shortenStart + shaftLength, -hw],
    [shortenStart + shaftLength, -hhw],
    [shortenStart + effectiveLength, 0],
    [shortenStart + shaftLength, hhw],
    [shortenStart + shaftLength, hw],
    [shortenStart, hw],
  ];

  const pointsStr = points.map(([px, py]) => `${px},${py}`).join(' ');

  return (
    <svg
      className="best-move-arrow"
      width={boardWidth}
      height={boardWidth}
      viewBox={`0 0 ${boardWidth} ${boardWidth}`}
    >
      <g transform={`translate(${start.x},${start.y}) rotate(${(angle * 180) / Math.PI})`}>
        <polygon
          points={pointsStr}
          fill="rgba(235, 149, 50, 0.85)"
          stroke="rgba(180, 100, 20, 0.5)"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}

function ClassificationIcon({ classification, square, boardWidth, orientation }: {
  classification: MoveClassification;
  square: string;
  boardWidth: number;
  orientation: 'white' | 'black';
}) {
  const info = CLASSIFICATIONS[classification];
  const squareSize = boardWidth / 8;
  const iconSize = Math.max(20, squareSize * 0.4);

  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;

  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 7 - rank : rank;

  const left = col * squareSize + squareSize - iconSize / 2;
  const top = row * squareSize - iconSize / 2;

  return (
    <div
      className="classification-icon"
      style={{ left, top, width: iconSize, height: iconSize }}
    >
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize}>
        <circle cx="12" cy="12" r="12" fill={info.color} />
        {renderIconContent(classification, info)}
      </svg>
    </div>
  );
}

function renderIconContent(classification: MoveClassification, info: { symbol: string }) {
  switch (classification) {
    case 'best':
      // Filled 5-pointed star
      return (
        <polygon
          points="12,3 14.3,8.6 20.5,8.6 15.6,12.5 17.5,18.5 12,14.8 6.5,18.5 8.4,12.5 3.5,8.6 9.7,8.6"
          fill="white"
        />
      );
    case 'excellent':
      // 4-pointed sparkle
      return (
        <path
          d="M12 3 L13.2 10.8 L21 12 L13.2 13.2 L12 21 L10.8 13.2 L3 12 L10.8 10.8 Z"
          fill="white"
        />
      );
    case 'good':
    case 'forced':
      // Checkmark
      return (
        <path
          d="M7 12.5l3 3 7-7"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'book':
      return (
        <path
          d="M7 6h10c1 0 1 1 1 1v10s0 1-1 1H7s-1 0-1-1V7s0-1 1-1zm5 0v12M8 8h3M8 10h3"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    default:
      // Text symbols: !! (brilliant), ! (great), ?! (inaccuracy), ? (mistake), ?? (blunder)
      return (
        <text
          x="12"
          y="12"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={info.symbol.length > 1 ? "11" : "14"}
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {info.symbol}
        </text>
      );
  }
}

export function Board({ fen, orientation, lastMove, classification, bestMove, boardWidth }: Props) {
  const customSquareStyles: Record<string, React.CSSProperties> = {};

  if (lastMove) {
    const highlightColor = 'rgba(255, 255, 0, 0.4)';
    customSquareStyles[lastMove.from] = { backgroundColor: highlightColor };
    customSquareStyles[lastMove.to] = { backgroundColor: highlightColor };

    if (classification && !['book', 'best', 'excellent', 'good', 'forced'].includes(classification)) {
      const classColor = CLASSIFICATIONS[classification].color;
      customSquareStyles[lastMove.to] = {
        backgroundColor: classColor,
        opacity: 0.7,
      };
    }
  }

  const showIcon = lastMove && classification;

  return (
    <div className="board-wrapper" style={{ width: boardWidth, height: boardWidth }}>
      <Chessboard
        options={{
          id: 'review-board',
          position: fen,
          boardOrientation: orientation,
          allowDragging: false,
          showAnimations: true,
          animationDurationInMs: 200,
          darkSquareStyle: { backgroundColor: '#739552' },
          lightSquareStyle: { backgroundColor: '#ebecd0' },
          squareStyles: customSquareStyles,
        }}
      />
      <div className="classification-overlay">
        {bestMove && (
          <BestMoveArrow
            from={bestMove.from}
            to={bestMove.to}
            boardWidth={boardWidth}
            orientation={orientation}
          />
        )}
        {showIcon && (
          <ClassificationIcon
            classification={classification}
            square={lastMove.to}
            boardWidth={boardWidth}
            orientation={orientation}
          />
        )}
      </div>
    </div>
  );
}
