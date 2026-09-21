import { useState, useEffect } from 'react';
import type { ChessComGame, AppScreen } from './types';
import { useChesscomApi } from './hooks/useChesscomApi';
import { UsernameInput } from './components/UsernameInput/UsernameInput';
import { GameSelector } from './components/GameSelector/GameSelector';
import { GameReview } from './components/GameReview/GameReview';

function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return { user: p.get('user') || '', game: p.get('game') || '' };
}

function setUrl(user: string, game?: string) {
  const params = new URLSearchParams();
  if (user) params.set('user', user);
  if (game) params.set('game', game);
  const qs = params.toString();
  return qs ? `?${qs}` : '/';
}

function App() {
  const [screen, setScreen] = useState<AppScreen>('username');
  const [username, setUsername] = useState('');
  const [selectedGame, setSelectedGame] = useState<ChessComGame | null>(null);
  const { games, loading, loadingProgress, error, fetchGames } = useChesscomApi();

  // Restore state from URL on initial load
  useEffect(() => {
    const { user, game } = getUrlParams();
    if (!user) return;
    setUsername(user);
    fetchGames(user).then(result => {
      if (result.length === 0) return;
      if (game) {
        const found = result.find(g => g.uuid === game);
        if (found) {
          setSelectedGame(found);
          setScreen('review');
          return;
        }
      }
      setScreen('games');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle browser back / forward
  useEffect(() => {
    function onPopState() {
      const { user, game } = getUrlParams();
      if (!user) {
        setScreen('username');
        setSelectedGame(null);
        return;
      }
      if (!game) {
        setScreen('games');
        setSelectedGame(null);
        return;
      }
      const found = games.find(g => g.uuid === game);
      if (found) {
        setSelectedGame(found);
        setScreen('review');
      } else {
        setScreen('games');
        setSelectedGame(null);
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [games]);

  const handleUsernameSubmit = async (user: string) => {
    setUsername(user);
    history.pushState({}, '', setUrl(user));
    const result = await fetchGames(user);
    if (result.length > 0) setScreen('games');
  };

  const handleGameSelect = (game: ChessComGame) => {
    setSelectedGame(game);
    history.pushState({}, '', setUrl(username, game.uuid));
    setScreen('review');
  };

  const handleBackToGames = () => {
    history.pushState({}, '', setUrl(username));
    setSelectedGame(null);
    setScreen('games');
  };

  const handleBackToUsername = () => {
    history.pushState({}, '', '/');
    setScreen('username');
  };

  switch (screen) {
    case 'username':
      return (
        <UsernameInput
          onSubmit={handleUsernameSubmit}
          loading={loading}
          loadingProgress={loadingProgress}
          error={error}
        />
      );
    case 'games':
      return (
        <GameSelector
          games={games}
          username={username}
          onSelect={handleGameSelect}
          onBack={handleBackToUsername}
        />
      );
    case 'review':
      return selectedGame ? (
        <GameReview
          game={selectedGame}
          username={username}
          onBack={handleBackToGames}
        />
      ) : null;
    default:
      return null;
  }
}

export default App;
