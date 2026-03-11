"use client";

import { useEffect, useState } from "react";
import { Cat, ChartLine, Info, PawPrint, RotateCcw, Trophy } from "lucide-react";

const BOARD_SIZE = 11;
const STATS_STORAGE_KEY = "playai_catch_cat_stats";

type Difficulty = "normal" | "cunning" | "trickster";

type Position = {
  x: number;
  y: number;
};

type DifficultyConfig = {
  label: string;
  hint: string;
  wallForecastCount: number;
  lookaheadDepth: number;
  tieWindow: number;
  tieRandomness: number;
  initialObstacles: number;
  trapPenalty: number;
  threatWeight: number;
  baitWeight?: number;
};

type GameState = {
  board: number[][];
  catPosition: Position;
  stepCount: number;
  gameOver: boolean;
  didWin: boolean;
  gameRecorded: boolean;
};

type DifficultyStats = {
  games: number;
  wins: number;
  bestSteps: number | null;
};

type Stats = {
  totalGames: number;
  wins: number;
  losses: number;
  byDifficulty: Record<Difficulty, DifficultyStats>;
};

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  normal: {
    label: "普通",
    hint: "会找最近出口，但偶尔还算讲理。",
    wallForecastCount: 3,
    lookaheadDepth: 2,
    tieWindow: 45,
    tieRandomness: 0.28,
    initialObstacles: 10,
    trapPenalty: 0.9,
    threatWeight: 0.75,
  },
  cunning: {
    label: "狡猾",
    hint: "会绕开你最想堵的点，开始像真猫了。",
    wallForecastCount: 5,
    lookaheadDepth: 2,
    tieWindow: 24,
    tieRandomness: 0.14,
    initialObstacles: 9,
    trapPenalty: 1.1,
    threatWeight: 1,
  },
  trickster: {
    label: "老六",
    hint: "不只会逃，还会故意站在你最想封却最难封死的蜂窝口。",
    wallForecastCount: 7,
    lookaheadDepth: 2,
    tieWindow: 10,
    tieRandomness: 0.04,
    initialObstacles: 8,
    trapPenalty: 1.3,
    threatWeight: 1.25,
    baitWeight: 1.3,
  },
};

function createEmptyStats(): Stats {
  return {
    totalGames: 0,
    wins: 0,
    losses: 0,
    byDifficulty: {
      normal: { games: 0, wins: 0, bestSteps: null },
      cunning: { games: 0, wins: 0, bestSteps: null },
      trickster: { games: 0, wins: 0, bestSteps: null },
    },
  };
}

function createInitialGameState(difficulty: Difficulty): GameState {
  const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  const catPosition = {
    x: Math.floor(BOARD_SIZE / 2),
    y: Math.floor(BOARD_SIZE / 2),
  };

  let placed = 0;
  while (placed < DIFFICULTY_SETTINGS[difficulty].initialObstacles) {
    const x = Math.floor(Math.random() * BOARD_SIZE);
    const y = Math.floor(Math.random() * BOARD_SIZE);
    if (board[y][x] === 0 && (x !== catPosition.x || y !== catPosition.y)) {
      board[y][x] = 1;
      placed += 1;
    }
  }

  return {
    board,
    catPosition,
    stepCount: 0,
    gameOver: false,
    didWin: false,
    gameRecorded: false,
  };
}

function loadStatsFromStorage(): Stats {
  if (typeof window === "undefined") {
    return createEmptyStats();
  }

  try {
    const saved = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (!saved) {
      return createEmptyStats();
    }

    const parsed = JSON.parse(saved) as Partial<Stats>;
    const empty = createEmptyStats();

    return {
      totalGames: parsed.totalGames ?? 0,
      wins: parsed.wins ?? 0,
      losses: parsed.losses ?? 0,
      byDifficulty: {
        normal: { ...empty.byDifficulty.normal, ...(parsed.byDifficulty?.normal ?? {}) },
        cunning: { ...empty.byDifficulty.cunning, ...(parsed.byDifficulty?.cunning ?? {}) },
        trickster: { ...empty.byDifficulty.trickster, ...(parsed.byDifficulty?.trickster ?? {}) },
      },
    };
  } catch {
    return createEmptyStats();
  }
}

function saveStatsToStorage(stats: Stats) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  }
}

function getWinRate(wins: number, games: number) {
  return games === 0 ? "0%" : `${Math.round((wins / games) * 100)}%`;
}

