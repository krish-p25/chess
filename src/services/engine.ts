import type { EngineEvaluation, PositionAnalysis } from '../types';

function parseScore(line: string): EngineEvaluation | null {
  const match = line.match(/\bscore (cp|mate) (-?\d+)/);
  if (!match) return null;
  return {
    type: match[1] as 'cp' | 'mate',
    value: parseInt(match[2]),
  };
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private messageHandler: ((line: string) => void) | null = null;
  private ready = false;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker('/stockfish/stockfish-18-lite-single.js');
      } catch {
        reject(new Error('Failed to create Stockfish worker'));
        return;
      }

      this.worker.onmessage = (e: MessageEvent) => {
        const line = typeof e.data === 'string' ? e.data : '';
        if (this.messageHandler) {
          this.messageHandler(line);
        }
      };

      this.worker.onerror = () => reject(new Error('Stockfish worker error'));

      this.sendAndWait('uci', 'uciok')
        .then(() => {
          this.send('setoption name MultiPV value 1');
          return this.sendAndWait('isready', 'readyok');
        })
        .then(() => {
          this.ready = true;
          resolve();
        })
        .catch(reject);
    });
  }

  private send(cmd: string): void {
    this.worker?.postMessage(cmd);
  }

  private sendAndWait(cmd: string, waitFor: string): Promise<void> {
    return new Promise((resolve) => {
      this.messageHandler = (line: string) => {
        if (line.includes(waitFor)) {
          this.messageHandler = null;
          resolve();
        }
      };
      this.send(cmd);
    });
  }

  async analyze(fen: string, depth = 18): Promise<PositionAnalysis> {
    if (!this.ready || !this.worker) throw new Error('Engine not initialized');

    const isBlackToMove = fen.split(' ')[1] === 'b';

    return new Promise((resolve) => {
      let bestEval: EngineEvaluation = { type: 'cp', value: 0 };
      let bestMove = '';
      let bestPv = '';
      let bestDepth = 0;

      this.messageHandler = (line: string) => {
        if (line.startsWith('info') && line.includes('score') && !line.includes('upperbound') && !line.includes('lowerbound')) {
          const depthMatch = line.match(/\bdepth (\d+)/);
          const score = parseScore(line);
          const pvMatch = line.match(/\bpv (.+)/);
          const currentDepth = depthMatch ? parseInt(depthMatch[1]) : 0;

          if (score && currentDepth >= bestDepth) {
            bestDepth = currentDepth;
            bestEval = score;
            if (pvMatch) bestPv = pvMatch[1];
          }
        }

        if (line.startsWith('bestmove')) {
          const moveMatch = line.match(/^bestmove\s+(\S+)/);
          bestMove = moveMatch ? moveMatch[1] : '';
          this.messageHandler = null;

          // Normalize evaluation to always be from white's perspective.
          // Stockfish reports from side-to-move's perspective.
          if (isBlackToMove) {
            bestEval = { type: bestEval.type, value: -bestEval.value };
          }

          resolve({
            fen,
            depth: bestDepth,
            evaluation: bestEval,
            bestMove,
            pv: bestPv,
          });
        }
      };

      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);
    });
  }

  newGame(): void {
    this.send('ucinewgame');
  }

  stop(): void {
    this.send('stop');
  }

  destroy(): void {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }
}
