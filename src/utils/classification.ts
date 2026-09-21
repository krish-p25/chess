import type { MoveClassification, ClassificationInfo, EngineEvaluation } from '../types';

export const CLASSIFICATIONS: Record<MoveClassification, ClassificationInfo> = {
  brilliant:  { name: 'Brilliant',   symbol: '!!', color: '#1baca6' },
  great:      { name: 'Great',       symbol: '!',  color: '#5c8bb0' },
  best:       { name: 'Best',        symbol: '',   color: '#96bc4b' },
  excellent:  { name: 'Excellent',   symbol: '',   color: '#96bc4b' },
  good:       { name: 'Good',        symbol: '',   color: '#96bc4b' },
  inaccuracy: { name: 'Inaccuracy',  symbol: '?!', color: '#f7c631' },
  mistake:    { name: 'Mistake',     symbol: '?',  color: '#e58f2a' },
  blunder:    { name: 'Blunder',     symbol: '??', color: '#ca3431' },
  book:       { name: 'Book',        symbol: '',   color: '#a88865' },
  forced:     { name: 'Forced',      symbol: '',   color: '#96bc4b' },
};

function toWhiteCp(ev: EngineEvaluation): number {
  if (ev.type === 'mate') {
    const sign = ev.value > 0 ? 1 : -1;
    return sign * (10000 - Math.abs(ev.value) * 10);
  }
  return ev.value;
}

// Eval bar and accuracy use this (centipawn-based, steeper curve)
export function winProbability(cp: number): number {
  return 1 / (1 + Math.pow(10, -cp / 400));
}

// Classification uses this (chess.com/Lichess expected points model)
function expectedPoints(cp: number): number {
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}

export function classifyMove(
  evalBefore: EngineEvaluation,
  evalAfterPlayed: EngineEvaluation,
  playedUci: string,
  bestMoveUci: string,
  color: 'w' | 'b',
  legalMoveCount: number,
  isSacrifice: boolean,
  isBookMove: boolean,
): MoveClassification {
  if (isBookMove) return 'book';
  if (legalMoveCount === 1) return 'forced';

  const whiteCpBefore = toWhiteCp(evalBefore);
  const whiteCpAfter = toWhiteCp(evalAfterPlayed);

  const playerCpBefore = color === 'w' ? whiteCpBefore : -whiteCpBefore;
  const playerCpAfter = color === 'w' ? whiteCpAfter : -whiteCpAfter;

  const epBefore = expectedPoints(playerCpBefore);
  const epAfter = expectedPoints(playerCpAfter);
  const epLoss = epBefore - epAfter;

  const isPlayedBest = playedUci === bestMoveUci;

  if (isPlayedBest || epLoss <= 0) {
    if (isSacrifice && (isPlayedBest || epLoss <= 0.02)) {
      const notAlreadyWinning = epBefore < 0.90;
      const doesntEnterLosing = epAfter >= 0.40;
      if (notAlreadyWinning && doesntEnterLosing) {
        return 'brilliant';
      }
    }
    return 'best';
  }

  // Great: found the best move under pressure
  if (isPlayedBest && epLoss <= 0.02 && epBefore < 0.40 && epAfter >= 0.20 && legalMoveCount >= 6) {
    return 'great';
  }

  // Missed forced mate
  if (evalBefore.type === 'mate' && evalAfterPlayed.type !== 'mate') {
    const playerHadMate = (color === 'w' && evalBefore.value > 0) || (color === 'b' && evalBefore.value < 0);
    if (playerHadMate) return 'blunder';
  }

  if (epLoss <= 0.02) return 'excellent';
  if (epLoss <= 0.05) return 'good';
  if (epLoss <= 0.10) return 'inaccuracy';
  if (epLoss <= 0.20) return 'mistake';
  return 'blunder';
}

export function calculateAccuracy(
  evals: { evalBefore: EngineEvaluation; evalAfter: EngineEvaluation; color: 'w' | 'b' }[]
): number {
  if (evals.length === 0) return 0;

  let totalAccuracy = 0;
  for (const move of evals) {
    const whiteCpBefore = toWhiteCp(move.evalBefore);
    const whiteCpAfter = toWhiteCp(move.evalAfter);

    const cpBefore = move.color === 'w' ? whiteCpBefore : -whiteCpBefore;
    const cpAfter = move.color === 'w' ? whiteCpAfter : -whiteCpAfter;

    const wpBefore = winProbability(cpBefore);
    const wpAfter = winProbability(cpAfter);

    const moveAcc = Math.min(100, Math.max(0, (wpAfter / Math.max(wpBefore, 0.001)) * 100));
    totalAccuracy += moveAcc;
  }

  return Math.round((totalAccuracy / evals.length) * 10) / 10;
}