function getHexDirections(row: number) {
  if (row % 2 === 0) {
    return [
      { dx: -1, dy: -1 },
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 1 },
      { dx: 0, dy: 1 },
    ];
  }

  return [
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
  ];
}

function getNeighbors(x: number, y: number) {
  return getHexDirections(y)
    .map((direction) => ({ x: x + direction.dx, y: y + direction.dy }))
    .filter((position) => position.x >= 0 && position.x < BOARD_SIZE && position.y >= 0 && position.y < BOARD_SIZE);
}

function isAtEdge(x: number, y: number) {
  return x === 0 || x === BOARD_SIZE - 1 || y === 0 || y === BOARD_SIZE - 1;
}

function getValidMoves(board: number[][], x: number, y: number) {
  return getNeighbors(x, y).filter((position) => board[position.y][position.x] === 0);
}

function getBoardSnapshot(board: number[][]) {
  return board.map((row) => [...row]);
}

function getHexDistance(ax: number, ay: number, bx: number, by: number) {
  const aCol = ax - (ay - (ay & 1)) / 2;
  const aZ = ay;
  const aY = -aCol - aZ;
  const bCol = bx - (by - (by & 1)) / 2;
  const bZ = by;
  const bY = -bCol - bZ;

  return Math.max(Math.abs(aCol - bCol), Math.abs(aY - bY), Math.abs(aZ - bZ));
}

function getReachabilityMetrics(board: number[][], startX: number, startY: number) {
  const visited = new Set<string>();
  const queue = [{ x: startX, y: startY, dist: 0 }];
  let head = 0;
  let area = 0;
  let edgeCells = 0;
  let shortestEdgeDistance: number | null = null;

  visited.add(`${startX},${startY}`);

  while (head < queue.length) {
    const current = queue[head++];
    area += 1;

    if (isAtEdge(current.x, current.y)) {
      edgeCells += 1;
      if (shortestEdgeDistance === null) {
        shortestEdgeDistance = current.dist;
      }
    }

    for (const next of getNeighbors(current.x, current.y)) {
      const key = `${next.x},${next.y}`;
      if (board[next.y][next.x] !== 0 || visited.has(key)) {
        continue;
      }

      visited.add(key);
      queue.push({ x: next.x, y: next.y, dist: current.dist + 1 });
    }
  }

  return { area, edgeCells, shortestEdgeDistance };
}

function getEscapeRoutes(board: number[][], startX: number, startY: number) {
  const visited = new Set<string>();
  const queue = [{ x: startX, y: startY, dist: 0 }];
  let head = 0;
  let shortestDistance = Number.POSITIVE_INFINITY;
  let routeCount = 0;

  visited.add(`${startX},${startY}`);

  while (head < queue.length) {
    const current = queue[head++];
    if (current.dist > shortestDistance) {
      continue;
    }

    if (isAtEdge(current.x, current.y)) {
      shortestDistance = current.dist;
      routeCount += 1;
      continue;
    }

    for (const next of getNeighbors(current.x, current.y)) {
      const key = `${next.x},${next.y}`;
      if (board[next.y][next.x] !== 0 || visited.has(key)) {
        continue;
      }

      visited.add(key);
      queue.push({ x: next.x, y: next.y, dist: current.dist + 1 });
    }
  }

  return {
    shortestDistance: Number.isFinite(shortestDistance) ? shortestDistance : null,
    routeCount,
  };
}

function countAdjacentWalls(board: number[][], x: number, y: number) {
  let wallCount = 0;
  for (const neighbor of getNeighbors(x, y)) {
    if (board[neighbor.y][neighbor.x] === 1) {
      wallCount += 1;
    }
  }
  return wallCount;
}

function distanceToClosestEdge(x: number, y: number) {
  return Math.min(x, y, BOARD_SIZE - 1 - x, BOARD_SIZE - 1 - y);
}

function estimateFutureSafety(board: number[][], x: number, y: number) {
  const followUpMoves = getValidMoves(board, x, y);
  if (followUpMoves.length === 0) {
    return -800;
  }

  let bestFollowUpScore = Number.NEGATIVE_INFINITY;

  for (const move of followUpMoves) {
    const reachability = getReachabilityMetrics(board, move.x, move.y);
    const routes = getEscapeRoutes(board, move.x, move.y);
    const mobility = getValidMoves(board, move.x, move.y).length;

    let score = reachability.area * 5 + mobility * 32 + routes.routeCount * 24;
    if (routes.shortestDistance !== null) {
      score += 320 - routes.shortestDistance * 42;
    } else {
      score -= 140;
    }

    score -= countAdjacentWalls(board, move.x, move.y) * 55;
    bestFollowUpScore = Math.max(bestFollowUpScore, score);
  }

  return bestFollowUpScore;
}

