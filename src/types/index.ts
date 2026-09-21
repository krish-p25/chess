export interface ChessComPlayer {
  rating: number;
  result: string;
  '@id': string;
  username: string;
  uuid: string;
}

export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  accuracies?: { white: number; black: number };
  uuid: string;
  initial_setup: string;
  fen: string;
  time_class: string;
  rules: string;
  white: ChessComPlayer;
  black: ChessComPlayer;
  eco?: string;
}

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'book'
  | 'forced';

export interface ClassificationInfo {
  name: string;
  symbol: string;
  color: string;
}

export interface EngineEvaluation {
  type: 'cp' | 'mate';
  value: number;
}

export interface PositionAnalysis {
  fen: string;
  depth: number;
  evaluation: EngineEvaluation;
  bestMove: string;
  pv: string;
}

export interface ParsedMove {
  san: string;
  uci: string;
  from: string;
  to: string;
  color: 'w' | 'b';
  fen: string;
  fenBefore: string;
  moveNumber: number;
  promotion?: string;
  captured?: string;
  piece: string;
  flags: string;
  clock?: number;
  timeSpent?: number;
}

export interface ParsedGame {
  headers: Record<string, string>;
  moves: ParsedMove[];
  startingFen: string;
}

export interface MoveAnalysis {
  moveIndex: number;
  san: string;
  uci: string;
  color: 'w' | 'b';
  from: string;
  to: string;
  fen: string;
  evalBefore: EngineEvaluation;
  evalAfter: EngineEvaluation;
  bestMoveEval: EngineEvaluation;
  bestMoveSan: string;
  bestMoveUci: string;
  wpLoss: number;
  classification: MoveClassification;
  isSacrifice: boolean;
}

export type AppScreen = 'username' | 'games' | 'review';
