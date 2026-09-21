import { useState, useMemo } from 'react';
import type { ChessComGame } from '../../types';
import { formatTimeControl, getPlayerResult } from '../../services/chesscom';
import './GameSelector.css';

interface Props {
  games: ChessComGame[];
  username: string;
  onSelect: (game: ChessComGame) => void;
  onBack: () => void;
}

type ColorFilter = 'all' | 'white' | 'black';
type ResultFilter = 'all' | 'win' | 'loss' | 'draw';
type TimeFilter = 'all' | 'bullet' | 'blitz' | 'rapid' | 'classical' | 'daily';

function formatDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTimeClassIcon(tc: string): string {
  switch (tc) {
    case 'bullet': return '⚡';
    case 'blitz': return '🔥';
    case 'rapid': return '🕒';
    case 'daily': return '📅';
    default: return '♟';
  }
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`filter-chip ${active ? 'filter-chip-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const GAMES_PER_PAGE = 20;

export function GameSelector({ games, username, onSelect, onBack }: Props) {
  const lowerUser = username.toLowerCase();
  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState<ColorFilter>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [page, setPage] = useState(1);

  function resetPage() { setPage(1); }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games.filter(game => {
      const isWhite = game.white.username.toLowerCase() === lowerUser;
      const player = isWhite ? game.white : game.black;
      const opponent = isWhite ? game.black : game.white;
      const result = getPlayerResult(player.result);

      if (q && !opponent.username.toLowerCase().includes(q)) return false;
      if (colorFilter === 'white' && !isWhite) return false;
      if (colorFilter === 'black' && isWhite) return false;
      if (resultFilter !== 'all' && result !== resultFilter) return false;
      if (timeFilter !== 'all' && game.time_class !== timeFilter) return false;

      return true;
    });
  }, [games, lowerUser, search, colorFilter, resultFilter, timeFilter]);

  const availableTimeClasses = useMemo(() => {
    const seen = new Set(games.map(g => g.time_class));
    return (['bullet', 'blitz', 'rapid', 'classical', 'daily'] as TimeFilter[]).filter(
      t => t === 'all' || seen.has(t)
    );
  }, [games]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / GAMES_PER_PAGE));
  const clampedPage = Math.min(page, totalPages);
  const paginatedGames = filtered.slice((clampedPage - 1) * GAMES_PER_PAGE, clampedPage * GAMES_PER_PAGE);

  const hasActiveFilter = search || colorFilter !== 'all' || resultFilter !== 'all' || timeFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setColorFilter('all');
    setResultFilter('all');
    setTimeFilter('all');
    setPage(1);
  }

  return (
    <div className="game-selector-screen">
      <div className="game-selector-container">
        <div className="game-selector-header">
          <button className="back-btn" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2>Games for <span className="username-highlight">{username}</span></h2>
        </div>

        <div className="filter-bar">
          <div className="search-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search opponent..."
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <FilterChip label="Both" active={colorFilter === 'all'} onClick={() => { setColorFilter('all'); resetPage(); }} />
              <FilterChip label="○ White" active={colorFilter === 'white'} onClick={() => { setColorFilter('white'); resetPage(); }} />
              <FilterChip label="● Black" active={colorFilter === 'black'} onClick={() => { setColorFilter('black'); resetPage(); }} />
            </div>

            <div className="filter-group">
              <FilterChip label="All" active={resultFilter === 'all'} onClick={() => { setResultFilter('all'); resetPage(); }} />
              <FilterChip label="Win" active={resultFilter === 'win'} onClick={() => { setResultFilter('win'); resetPage(); }} />
              <FilterChip label="Draw" active={resultFilter === 'draw'} onClick={() => { setResultFilter('draw'); resetPage(); }} />
              <FilterChip label="Loss" active={resultFilter === 'loss'} onClick={() => { setResultFilter('loss'); resetPage(); }} />
            </div>

            <div className="filter-group">
              <FilterChip label="All" active={timeFilter === 'all'} onClick={() => { setTimeFilter('all'); resetPage(); }} />
              {availableTimeClasses.map(tc => (
                <FilterChip
                  key={tc}
                  label={`${getTimeClassIcon(tc)} ${tc.charAt(0).toUpperCase() + tc.slice(1)}`}
                  active={timeFilter === tc}
                  onClick={() => { setTimeFilter(tc); resetPage(); }}
                />
              ))}
            </div>
          </div>

          <div className="filter-status">
            <span>
              {filtered.length === 0
                ? '0 games'
                : `${(clampedPage - 1) * GAMES_PER_PAGE + 1}–${Math.min(clampedPage * GAMES_PER_PAGE, filtered.length)} of ${filtered.length} games`}
              {hasActiveFilter && ` (${games.length} total)`}
            </span>
            {hasActiveFilter && (
              <button className="clear-filters" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        </div>

        <div className="game-list">
          {filtered.length === 0 ? (
            <div className="no-results">No games match your filters</div>
          ) : (
            paginatedGames.map((game) => {
              const isWhite = game.white.username.toLowerCase() === lowerUser;
              const player = isWhite ? game.white : game.black;
              const opponent = isWhite ? game.black : game.white;
              const result = getPlayerResult(player.result);

              return (
                <div
                  key={game.uuid}
                  className="game-row"
                  onClick={() => onSelect(game)}
                >
                  <div className={`result-indicator result-${result}`}>
                    {result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D'}
                  </div>

                  <div className="game-info">
                    <div className="game-opponent">
                      <span className="opponent-color">{isWhite ? '○' : '●'}</span>
                      <span className="opponent-name">{opponent.username}</span>
                      <span className="opponent-rating">({opponent.rating})</span>
                    </div>
                    <div className="game-meta">
                      <span className="time-class">
                        {getTimeClassIcon(game.time_class)} {formatTimeControl(game.time_control)}
                      </span>
                      <span className="game-date">{formatDate(game.end_time)}</span>
                    </div>
                  </div>

                  <div className="game-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={clampedPage === 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="page-info">Page {clampedPage} of {totalPages}</span>
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={clampedPage === totalPages}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