function getCandidateWalls(board: number[][], maxCount: number, fromPosition: Position) {
  const candidates: Array<{ x: number; y: number; priority: number }> = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (board[row][column] !== 0 || (column === fromPosition.x && row === fromPosition.y)) {
        continue;
      }

      const distance = getHexDistance(column, row, fromPosition.x, fromPosition.y);
      if (distance > 3) {
        continue;
      }

      const adjacencyToCat = getNeighbors(fromPosition.x, fromPosition.y).some((neighbor) => neighbor.x === column && neighbor.y === row);
      const edgeBias = isAtEdge(column, row) ? 40 : 0;
      const centralityPenalty = distance * 12;

      candidates.push({
        x: column,
        y: row,
        priority: (adjacencyToCat ? 180 : 0) + edgeBias - centralityPenalty,
      });
    }
  }

  candidates.sort((left, right) => right.priority - left.priority);
  return candidates.slice(0, maxCount);
}

function getBaitScore(board: number[][], x: number, y: number, difficulty: Difficulty) {
  const config = DIFFICULTY_SETTINGS[difficulty];
  if (difficulty !== "trickster") {
    return 0;
  }

  const candidateWalls = getCandidateWalls(board, 4, { x, y });
  if (candidateWalls.length === 0) {
    return 0;
  }

  let baitScore = 0;

  for (const candidate of candidateWalls) {
    const snapshot = getBoardSnapshot(board);
    snapshot[candidate.y][candidate.x] = 1;

    const responseMoves = getValidMoves(snapshot, x, y);
    const routesAfterWall = getEscapeRoutes(snapshot, x, y);
    const stillEscapable = routesAfterWall.shortestDistance !== null;
    const responseBonus = responseMoves.length >= 2 ? 130 : 0;
    const routeBonus = stillEscapable ? routesAfterWall.routeCount * 42 : -160;
    const lureBonus = getHexDistance(candidate.x, candidate.y, x, y) === 1 ? 68 : 28;

    baitScore = Math.max(baitScore, responseBonus + routeBonus + lureBonus);
  }

  const nearbyWalls = countAdjacentWalls(board, x, y);
  const pressureBonus = nearbyWalls >= 2 && nearbyWalls <= 3 ? 110 : 0;
  const mobility = getValidMoves(board, x, y).length;
  const mobilityBonus = mobility >= 2 && mobility <= 4 ? 90 : 0;

  return (baitScore + pressureBonus + mobilityBonus) * (config.baitWeight ?? 1);
}

function scoreBoardForCat(board: number[][], x: number, y: number, difficulty: Difficulty) {
  const config = DIFFICULTY_SETTINGS[difficulty];
  if (isAtEdge(x, y)) {
    return Number.MAX_SAFE_INTEGER;
  }

  const reachability = getReachabilityMetrics(board, x, y);
  const routes = getEscapeRoutes(board, x, y);
  const mobility = getValidMoves(board, x, y).length;
  const nearbyWalls = countAdjacentWalls(board, x, y);
  const futureSafety = estimateFutureSafety(board, x, y);
  const edgeDistance = distanceToClosestEdge(x, y);
  const baitScore = getBaitScore(board, x, y, difficulty);

  let score = reachability.area * 16;
  score += mobility * 94;
  score += futureSafety;
  score -= nearbyWalls * 128 * config.trapPenalty;
  score -= edgeDistance * 12;

  if (routes.shortestDistance !== null) {
    score += 4600 - routes.shortestDistance * 280;
    score += routes.routeCount * 90;
  } else {
    score -= 1800;
  }

  if (reachability.shortestEdgeDistance !== null) {
    score += 2200 - reachability.shortestEdgeDistance * 120;
    score += reachability.edgeCells * 55;
  } else {
    score -= 950;
  }

  score += baitScore;

  return score;
}

