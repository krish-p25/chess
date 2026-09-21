import { useState } from 'react';
import './UsernameInput.css';

interface Props {
  onSubmit: (username: string) => void;
  loading: boolean;
  loadingProgress: { loaded: number; total: number } | null;
  error: string | null;
}

export function UsernameInput({ onSubmit, loading, loadingProgress, error }: Props) {
  const [username, setUsername] = useState(() => localStorage.getItem('chess-username') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed) {
      localStorage.setItem('chess-username', trimmed);
      onSubmit(trimmed);
    }
  };

  const progressText = loadingProgress
    ? `Loading month ${loadingProgress.loaded + 1} of ${loadingProgress.total}…`
    : null;

  return (
    <div className="username-screen">
      <div className="username-card">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 50 50" width="60" height="60">
              <text x="10" y="38" fontSize="36" fill="#81b64c">&#9822;</text>
            </svg>
          </div>
          <h1>Game Review</h1>
          <p className="subtitle">Analyze your chess.com games with Stockfish</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter chess.com username"
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading || !username.trim()}>
              {loading ? <span className="spinner" /> : 'Review Games'}
            </button>
          </div>
          {loading && progressText && (
            <div className="loading-progress">{progressText}</div>
          )}
          {error && <div className="error-msg">{error}</div>}
        </form>
      </div>
    </div>
  );
}
