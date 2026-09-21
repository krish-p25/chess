import { Chess } from 'chess.js';
import type { ParsedGame, ParsedMove } from '../types';

function parseClockSeconds(clkStr: string): number {
  const parts = clkStr.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(parts[0]);
}

function extractClocks(pgn: string): number[] {
  const clocks: number[] = [];
  const regex = /\[%clk\s+([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(pgn)) !== null) {
    clocks.push(parseClockSeconds(match[1]));
  }
  return clocks;
}

export function parseGame(pgn: string): ParsedGame {
  const chess = new Chess();
  chess.loadPgn(pgn);

  const rawHeaders = chess.header();
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value != null) headers[key] = value;
  }
  const history = chess.history({ verbose: true });
  const clocks = extractClocks(pgn);

  const moves: ParsedMove[] = history.map((move, i) => {
    const clock = clocks[i] ?? undefined;

    let timeSpent: number | undefined;
    if (clock !== undefined) {
      if (i < 2) {
        const tcParts = (headers['TimeControl'] || '').split('+');
        const baseTime = parseInt(tcParts[0]) || 0;
        const increment = parseInt(tcParts[1]) || 0;
        timeSpent = Math.max(0, baseTime - clock + (i >= 2 ? increment : 0));
      } else {
        const prevSameColor = clocks[i - 2];
        if (prevSameColor !== undefined) {
          const tcParts = (headers['TimeControl'] || '').split('+');
          const increment = parseInt(tcParts[1]) || 0;
          timeSpent = Math.max(0, prevSameColor + increment - clock);
        }
      }
    }

    return {
      san: move.san,
      uci: move.from + move.to + (move.promotion || ''),
      from: move.from,
      to: move.to,
      color: move.color,
      fen: move.after,
      fenBefore: move.before,
      moveNumber: Math.floor(i / 2) + 1,
      promotion: move.promotion,
      captured: move.captured,
      piece: move.piece,
      flags: move.flags,
      clock,
      timeSpent,
    };
  });

  const startingFen = history.length > 0
    ? history[0].before
    : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return { headers, moves, startingFen };
}

export function extractOpeningName(headers: Record<string, string>): { name: string; code: string } {
  const eco = headers['ECO'] || '';
  const ecoUrl = headers['ECOUrl'] || '';

  if (ecoUrl) {
    const match = ecoUrl.match(/\/openings\/(.+)/);
    if (match) {
      const raw = decodeURIComponent(match[1]);
      const name = raw
        .replace(/-/g, ' ')
        .replace(/\.\.\./g, '')
        .trim();
      return { name, code: eco };
    }
  }

  if (headers['Opening']) {
    return { name: headers['Opening'], code: eco };
  }

  return { name: eco || 'Unknown Opening', code: eco };
}

export function formatTime(seconds: number): string {
  if (seconds < 0) return '0.0s';
  if (seconds < 10) return seconds.toFixed(1) + 's';
  if (seconds < 60) return Math.round(seconds) + 's';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${remMins.toString().padStart(2, '0')}:${secs.toFixed(0).padStart(2, '0')}`;
  }
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}
