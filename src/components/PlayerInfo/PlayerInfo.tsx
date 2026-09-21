import { formatClock } from '../../utils/pgn';
import './PlayerInfo.css';

interface Props {
  username: string;
  rating: number;
  color: 'white' | 'black';
  clock?: number;
}

export function PlayerInfo({ username, rating, color, clock }: Props) {
  return (
    <div className="player-info">
      <div className="player-identity">
        <div className={`player-color-dot ${color}`} />
        <span className="player-name">{username}</span>
        <span className="player-rating">({rating})</span>
      </div>
      {clock !== undefined && (
        <div className="player-clock">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="clock-value">{formatClock(clock)}</span>
        </div>
      )}
    </div>
  );
}
