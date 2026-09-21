import { useState } from 'react';
import { fetchRecentGames } from '../services/chesscom';
import type { ChessComGame } from '../types';

export function useChesscomApi() {
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async (username: string): Promise<ChessComGame[]> => {
    setLoading(true);
    setError(null);
    setLoadingProgress(null);
    try {
      const result = await fetchRecentGames(username, (loaded, total) => {
        setLoadingProgress({ loaded, total });
      });
      setGames(result);
      if (result.length === 0) {
        setError('No recent games found for this player.');
        return [];
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
      setGames([]);
      return [];
    } finally {
      setLoading(false);
      setLoadingProgress(null);
    }
  };

  return { games, loading, loadingProgress, error, fetchGames };
}