function forecastPlayerWall(board: number[][], move: Position, difficulty: Difficulty) {
  const config = DIFFICULTY_SETTINGS[difficulty];
  const candidateWalls = getCandidateWalls(board, config.wallForecastCount, move);
  let bestWall: Position | null = null;
  let strongestThreat = Number.NEGATIVE_INFINITY;

  for (const candidate of candidateWalls) {
    const snapshot = getBoardSnapshot(board);
    snapshot[candidate.y][candidate.x] = 1;
    const threat = -scoreBoardForCat(snapshot, move.x, move.y, difficulty);

    if (threat > strongestThreat) {
      strongestThreat = threat;
      bestWall = candidate;
    }
  }

  return {
    wall: bestWall,
    threat: strongestThreat > Number.NEGATIVE_INFINITY ? strongestThreat : 0,
  };
}

function evaluateMove(board: number[][], x: number, y: number, difficulty: Difficulty, lookaheadDepth: number) {
  const config = DIFFICULTY_SETTINGS[difficulty];
  let score = scoreBoardForCat(board, x, y, difficulty);

  if (lookaheadDepth > 0) {
    const forecast = forecastPlayerWall(board, { x, y }, difficulty);
    score -= forecast.threat * 0.55 * config.threatWeight;

    if (lookaheadDepth > 1 && forecast.wall) {
      const snapshot = getBoardSnapshot(board);
      snapshot[forecast.wall.y][forecast.wall.x] = 1;

      const responseMoves = getValidMoves(snapshot, x, y);
      if (responseMoves.length === 0) {
        score -= 2800;
      } else {
        let bestResponse = Number.NEGATIVE_INFINITY;
        for (const response of responseMoves) {
          bestResponse = Math.max(bestResponse, scoreBoardForCat(snapshot, response.x, response.y, difficulty));
        }
        score += bestResponse * 0.72;
      }
    }
  }

  return score;
}

function moveCat(board: number[][], catPosition: Position, difficulty: Difficulty) {
  const config = DIFFICULTY_SETTINGS[difficulty];
  const moves = getValidMoves(board, catPosition.x, catPosition.y);
  if (moves.length === 0) {
    return catPosition;
  }

  const evaluatedMoves = moves
    .map((move) => ({
      move,
      score: evaluateMove(board, move.x, move.y, difficulty, config.lookaheadDepth),
    }))
    .sort((left, right) => right.score - left.score);

  const bestScore = evaluatedMoves[0].score;
  const nearBestMoves = evaluatedMoves.filter((item) => item.score >= bestScore - config.tieWindow);
  const choicePool = Math.random() < config.tieRandomness ? nearBestMoves : [nearBestMoves[0]];
  return choicePool[Math.floor(Math.random() * choicePool.length)]!.move;
}

function checkWin(board: number[][], catPosition: Position) {
  return getValidMoves(board, catPosition.x, catPosition.y).length === 0;
}

function getBestRecordSummary(stats: Stats) {
  const bestValues = Object.values(stats.byDifficulty)
    .map((item) => item.bestSteps)
    .filter((value): value is number => value !== null);

  if (bestValues.length === 0) {
    return "--";
  }

  return `${Math.min(...bestValues)}步`;
}

