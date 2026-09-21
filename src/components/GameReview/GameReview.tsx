import { useEffect, useMemo, useState, useCallback } from 'react';
import type { ChessComGame } from '../../types';
import { useChessGame } from '../../hooks/useChessGame';
import { useStockfish } from '../../hooks/useStockfish';
import { extractOpeningName } from '../../utils/pgn';
import { Board } from '../Board/Board';
import { EvalBar } from '../EvalBar/EvalBar';
import { MoveList } from '../MoveList/MoveList';
import { PlayerInfo } from '../PlayerInfo/PlayerInfo';
import { AnalysisProgress } from '../AnalysisProgress/AnalysisProgress';
import './GameReview.css';

interface Props {
  game: ChessComGame;
  username: string;
  onBack: () => void;
}

export function GameReview({ game, username, onBack }: Props) {
  const {
    parsedGame,
    currentMoveIndex,
    currentFen,
    lastMove,
    totalMoves,
    goToMove,
    goForward,
    goBack,
    goToStart,
    goToEnd,
    isAutoPlaying,
    toggleAutoPlay,
  } = useChessGame(game.pgn);

  const {
    analysisResults,
    isAnalyzing,
    progress,
    currentAnalysisMove,
    whiteAccuracy,
    blackAccuracy,
    startAnalysis,
    cancelAnalysis,
  } = useStockfish();

  const [boardWidth, setBoardWidth] = useState(560);

  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  const orientation: 'white' | 'black' = isWhite ? 'white' : 'black';

  const topPlayer = isWhite ? game.black : game.white;
  const bottomPlayer = isWhite ? game.white : game.black;
  const topColor: 'white' | 'black' = isWhite ? 'black' : 'white';
  const bottomColor: 'white' | 'black' = isWhite ? 'white' : 'black';

  const opening = useMemo(() => extractOpeningName(parsedGame.headers), [parsedGame.headers]);

  const currentClassification = analysisResults && currentMoveIndex >= 0
    ? analysisResults[currentMoveIndex]?.classification ?? null
    : null;

  const bestMove = useMemo(() => {
    if (!analysisResults || currentMoveIndex < 0) return null;
    const analysis = analysisResults[currentMoveIndex];
    if (!analysis) return null;
    const uci = analysis.bestMoveUci;
    if (!uci || uci.length < 4) return null;
    if (analysis.uci === uci) return null;
    return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  }, [analysisResults, currentMoveIndex]);

  const currentEval = useMemo(() => {
    if (!analysisResults) return null;
    if (currentMoveIndex < 0) return null;
    return analysisResults[currentMoveIndex]?.evalAfter ?? null;
  }, [analysisResults, currentMoveIndex]);

  const handleStartAnalysis = useCallback(() => {
    startAnalysis(parsedGame);
  }, [startAnalysis, parsedGame]);

  const topClock = useMemo(() => {
    if (currentMoveIndex < 0) return undefined;
    for (let i = currentMoveIndex; i >= 0; i--) {
      const move = parsedGame.moves[i];
      if (move.color === (topColor === 'white' ? 'w' : 'b') && move.clock !== undefined) {
        return move.clock;
      }
    }
    return undefined;
  }, [currentMoveIndex, parsedGame.moves, topColor]);

  const bottomClock = useMemo(() => {
    if (currentMoveIndex < 0) return undefined;
    for (let i = currentMoveIndex; i >= 0; i--) {
      const move = parsedGame.moves[i];
      if (move.color === (bottomColor === 'white' ? 'w' : 'b') && move.clock !== undefined) {
        return move.clock;
      }
    }
    return undefined;
  }, [currentMoveIndex, parsedGame.moves, bottomColor]);

  useEffect(() => {
    const updateSize = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isMobile = vw <= 768;

      if (isMobile) {
        const evalBarSpace = 48;
        const horizontalPadding = 16;
        const maxBoardWidth = vw - horizontalPadding - evalBarSpace;
        const headerHeight = 46;
        const playerInfoHeight = 74;
        const navHeight = 52;
        const verticalPadding = 20;
        const maxBoardHeight = vh - headerHeight - playerInfoHeight - navHeight - verticalPadding;
        setBoardWidth(Math.max(200, Math.min(maxBoardWidth, maxBoardHeight)));
      } else {
        const maxBoardHeight = vh - 240;
        const maxBoardWidth = vw - 420;
        setBoardWidth(Math.min(Math.max(300, maxBoardHeight), Math.max(300, maxBoardWidth), 640));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="game-review-screen">
      <div className="review-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2>Game Review</h2>
        {!isAnalyzing && !analysisResults && (
          <button className="analyze-btn" onClick={handleStartAnalysis}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
            </svg>
            Analyze
          </button>
        )}
      </div>

      <div className="review-content">
        <div className="board-section">
          <PlayerInfo
            username={topPlayer.username}
            rating={topPlayer.rating}
            color={topColor}
            clock={topClock}
          />
          <div className="board-with-eval">
            <EvalBar evaluation={currentEval} flipped={!isWhite} />
            <Board
              fen={currentFen}
              orientation={orientation}
              lastMove={lastMove}
              classification={currentClassification}
              bestMove={bestMove}
              boardWidth={boardWidth}
            />
          </div>
          <PlayerInfo
            username={bottomPlayer.username}
            rating={bottomPlayer.rating}
            color={bottomColor}
            clock={bottomClock}
          />

          <div className="nav-controls">
            <button className="nav-btn" onClick={goToStart} title="Go to start (Home)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41zM6 6h2v12H6V6z" />
              </svg>
            </button>
            <button className="nav-btn" onClick={goBack} title="Previous move (←)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
              </svg>
            </button>
            <button
              className={`nav-btn play-btn ${isAutoPlaying ? 'playing' : ''}`}
              onClick={toggleAutoPlay}
              title="Auto-play (Space)"
            >
              {isAutoPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button className="nav-btn" onClick={goForward} title="Next move (→)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
            <button className="nav-btn" onClick={goToEnd} title="Go to end (End)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41zM16 6h2v12h-2V6z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="side-panel">
          {isAnalyzing ? (
            <AnalysisProgress
              progress={progress}
              currentMove={currentAnalysisMove}
              totalMoves={totalMoves + 1}
              onCancel={cancelAnalysis}
            />
          ) : (
            <MoveList
              moves={parsedGame.moves}
              analysisResults={analysisResults}
              currentMoveIndex={currentMoveIndex}
              onMoveClick={goToMove}
              openingName={opening.name}
            />
          )}

          {analysisResults && !isAnalyzing && (
            <div className="classification-summary">
              <div className="accuracy-header">
                <div className="accuracy-side">
                  <span className="accuracy-label">White</span>
                  <span className="accuracy-pct" style={{ color: whiteAccuracy >= 90 ? '#96bc4b' : whiteAccuracy >= 70 ? '#f7c631' : '#e58f2a' }}>
                    {whiteAccuracy}%
                  </span>
                </div>
                <div className="accuracy-title">Accuracy</div>
                <div className="accuracy-side">
                  <span className="accuracy-label">Black</span>
                  <span className="accuracy-pct" style={{ color: blackAccuracy >= 90 ? '#96bc4b' : blackAccuracy >= 70 ? '#f7c631' : '#e58f2a' }}>
                    {blackAccuracy}%
                  </span>
                </div>
              </div>
              <div className="summary-grid">
                {(['brilliant', 'great', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'] as const).map(cls => {
                  const whiteCnt = analysisResults.filter(m => m.color === 'w' && m.classification === cls).length;
                  const blackCnt = analysisResults.filter(m => m.color === 'b' && m.classification === cls).length;
                  if (whiteCnt === 0 && blackCnt === 0) return null;
                  const info = { brilliant: { n: 'Brilliant', c: '#1baca6' }, great: { n: 'Great', c: '#5c8bb0' }, best: { n: 'Best', c: '#96bc4b' }, excellent: { n: 'Excellent', c: '#96bc4b' }, good: { n: 'Good', c: '#96bc4b' }, inaccuracy: { n: 'Inaccuracy', c: '#f7c631' }, mistake: { n: 'Mistake', c: '#e58f2a' }, blunder: { n: 'Blunder', c: '#ca3431' } }[cls];
                  return (
                    <div className="summary-row" key={cls}>
                      <span className="summary-count white-count">{whiteCnt}</span>
                      <span className="summary-dot" style={{ backgroundColor: info.c }} />
                      <span className="summary-label">{info.n}</span>
                      <span className="summary-dot" style={{ backgroundColor: info.c }} />
                      <span className="summary-count black-count">{blackCnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
