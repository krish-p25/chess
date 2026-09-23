# Chess Match Analysis

A web-based tool for analyzing Chess.com games using the Stockfish chess engine. View your games, step through moves, and see computer evaluations for every position.

## Features

- **Chess.com Integration**: Fetch games directly from any Chess.com player profile
- **Real-time Analysis**: Analyze positions using Stockfish 18 engine
- **Interactive Board**: Step through moves with a visual chessboard
- **Evaluation Display**: See move evaluations with a visual eval bar
- **Game Filtering**: Filter games by color (white/black), result (win/loss/draw), and time control
- **Browser History**: Navigate through games and positions with browser back/forward

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Chess Logic**: chess.js
- **Chessboard UI**: react-chessboard
- **Engine**: Stockfish 18 (WASM)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5173` by default.

### Build

```bash
npm run build
```

## How to Use

1. **Enter a Chess.com Username**: Start by typing in any Chess.com username
2. **Select a Game**: Browse your games with filtering options (color, result, time control)
3. **Analyze**: View the game board, move list, and engine evaluations
4. **Navigate**: Step through moves or click on any move to jump to that position

## Project Structure

```
src/
├── components/          # React UI components
│   ├── Board/          # Interactive chessboard display
│   ├── GameSelector/   # Game list and filtering
│   ├── GameReview/     # Game analysis view
│   ├── MoveList/       # Move notation and navigation
│   ├── EvalBar/        # Position evaluation display
│   ├── PlayerInfo/     # Player details display
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useChessGame    # Game state management
│   ├── useChesscomApi  # Chess.com API integration
│   └── useStockfish    # Engine analysis
├── services/           # Business logic
│   ├── chesscom.ts    # Chess.com API client
│   ├── engine.ts      # Stockfish engine wrapper
│   └── ...
└── types/             # TypeScript type definitions
```

## Performance Notes

- Stockfish analysis runs in a Web Worker to avoid blocking the UI
- Games are fetched from Chess.com's public API with pagination support
- Analysis can take several minutes for full games depending on position complexity

## Linting

```bash
npm run lint
```