export function CatchTheCatGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [stats, setStats] = useState<Stats>(createEmptyStats());
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState("normal"));
  const [hasLoadedStats, setHasLoadedStats] = useState(false);

  useEffect(() => {
    setStats(loadStatsFromStorage());
    setHasLoadedStats(true);
  }, []);

  useEffect(() => {
    if (hasLoadedStats) {
      saveStatsToStorage(stats);
    }
  }, [hasLoadedStats, stats]);

  const resetGame = (nextDifficulty = difficulty) => {
    setGameState(createInitialGameState(nextDifficulty));
  };

  const recordGameResult = (didWin: boolean, steps: number) => {
    setStats((current) => {
      const next = structuredClone(current) as Stats;
      next.totalGames += 1;
      if (didWin) {
        next.wins += 1;
      } else {
        next.losses += 1;
      }

      const difficultyStats = next.byDifficulty[difficulty];
      difficultyStats.games += 1;
      if (didWin) {
        difficultyStats.wins += 1;
        if (difficultyStats.bestSteps === null || steps < difficultyStats.bestSteps) {
          difficultyStats.bestSteps = steps;
        }
      }

      return next;
    });
  };

  const handleDifficultyChange = (nextDifficulty: Difficulty) => {
    if (nextDifficulty === difficulty) {
      return;
    }

    setDifficulty(nextDifficulty);
    setGameState(createInitialGameState(nextDifficulty));
  };

  const handleCellClick = (x: number, y: number) => {
    setGameState((current) => {
      if (current.gameOver || current.board[y][x] !== 0) {
        return current;
      }

      const nextBoard = getBoardSnapshot(current.board);
      nextBoard[y][x] = 1;
      const nextStepCount = current.stepCount + 1;

      if (checkWin(nextBoard, current.catPosition)) {
        if (!current.gameRecorded) {
          recordGameResult(true, nextStepCount);
        }

        return {
          ...current,
          board: nextBoard,
          stepCount: nextStepCount,
          gameOver: true,
          didWin: true,
          gameRecorded: true,
        };
      }

      const nextCatPosition = moveCat(nextBoard, current.catPosition, difficulty);

      if (isAtEdge(nextCatPosition.x, nextCatPosition.y)) {
        if (!current.gameRecorded) {
          recordGameResult(false, nextStepCount);
        }

        return {
          ...current,
          board: nextBoard,
          catPosition: nextCatPosition,
          stepCount: nextStepCount,
          gameOver: true,
          didWin: false,
          gameRecorded: true,
        };
      }

      if (checkWin(nextBoard, nextCatPosition)) {
        if (!current.gameRecorded) {
          recordGameResult(true, nextStepCount);
        }

        return {
          ...current,
          board: nextBoard,
          catPosition: nextCatPosition,
          stepCount: nextStepCount,
          gameOver: true,
          didWin: true,
          gameRecorded: true,
        };
      }

      return {
        ...current,
        board: nextBoard,
        catPosition: nextCatPosition,
        stepCount: nextStepCount,
      };
    });
  };

  const currentConfig = DIFFICULTY_SETTINGS[difficulty];

  return (
    <div className="mx-auto max-w-xl">
      <style jsx>{`
        .game-board-shell {
          background:
            radial-gradient(circle at top, rgba(0, 113, 227, 0.12), transparent 42%),
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.7));
        }

        .hex-row {
          display: flex;
          gap: 0.45rem;
          margin-top: -0.42rem;
        }

        .hex-row:first-child {
          margin-top: 0;
        }

        .hex-row.offset {
          margin-left: 1.45rem;
        }

        .game-cell {
          width: 2.7rem;
          height: 2.7rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 10px 18px rgba(17, 24, 39, 0.08);
          transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .game-cell:hover:not(.occupied):not(.cat) {
          transform: translateY(-1px) scale(1.04);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 12px 22px rgba(0, 113, 227, 0.16);
        }

        .cat-icon {
          animation: catBounce 1s ease-in-out infinite;
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.18));
        }

        @keyframes catBounce {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-3px);
          }
        }

        .wall {
          background: radial-gradient(circle at 30% 30%, #4b4b4f 0%, #1d1d1f 70%);
        }

        .board-edge {
          background: radial-gradient(circle at 30% 30%, #eff7ff 0%, #d7e9ff 72%);
        }

        .board-empty {
          background: radial-gradient(circle at 30% 30%, #ffffff 0%, #eff0f6 72%);
        }

        .win-glow {
          box-shadow: 0 0 60px rgba(34, 197, 94, 0.4);
        }

        .lose-glow {
          box-shadow: 0 0 60px rgba(239, 68, 68, 0.4);
        }

        .difficulty-chip {
          transition: all 0.2s ease;
        }

        .difficulty-chip:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.12);
        }

        .stats-card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 245, 247, 0.9));
        }

        .stats-card.active {
          border-color: rgba(0, 113, 227, 0.25);
          box-shadow: 0 14px 32px rgba(0, 113, 227, 0.1);
        }

        @media (max-width: 640px) {
          .hex-row.offset {
            margin-left: 1.15rem;
          }

          .game-cell {
            width: 2.3rem;
            height: 2.3rem;
          }
        }
      `}</style>

      <div className="mb-8 text-center animate-fade-in-up">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white px-4 py-2 shadow-sm">
          <PawPrint className="h-4 w-4 text-apple-blue" />
          <span className="text-sm font-medium">益智游戏</span>
        </div>
        <h1 className="mb-2 text-3xl font-semibold">围住小猫</h1>
        <p className="text-sm text-apple-text">蜂窝圆点版更接近原作视觉，小猫还会故意摆出诱导走位，专门骗你下错那一堵墙。</p>
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-fade-in-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-center">
            <p className="mb-1 text-xs text-apple-text">步数</p>
            <p className="text-2xl font-semibold">{gameState.stepCount}</p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs text-apple-text">状态</p>
            <p className={`text-sm font-medium ${gameState.gameOver ? (gameState.didWin ? "text-green-500" : "text-red-500") : "text-apple-blue"}`}>
              {gameState.gameOver ? (gameState.didWin ? "胜利！🎉" : "失败😢") : "进行中"}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs text-apple-text">难度</p>
            <p className="text-sm font-medium text-apple-dark">{currentConfig.label}</p>
          </div>
          <button type="button" onClick={() => resetGame()} className="rounded-full bg-apple-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800">
            <RotateCcw className="mr-1 inline-block h-4 w-4" />重置
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-apple-text">猫猫脑回路</span>
          {Object.entries(DIFFICULTY_SETTINGS).map(([key, config]) => {
            const typedKey = key as Difficulty;
            const isActive = typedKey === difficulty;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDifficultyChange(typedKey)}
                className={`difficulty-chip rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-apple-blue bg-apple-blue text-white shadow-sm"
                    : "border-gray-200 bg-gray-50 text-apple-dark hover:bg-gray-100"
                }`}
              >
                {config.label}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-apple-text">{currentConfig.hint}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="stats-card rounded-2xl border border-gray-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-apple-text">本地战绩</p>
              <ChartLine className="h-4 w-4 text-apple-blue" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="mb-1 text-[11px] text-apple-text">总局数</p>
                <p className="text-xl font-semibold">{stats.totalGames}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-apple-text">胜率</p>
                <p className="text-xl font-semibold">{getWinRate(stats.wins, stats.totalGames)}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-apple-text">最佳纪录</p>
                <p className="text-xl font-semibold">{getBestRecordSummary(stats)}</p>
              </div>
            </div>
          </div>

          <div className="stats-card rounded-2xl border border-gray-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-apple-text">难度纪录</p>
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {Object.entries(DIFFICULTY_SETTINGS).map(([key, config]) => {
                const typedKey = key as Difficulty;
                const item = stats.byDifficulty[typedKey];

                return (
                  <div key={key} className={`stats-card rounded-2xl border border-gray-100 px-3 py-3 ${typedKey === difficulty ? "active" : ""}`}>
                    <p className="mb-1 text-xs font-semibold">{config.label}</p>
                    <p className="text-[11px] text-apple-text">{getWinRate(item.wins, item.games)}</p>
                    <p className="mt-1 text-[11px] text-apple-text">{item.games}局</p>
                    <p className="mt-2 text-sm font-semibold">{item.bestSteps === null ? "--" : `${item.bestSteps}步`}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={`game-board-shell mx-auto animate-fade-in-up rounded-3xl border border-gray-100 p-4 shadow-lg sm:p-5 ${gameState.gameOver ? (gameState.didWin ? "win-glow" : "lose-glow") : ""}`} style={{ width: "fit-content" }}>
        {gameState.board.map((row, y) => (
          <div key={y} className={`hex-row ${y % 2 === 1 ? "offset" : ""}`}>
            {row.map((cell, x) => {
              const isCat = x === gameState.catPosition.x && y === gameState.catPosition.y;
              const isWall = cell === 1;
              const isEdge = isAtEdge(x, y);

              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  onClick={() => handleCellClick(x, y)}
                  disabled={isWall || isCat || gameState.gameOver}
                  className={`game-cell flex items-center justify-center text-lg ${
                    isCat ? "cat bg-yellow-100" : isWall ? "wall occupied" : isEdge ? "board-edge" : "board-empty"
                  } ${isWall || isCat || gameState.gameOver ? "cursor-default" : "cursor-pointer"}`}
                  aria-label={`第 ${y + 1} 行，第 ${x + 1} 列`}
                >
                  {isCat ? <Cat className="cat-icon h-6 w-6 text-apple-dark" /> : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white/50 p-5 animate-fade-in-up">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Info className="h-5 w-5 text-apple-blue" />
          游戏规则
        </h3>
        <ul className="space-y-2 text-sm text-apple-text">
          <li>点击圆形蜂窝空格放置障碍物，视觉和节奏都更接近原作。</li>
          <li>每放置一个障碍物，小猫会先看眼前，再预判你下一堵墙后的局面。</li>
          <li>老六模式会故意站在你最想封却又很难真正封死的位置，专门诱导你失误。</li>
          <li>页面会自动记录本地胜率和各难度最佳步数，能直观看出难度差异。</li>
        </ul>
      </div>
    </div>
  );
}