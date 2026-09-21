import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { parseGame } from '../utils/pgn';
import type { ParsedGame } from '../types';

export function useChessGame(pgn: string) {
  const parsedGame = useMemo<ParsedGame>(() => parseGame(pgn), [pgn]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1200);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalMoves = parsedGame.moves.length;

  const currentFen = currentMoveIndex === -1
    ? parsedGame.startingFen
    : parsedGame.moves[currentMoveIndex].fen;

  const lastMove = currentMoveIndex >= 0
    ? { from: parsedGame.moves[currentMoveIndex].from, to: parsedGame.moves[currentMoveIndex].to }
    : null;

  const goToMove = useCallback((index: number) => {
    setCurrentMoveIndex(Math.max(-1, Math.min(index, totalMoves - 1)));
    setIsAutoPlaying(false);
  }, [totalMoves]);

  const goForward = useCallback(() => {
    setCurrentMoveIndex(prev => Math.min(prev + 1, totalMoves - 1));
  }, [totalMoves]);

  const goBack = useCallback(() => {
    setCurrentMoveIndex(prev => Math.max(prev - 1, -1));
    setIsAutoPlaying(false);
  }, []);

  const goToStart = useCallback(() => {
    setCurrentMoveIndex(-1);
    setIsAutoPlaying(false);
  }, []);

  const goToEnd = useCallback(() => {
    setCurrentMoveIndex(totalMoves - 1);
    setIsAutoPlaying(false);
  }, [totalMoves]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentMoveIndex(prev => {
          if (prev >= totalMoves - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, autoPlaySpeed);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, autoPlaySpeed, totalMoves]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); goBack(); break;
        case 'ArrowRight': e.preventDefault(); goForward(); break;
        case 'Home': e.preventDefault(); goToStart(); break;
        case 'End': e.preventDefault(); goToEnd(); break;
        case ' ': e.preventDefault(); toggleAutoPlay(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goBack, goForward, goToStart, goToEnd, toggleAutoPlay]);

  return {
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
    autoPlaySpeed,
    setAutoPlaySpeed,
    headers: parsedGame.headers,
  };
}
