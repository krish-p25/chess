import { useState, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { StockfishEngine } from '../services/engine';
import { classifyMove, calculateAccuracy } from '../utils/classification';
import type { ParsedGame, MoveAnalysis, PositionAnalysis } from '../types';

function expectedPoints(cp: number): number {
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}

function toWhiteCp(ev: { type: 'cp' | 'mate'; value: number }): number {
  if (ev.type === 'mate') {
    const sign = ev.value > 0 ? 1 : -1;
    return sign * (10000 - Math.abs(ev.value) * 10);
  }
  return ev.value;
}

export function useStockfish() {
  const [analysisResults, setAnalysisResults] = useState<MoveAnalysis[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAnalysisMove, setCurrentAnalysisMove] = useState(0);
  const [whiteAccuracy, setWhiteAccuracy] = useState(0);
  const [blackAccuracy, setBlackAccuracy] = useState(0);
  const cancelledRef = useRef(false);
  const engineRef = useRef<StockfishEngine | null>(null);

  const startAnalysis = useCallback(async (parsedGame: ParsedGame, depth = 18) => {
    cancelledRef.current = false;
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentAnalysisMove(0);
    setAnalysisResults(null);

    const engine = new StockfishEngine();
    engineRef.current = engine;

    try {
      await engine.init();
      engine.newGame();

      const positions: string[] = [parsedGame.startingFen];
      for (const move of parsedGame.moves) {
        positions.push(move.fen);
      }

      const totalPositions = positions.length;
      const positionEvals: PositionAnalysis[] = [];

      for (let i = 0; i < totalPositions; i++) {
        if (cancelledRef.current) break;
        setCurrentAnalysisMove(i);
        setProgress(Math.round((i / totalPositions) * 100));

        const analysis = await engine.analyze(positions[i], depth);
        positionEvals.push(analysis);
      }

      if (cancelledRef.current) {
        setIsAnalyzing(false);
        return;
      }

      const chess = new Chess();
      const moveAnalyses: MoveAnalysis[] = [];
      const bookDepth = Math.min(10, parsedGame.moves.length);
      let inBookPhase = true;

      for (let i = 0; i < parsedGame.moves.length; i++) {
        const move = parsedGame.moves[i];
        const evalBefore = positionEvals[i].evaluation;
        const evalAfter = positionEvals[i + 1].evaluation;
        const bestMoveUci = positionEvals[i].bestMove;

        chess.load(move.fenBefore);
        const legalMoves = chess.moves({ verbose: true });
        const legalMoveCount = legalMoves.length;

        const bestMoveObj = legalMoves.find(
          m => (m.from + m.to + (m.promotion || '')) === bestMoveUci
        );
        const bestMoveSan = bestMoveObj ? bestMoveObj.san : bestMoveUci;

        // Sacrifice detection — requires the piece to be left en prise after the move.
        // A safe winning capture (e.g. Qxd3 where queen is untouched) is NOT a sacrifice.
        const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        const opponentColor = move.color === 'w' ? 'b' : 'w';
        let isSacrifice = false;

        chess.load(move.fen); // position AFTER the move
        if (move.captured) {
          const pieceVal = pieceValues[move.piece.toLowerCase()] || 0;
          const capturedVal = pieceValues[move.captured.toLowerCase()] || 0;
          if (pieceVal > capturedVal) {
            try { isSacrifice = chess.isAttacked(move.to as any, opponentColor as any); } catch {}
          }
        } else {
          const movedPieceVal = pieceValues[move.piece.toLowerCase()] || 0;
          if (movedPieceVal >= 3) {
            try { isSacrifice = chess.isAttacked(move.to as any, opponentColor as any); } catch {}
          }
        }

        // Book detection: stays in book phase until eval deviates beyond ±50cp
        if (inBookPhase && i < bookDepth) {
          const evalCp = evalBefore.type === 'cp' ? evalBefore.value : 0;
          if (Math.abs(evalCp) > 50) {
            inBookPhase = false;
          }
        } else if (i >= bookDepth) {
          inBookPhase = false;
        }
        const isBook = inBookPhase && i < bookDepth;

        const classification = classifyMove(
          evalBefore,
          evalAfter,
          move.uci,
          bestMoveUci,
          move.color,
          legalMoveCount,
          isSacrifice,
          isBook,
        );

        // Compute expected points loss for this move
        const whiteCpBefore = toWhiteCp(evalBefore);
        const whiteCpAfter = toWhiteCp(evalAfter);
        const playerCpBefore = move.color === 'w' ? whiteCpBefore : -whiteCpBefore;
        const playerCpAfter = move.color === 'w' ? whiteCpAfter : -whiteCpAfter;
        const wpLoss = Math.max(0, expectedPoints(playerCpBefore) - expectedPoints(playerCpAfter));

        moveAnalyses.push({
          moveIndex: i,
          san: move.san,
          uci: move.uci,
          color: move.color,
          from: move.from,
          to: move.to,
          fen: move.fen,
          evalBefore,
          evalAfter,
          bestMoveEval: evalBefore,
          bestMoveSan,
          bestMoveUci,
          wpLoss,
          classification,
          isSacrifice,
        });
      }

      const whiteMoves = moveAnalyses.filter(m => m.color === 'w');
      const blackMoves = moveAnalyses.filter(m => m.color === 'b');

      setWhiteAccuracy(calculateAccuracy(whiteMoves));
      setBlackAccuracy(calculateAccuracy(blackMoves));
      setAnalysisResults(moveAnalyses);
      setProgress(100);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      engine.destroy();
      engineRef.current = null;
      setIsAnalyzing(false);
    }
  }, []);

  const cancelAnalysis = useCallback(() => {
    cancelledRef.current = true;
    engineRef.current?.destroy();
    engineRef.current = null;
    setIsAnalyzing(false);
  }, []);

  return {
    analysisResults,
    isAnalyzing,
    progress,
    currentAnalysisMove,
    whiteAccuracy,
    blackAccuracy,
    startAnalysis,
    cancelAnalysis,
  };
}
