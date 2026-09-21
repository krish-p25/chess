import type { ChessComGame } from '../types';

const BASE_URL = 'https://api.chess.com/pub';

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });
  if (res.status === 404) throw new Error('Player not found');
  if (res.status === 429) throw new Error('Rate limited. Please wait a moment and try again.');
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function getRecentArchiveUrls(archives: string[], months = 3): string[] {
  const now = new Date();
  const targets = new Set<string>();

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    targets.add(`${year}/${month}`);
  }

  return archives.filter(url => {
    const match = url.match(/(\d{4}\/\d{2})$/);
    return match && targets.has(match[1]);
  }).reverse(); // most recent first
}

export async function fetchRecentGames(
  username: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<ChessComGame[]> {
  const { archives } = await apiFetch<{ archives: string[] }>(
    `${BASE_URL}/player/${encodeURIComponent(username.toLowerCase())}/games/archives`
  );

  if (!archives.length) return [];

  const archivesToFetch = getRecentArchiveUrls(archives, 3);
  if (!archivesToFetch.length) return [];

  const allGames: ChessComGame[] = [];

  for (let i = 0; i < archivesToFetch.length; i++) {
    onProgress?.(i, archivesToFetch.length);
    const { games } = await apiFetch<{ games: ChessComGame[] }>(archivesToFetch[i]);
    const chessGames = games.filter(g => g.rules === 'chess' && g.pgn);
    allGames.push(...chessGames);
  }

  onProgress?.(archivesToFetch.length, archivesToFetch.length);
  return allGames.sort((a, b) => b.end_time - a.end_time);
}

export function formatTimeControl(tc: string): string {
  const parts = tc.split('+');
  const base = parseInt(parts[0]);
  const inc = parts[1] ? parseInt(parts[1]) : 0;

  if (base < 60) return `${base}s${inc ? `+${inc}` : ''}`;
  const mins = Math.floor(base / 60);
  return inc ? `${mins}|${inc}` : `${mins} min`;
}

export function getPlayerResult(result: string): 'win' | 'loss' | 'draw' {
  if (result === 'win') return 'win';
  if (['agreed', 'stalemate', 'repetition', 'insufficient', '50move', 'timevsinsufficient'].includes(result))
    return 'draw';
  return 'loss';
}
