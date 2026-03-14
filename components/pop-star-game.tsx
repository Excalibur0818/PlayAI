"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  Sparkles,
  Trophy,
  Target,
  Heart,
  PartyPopper,
  ArrowRight,
  CircleOff,
} from "lucide-react";

const BOARD_SIZE = 10;
const TILE_TOTAL = BOARD_SIZE * BOARD_SIZE;
const MIN_COLOR_COUNT = 16;
const MAX_COLOR_COUNT = 24;
const STORAGE_KEY = "playai_pop_star_stats";
const REMOVE_ANIMATION_MS = 240;
const FALL_ANIMATION_MS = 520;
const COMBO_WINDOW_MS = 2200;
const COMBO_POPUP_MS = 1200;
const PARTICLE_ANIMATION_MS = 780;
const BIG_GROUP_THRESHOLD = 8;
const PRAISE_POPUP_MS = 1350;
const HUGE_GROUP_THRESHOLD = 12;
const FLASH_POPUP_MS = 520;

const TILE_COLORS = ["red", "green", "blue", "yellow", "purple"] as const;

type TileColor = (typeof TILE_COLORS)[number];

type Tile = {
  id: number;
  color: TileColor;
};

type Board = Array<Array<Tile | null>>;

type GameStatus = "playing" | "cleared" | "failed";

type StageSetup = {
  board: Board;
  colorCounts: Record<TileColor, number>;
};

type GameState = {
  board: Board;
  level: number;
  score: number;
  targetScore: number;
  status: GameStatus;
  lastCleared: number;
  lastGain: number;
  bonusAwarded: number;
  colorCounts: Record<TileColor, number>;
  remainingTiles: number;
};

type Stats = {
  gamesPlayed: number;
  bestScore: number;
  bestLevel: number;
};

type FallingMotion = {
  distance: number;
  horizontalShift: number;
};

type Particle = {
  id: string;
  row: number;
  col: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  glow: string;
  symbol: string;
};

type PraiseBanner = {
  title: string;
  subtitle: string;
};

type ScoreBurst = {
  label: string;
  tone: "normal" | "perfect";
};

const TILE_STYLES: Record<
  TileColor,
  { label: string; emoji: string; gradient: string; shadow: string; ring: string }
> = {
  red: {
    label: "红",
    emoji: "🍓",
    gradient: "linear-gradient(135deg, #ff8b94 0%, #ff6b6b 55%, #ff8e72 100%)",
    shadow: "0 10px 22px rgba(255, 107, 107, 0.28)",
    ring: "rgba(255, 107, 107, 0.3)",
  },
  green: {
    label: "绿",
    emoji: "🍐",
    gradient: "linear-gradient(135deg, #9ddf8f 0%, #6bcb77 55%, #47b96b 100%)",
    shadow: "0 10px 22px rgba(107, 203, 119, 0.28)",
    ring: "rgba(107, 203, 119, 0.28)",
  },
  blue: {
    label: "蓝",
    emoji: "🫐",
    gradient: "linear-gradient(135deg, #91c8ff 0%, #74b9ff 55%, #4c8ee8 100%)",
    shadow: "0 10px 22px rgba(116, 185, 255, 0.28)",
    ring: "rgba(116, 185, 255, 0.28)",
  },
  yellow: {
    label: "黄",
    emoji: "🍋",
    gradient: "linear-gradient(135deg, #ffe39a 0%, #ffd166 55%, #ffb347 100%)",
    shadow: "0 10px 22px rgba(255, 209, 102, 0.28)",
    ring: "rgba(255, 209, 102, 0.28)",
  },
  purple: {
    label: "紫",
    emoji: "🍇",
    gradient: "linear-gradient(135deg, #d4b5ff 0%, #b388ff 55%, #8f6bff 100%)",
    shadow: "0 10px 22px rgba(179, 136, 255, 0.28)",
    ring: "rgba(179, 136, 255, 0.28)",
  },
};

let nextTileId = 1;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function emptyStats(): Stats {
  return {
    gamesPlayed: 0,
    bestScore: 0,
    bestLevel: 1,
  };
}

function loadStats(): Stats {
  if (typeof window === "undefined") {
    return emptyStats();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyStats();
    }

    return { ...emptyStats(), ...JSON.parse(raw) };
  } catch {
    return emptyStats();
  }
}

function saveStats(stats: Stats) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }
}

function calculateStageTarget(level: number) {
  return 1000 + (level - 1) * 2000;
}

function calculateClearScore(size: number) {
  return size * size * 5;
}

function calculateBonus(remainingTiles: number) {
  return Math.max(0, 2000 - remainingTiles * remainingTiles * 20);
}

function buildRandomColorCounts(): Record<TileColor, number> {
  const counts = {} as Record<TileColor, number>;
  let remaining = TILE_TOTAL;

  TILE_COLORS.forEach((color, index) => {
    const remainingColors = TILE_COLORS.length - index - 1;

    if (remainingColors === 0) {
      counts[color] = remaining;
      return;
    }

    const minAllowed = Math.max(
      MIN_COLOR_COUNT,
      remaining - remainingColors * MAX_COLOR_COUNT,
    );
    const maxAllowed = Math.min(
      MAX_COLOR_COUNT,
      remaining - remainingColors * MIN_COLOR_COUNT,
    );

    const amount = randomInt(minAllowed, maxAllowed);
    counts[color] = amount;
    remaining -= amount;
  });

  return counts;
}

function createStageSetup(): StageSetup {
  for (let attempt = 0; attempt < 40; attempt++) {
    const counts = buildRandomColorCounts();
    const pool: Tile[] = [];

    TILE_COLORS.forEach((color) => {
      for (let index = 0; index < counts[color]; index++) {
        pool.push({ id: nextTileId++, color });
      }
    });

    const shuffled = shuffle(pool);
    const board: Board = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      board.push(shuffled.slice(row * BOARD_SIZE, (row + 1) * BOARD_SIZE));
    }

    if (findAllGroups(board).length > 0) {
      return { board, colorCounts: counts };
    }
  }

  const fallbackCounts = {
    red: 20,
    green: 20,
    blue: 20,
    yellow: 20,
    purple: 20,
  } satisfies Record<TileColor, number>;

  const fallbackPool: Tile[] = [];
  TILE_COLORS.forEach((color) => {
    for (let index = 0; index < fallbackCounts[color]; index++) {
      fallbackPool.push({ id: nextTileId++, color });
    }
  });

  const fallbackBoard: Board = [];
  const shuffled = shuffle(fallbackPool);
  for (let row = 0; row < BOARD_SIZE; row++) {
    fallbackBoard.push(shuffled.slice(row * BOARD_SIZE, (row + 1) * BOARD_SIZE));
  }

  return {
    board: fallbackBoard,
    colorCounts: fallbackCounts,
  };
}

function createGameState(level = 1, score = 0): GameState {
  const stage = createStageSetup();

  return {
    board: stage.board,
    level,
    score,
    targetScore: calculateStageTarget(level),
    status: "playing",
    lastCleared: 0,
    lastGain: 0,
    bonusAwarded: 0,
    colorCounts: stage.colorCounts,
    remainingTiles: TILE_TOTAL,
  };
}

function keyOf(row: number, col: number) {
  return `${row}-${col}`;
}

function countRemainingTiles(board: Board) {
  return board.reduce(
    (total, row) => total + row.reduce((sum, tile) => sum + (tile ? 1 : 0), 0),
    0,
  );
}

function collectColorCounts(board: Board): Record<TileColor, number> {
  const counts = {
    red: 0,
    green: 0,
    blue: 0,
    yellow: 0,
    purple: 0,
  } satisfies Record<TileColor, number>;

  board.forEach((row) => {
    row.forEach((tile) => {
      if (tile) {
        counts[tile.color] += 1;
      }
    });
  });

  return counts;
}

function findConnectedGroup(board: Board, startRow: number, startCol: number) {
  const startTile = board[startRow]?.[startCol];
  if (!startTile) {
    return [] as Array<{ row: number; col: number }>;
  }

  const group: Array<{ row: number; col: number }> = [];
  const visited = new Set<string>();
  const stack = [{ row: startRow, col: startCol }];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const currentKey = keyOf(current.row, current.col);

    if (visited.has(currentKey)) {
      continue;
    }

    const tile = board[current.row]?.[current.col];
    if (!tile || tile.color !== startTile.color) {
      continue;
    }

    visited.add(currentKey);
    group.push(current);

    const neighbors = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ];

    neighbors.forEach((neighbor) => {
      if (
        neighbor.row >= 0 &&
        neighbor.row < BOARD_SIZE &&
        neighbor.col >= 0 &&
        neighbor.col < BOARD_SIZE
      ) {
        stack.push(neighbor);
      }
    });
  }

  return group;
}

function findAllGroups(board: Board) {
  const visited = new Set<string>();
  const groups: Array<Array<{ row: number; col: number }>> = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[row][col] || visited.has(keyOf(row, col))) {
        continue;
      }

      const group = findConnectedGroup(board, row, col);
      group.forEach((cell) => visited.add(keyOf(cell.row, cell.col)));

      if (group.length >= 2) {
        groups.push(group);
      }
    }
  }

  return groups;
}

function removeGroup(board: Board, group: Array<{ row: number; col: number }>) {
  const removed = new Set(group.map((cell) => keyOf(cell.row, cell.col)));
  const collapsedColumns: Array<Array<Tile | null>> = [];

  for (let col = 0; col < BOARD_SIZE; col++) {
    const remainingColumn: Tile[] = [];

    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      const tile = board[row][col];
      if (tile && !removed.has(keyOf(row, col))) {
        remainingColumn.push(tile);
      }
    }

    if (remainingColumn.length > 0) {
      const paddedColumn = Array<Tile | null>(BOARD_SIZE).fill(null);
      remainingColumn.forEach((tile, index) => {
        paddedColumn[BOARD_SIZE - 1 - index] = tile;
      });
      collapsedColumns.push(paddedColumn);
    }
  }

  while (collapsedColumns.length < BOARD_SIZE) {
    collapsedColumns.push(Array<Tile | null>(BOARD_SIZE).fill(null));
  }

  const nextBoard: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array<Tile | null>(BOARD_SIZE).fill(null),
  );

  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      nextBoard[row][col] = collapsedColumns[col][row];
    }
  }

  return nextBoard;
}

function mapTilePositions(board: Board) {
  const positions = new Map<number, { row: number; col: number }>();

  board.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (tile) {
        positions.set(tile.id, { row: rowIndex, col: colIndex });
      }
    });
  });

  return positions;
}

function getMovedTileMotion(previousBoard: Board, nextBoard: Board) {
  const previousPositions = mapTilePositions(previousBoard);
  const nextPositions = mapTilePositions(nextBoard);
  const movedTiles: Record<number, FallingMotion> = {};

  nextPositions.forEach((nextPosition, tileId) => {
    const previousPosition = previousPositions.get(tileId);
    if (!previousPosition) {
      return;
    }

    if (
      previousPosition.row !== nextPosition.row ||
      previousPosition.col !== nextPosition.col
    ) {
      movedTiles[tileId] = {
        distance: Math.max(1, previousPosition.row - nextPosition.row),
        horizontalShift: previousPosition.col - nextPosition.col,
      };
    }
  });

  return movedTiles;
}

function buildParticles(
  group: Array<{ row: number; col: number }>,
  color: TileColor,
) {
  if (group.length < BIG_GROUP_THRESHOLD) {
    return [] as Particle[];
  }

  const centerRow = group.reduce((sum, cell) => sum + cell.row, 0) / group.length;
  const centerCol = group.reduce((sum, cell) => sum + cell.col, 0) / group.length;
  const style = TILE_STYLES[color];
  const particleCount = Math.min(18, 8 + Math.floor(group.length * 0.9));
  const symbolSet: Record<TileColor, string[]> = {
    red: ["♥", "❤", "✦"],
    green: ["✦", "★", "❋"],
    blue: ["★", "✦", "✧"],
    yellow: ["★", "✦", "✶"],
    purple: ["♥", "★", "✦"],
  };

  return Array.from({ length: particleCount }, (_, index) => {
    const angle = (Math.PI * 2 * index) / particleCount + Math.random() * 0.45;
    const distance = 22 + Math.random() * 34 + group.length * 0.65;

    return {
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      row: centerRow + (Math.random() * 0.7 - 0.35),
      col: centerCol + (Math.random() * 0.7 - 0.35),
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 8,
      size: 8 + Math.random() * 10,
      delay: Math.random() * 120,
      duration: PARTICLE_ANIMATION_MS + Math.random() * 180,
      color: style.ring,
      glow: style.shadow,
      symbol: symbolSet[color][index % symbolSet[color].length],
    };
  });
}

function getPraiseBanner(size: number): PraiseBanner | null {
  if (size >= 18) {
    return { title: "Perfect!", subtitle: "这一手太厉害了" };
  }

  if (size >= 15) {
    return { title: "Amazing!", subtitle: "超大团块一口气拿下" };
  }

  if (size >= HUGE_GROUP_THRESHOLD) {
    return { title: "太厉害了!", subtitle: "大团块爆开，分数暴涨" };
  }

  return null;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getFlashStrength(size: number) {
  if (size >= 18) return 0.26;
  if (size >= 15) return 0.2;
  if (size >= HUGE_GROUP_THRESHOLD) return 0.15;
  if (size >= BIG_GROUP_THRESHOLD) return 0.1;
  return 0;
}

function getClearSoundPattern(size: number) {
  if (size >= 18) {
    return {
      frequencies: [523.25, 659.25, 783.99, 1046.5, 1318.5],
      stepMs: 76,
      durationMs: 150,
      type: "triangle" as OscillatorType,
      volume: 0.05,
    };
  }

  if (size >= 12) {
    return {
      frequencies: [392, 523.25, 659.25, 783.99],
      stepMs: 84,
      durationMs: 135,
      type: "triangle" as OscillatorType,
      volume: 0.045,
    };
  }

  if (size >= 8) {
    return {
      frequencies: [349.23, 440, 587.33],
      stepMs: 92,
      durationMs: 125,
      type: "sine" as OscillatorType,
      volume: 0.04,
    };
  }

  if (size >= 5) {
    return {
      frequencies: [329.63, 440, 523.25],
      stepMs: 100,
      durationMs: 110,
      type: "sine" as OscillatorType,
      volume: 0.032,
    };
  }

  return {
    frequencies: [293.66, 392],
    stepMs: 112,
    durationMs: 100,
    type: "sine" as OscillatorType,
    volume: 0.026,
  };
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card-warm rounded-[1.5rem] p-4 shadow-warm-card">
      <div className="mb-3 flex items-center gap-3 text-warm-brown">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warm-light">
          {icon}
        </div>
        <span className="text-sm font-semibold tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-black text-warm-dark">{value}</div>
      <p className="mt-2 text-sm leading-relaxed text-warm-text">{hint}</p>
    </div>
  );
}

export function PopStarGame() {
  const [game, setGame] = useState<GameState>(() => createGameState());
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loaded, setLoaded] = useState(false);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [selectedGroupSize, setSelectedGroupSize] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [removingKeys, setRemovingKeys] = useState<string[]>([]);
  const [fallingTileMotion, setFallingTileMotion] = useState<Record<number, FallingMotion>>({});
  const [particles, setParticles] = useState<Particle[]>([]);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [praiseBanner, setPraiseBanner] = useState<PraiseBanner | null>(null);
  const [scoreBurst, setScoreBurst] = useState<ScoreBurst | null>(null);
  const [boardFlash, setBoardFlash] = useState(0);
  const resultKeyRef = useRef("");
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const praiseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClearTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
      if (particleTimerRef.current) {
        clearTimeout(particleTimerRef.current);
      }
      if (praiseTimerRef.current) {
        clearTimeout(praiseTimerRef.current);
      }
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      if (scoreBurstTimerRef.current) {
        clearTimeout(scoreBurstTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setStats(loadStats());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveStats(stats);
    }
  }, [stats, loaded]);

  useEffect(() => {
    setHighlightedKeys([]);
    setSelectedGroupSize(0);
  }, [game.board, game.status]);

  useEffect(() => {
    if (game.status !== "playing") {
      setCombo(0);
      setShowCombo(false);
      lastClearTimeRef.current = 0;
      setParticles([]);
      setPraiseBanner(null);
      setScoreBurst(null);
      setBoardFlash(0);
    }
  }, [game.status]);

  const playClearSound = useCallback((size: number) => {
    if (typeof window === "undefined") {
      return;
    }

    const AudioContextClass = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;

    if (context.state === "suspended") {
      void context.resume();
    }

    const pattern = getClearSoundPattern(size);
    const startTime = context.currentTime + 0.01;

    pattern.frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const noteStart = startTime + (index * pattern.stepMs) / 1000;
      const noteEnd = noteStart + pattern.durationMs / 1000;

      oscillator.type = pattern.type;
      oscillator.frequency.setValueAtTime(frequency, noteStart);

      gainNode.gain.setValueAtTime(0.0001, noteStart);
      gainNode.gain.exponentialRampToValueAtTime(pattern.volume, noteStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd + 0.03);
    });
  }, []);

  useEffect(() => {
    if (game.status === "playing") {
      resultKeyRef.current = "";
      return;
    }

    const resultKey = `${game.status}-${game.level}-${game.score}`;
    if (resultKeyRef.current === resultKey) {
      return;
    }

    resultKeyRef.current = resultKey;
    setStats((previous) => ({
      gamesPlayed:
        previous.gamesPlayed + (game.status === "failed" ? 1 : 0),
      bestScore: Math.max(previous.bestScore, game.score),
      bestLevel: Math.max(
        previous.bestLevel,
        game.status === "cleared" ? game.level + 1 : game.level,
      ),
    }));
  }, [game.level, game.score, game.status]);

  const currentCounts = collectColorCounts(game.board);
  const removableGroups = findAllGroups(game.board);
  const maxGroupSize = removableGroups.reduce(
    (largest, group) => Math.max(largest, group.length),
    0,
  );

  const previewGroup = useCallback(
    (row: number, col: number) => {
      if (game.status !== "playing" || isAnimating) {
        return;
      }

      const group = findConnectedGroup(game.board, row, col);
      if (group.length < 2) {
        setHighlightedKeys([]);
        setSelectedGroupSize(0);
        return;
      }

      setHighlightedKeys(group.map((cell) => keyOf(cell.row, cell.col)));
      setSelectedGroupSize(group.length);
    },
    [game.board, game.status, isAnimating],
  );

  const clearPreview = useCallback(() => {
    setHighlightedKeys([]);
    setSelectedGroupSize(0);
  }, []);

  const handleTileClick = useCallback(
    async (row: number, col: number) => {
      if (game.status !== "playing" || isAnimating) {
        return;
      }

      const group = findConnectedGroup(game.board, row, col);
      if (group.length < 2) {
        return;
      }

      const clearedColor = game.board[row][col]?.color;
      if (!clearedColor) {
        return;
      }

      const removedKeys = group.map((cell) => keyOf(cell.row, cell.col));
      const clearGain = calculateClearScore(group.length);
      const nextBoard = removeGroup(game.board, group);
      const movedMotion = getMovedTileMotion(game.board, nextBoard);
      const remainingTiles = countRemainingTiles(nextBoard);
      const now = Date.now();
      const nextCombo =
        now - lastClearTimeRef.current <= COMBO_WINDOW_MS ? combo + 1 : 1;
      const nextParticles = buildParticles(group, clearedColor);
      const nextPraiseBanner = getPraiseBanner(group.length);
      const flashStrength = getFlashStrength(group.length);

      playClearSound(group.length);

      lastClearTimeRef.current = now;
      setCombo(nextCombo);
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
      if (nextCombo > 1) {
        setShowCombo(true);
        comboTimerRef.current = setTimeout(() => {
          setShowCombo(false);
        }, COMBO_POPUP_MS);
      } else {
        setShowCombo(false);
      }

      setIsAnimating(true);
      setHighlightedKeys([]);
      setSelectedGroupSize(0);
      setRemovingKeys(removedKeys);
      if (particleTimerRef.current) {
        clearTimeout(particleTimerRef.current);
      }
      if (praiseTimerRef.current) {
        clearTimeout(praiseTimerRef.current);
      }
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      if (scoreBurstTimerRef.current) {
        clearTimeout(scoreBurstTimerRef.current);
      }
      setParticles(nextParticles);
      setPraiseBanner(nextPraiseBanner);
      setScoreBurst(
        nextPraiseBanner
          ? {
              label: `+${clearGain} 分`,
              tone: group.length >= 18 ? "perfect" : "normal",
            }
          : null,
      );
      setBoardFlash(flashStrength);
      if (nextParticles.length > 0) {
        particleTimerRef.current = setTimeout(() => {
          setParticles([]);
        }, PARTICLE_ANIMATION_MS + 260);
      }
      if (nextPraiseBanner) {
        praiseTimerRef.current = setTimeout(() => {
          setPraiseBanner(null);
        }, PRAISE_POPUP_MS);
      }
      if (nextPraiseBanner) {
        scoreBurstTimerRef.current = setTimeout(() => {
          setScoreBurst(null);
        }, PRAISE_POPUP_MS);
      }
      if (flashStrength > 0) {
        flashTimerRef.current = setTimeout(() => {
          setBoardFlash(0);
        }, FLASH_POPUP_MS);
      }

      await wait(REMOVE_ANIMATION_MS);

      const baseState: GameState = {
        ...game,
        board: nextBoard,
        score: game.score + clearGain,
        status: "playing",
        lastCleared: group.length,
        lastGain: clearGain,
        bonusAwarded: 0,
        remainingTiles,
        colorCounts: game.colorCounts,
      };

      const noMoreMoves = findAllGroups(nextBoard).length === 0;

      if (!noMoreMoves) {
        setRemovingKeys([]);
        setFallingTileMotion(movedMotion);
        setGame(baseState);
        await wait(FALL_ANIMATION_MS);
        setFallingTileMotion({});
        setIsAnimating(false);
        return;
      }

      const bonus = calculateBonus(remainingTiles);
      const finalScore = baseState.score + bonus;
      const passed = finalScore >= game.targetScore;

      setRemovingKeys([]);
      setFallingTileMotion(movedMotion);
      setGame({
        ...baseState,
        score: finalScore,
        bonusAwarded: bonus,
        status: passed ? "cleared" : "failed",
      });
      await wait(FALL_ANIMATION_MS);
      setFallingTileMotion({});
      setIsAnimating(false);
    },
    [combo, game, isAnimating],
  );

  const restartGame = useCallback(() => {
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }
    lastClearTimeRef.current = 0;
    setRemovingKeys([]);
    setFallingTileMotion({});
    setParticles([]);
    setPraiseBanner(null);
    setScoreBurst(null);
    setBoardFlash(0);
    setCombo(0);
    setShowCombo(false);
    setIsAnimating(false);
    setGame(createGameState());
  }, []);

  const goToNextLevel = useCallback(() => {
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }
    lastClearTimeRef.current = 0;
    setRemovingKeys([]);
    setFallingTileMotion({});
    setParticles([]);
    setPraiseBanner(null);
    setScoreBurst(null);
    setBoardFlash(0);
    setCombo(0);
    setShowCombo(false);
    setIsAnimating(false);
    setGame((previous) => createGameState(previous.level + 1, previous.score));
  }, []);

  const statusBanner =
    game.status === "cleared"
      ? {
          title: `第 ${game.level} 关通关啦！`,
          description: `本关奖励 ${game.bonusAwarded} 分，继续向 ${calculateStageTarget(game.level + 1)} 分发起挑战。`,
          icon: <PartyPopper className="h-5 w-5 text-warm-coral" />,
          className: "border-warm-peach/40 bg-white/85",
        }
      : game.status === "failed"
        ? {
            title: "本关未达标",
            description: `没有可消除的色块了，最终分数 ${game.score} 分，距离目标还差 ${Math.max(0, game.targetScore - game.score)} 分。`,
            icon: <CircleOff className="h-5 w-5 text-warm-brown" />,
            className: "border-warm-border bg-white/80",
          }
        : {
            title: selectedGroupSize >= 2 ? `准备消除 ${selectedGroupSize} 颗星星` : "点击相连色块开始消除",
            description:
              selectedGroupSize >= 2
                ? `本次可获得 ${calculateClearScore(selectedGroupSize)} 分，星星会自动下落并向左贴合。`
                : "两个或两个以上同色相连即可消除，先把大团块留到后面会更赚分。",
            icon: <Sparkles className="h-5 w-5 text-warm-amber" />,
            className: "border-warm-border/70 bg-white/75",
          };

  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-warm-border bg-white/80 px-5 py-2 text-sm font-semibold text-warm-brown shadow-sm backdrop-blur-sm">
          <Heart className="h-4 w-4 text-warm-pink" />
          温馨可爱 · 经典消除
        </div>
        <h1 className="font-zcool text-4xl text-warm-dark md:text-6xl">消灭星星</h1>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-warm-text md:text-lg">
          在 10 x 10 的小星砖里寻找同色连通块，越大的团块越值钱。清空得越干净，关卡奖励也越高。
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="space-y-6">
          <div className="card-warm overflow-hidden rounded-[2rem] border border-warm-border/70 bg-white/80 shadow-warm-lg backdrop-blur-sm">
            <div className="border-b border-warm-border/70 bg-gradient-to-r from-white via-warm-light/70 to-white px-5 py-4 md:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold tracking-wide text-warm-brown">当前棋盘</p>
                  <h2 className="mt-1 font-zcool text-2xl text-warm-dark">第 {game.level} 关</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-warm-light px-4 py-2 text-sm font-semibold text-warm-brown">
                  <Target className="h-4 w-4 text-warm-coral" />
                  目标 {game.targetScore} 分
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className={`mb-5 flex items-start gap-3 rounded-[1.5rem] border p-4 ${statusBanner.className}`}>
                <div className="mt-0.5">{statusBanner.icon}</div>
                <div>
                  <div className="text-lg font-bold text-warm-dark">{statusBanner.title}</div>
                  <p className="mt-1 text-sm leading-6 text-warm-text">{statusBanner.description}</p>
                </div>
              </div>

              <div
                className="relative grid grid-cols-10 gap-1.5 rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-[#fffaf5] via-[#fff6ee] to-[#ffeede] p-3 shadow-inner md:gap-2 md:p-4"
                onMouseLeave={clearPreview}
              >
                {boardFlash > 0 ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-[1] rounded-[1.75rem]"
                    style={{
                      background: `radial-gradient(circle at 50% 45%, rgba(255, 209, 143, ${boardFlash}) 0%, rgba(255, 173, 133, ${Math.max(boardFlash - 0.04, 0.04)}) 35%, rgba(255, 255, 255, 0) 72%)`,
                      animation: `pop-star-flash ${FLASH_POPUP_MS}ms ease-out forwards`,
                    }}
                  />
                ) : null}

                {showCombo && combo > 1 ? (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                    <div
                      className="rounded-full border border-white/80 bg-white/88 px-7 py-3 text-center shadow-[0_16px_40px_rgba(255,173,133,0.28)] backdrop-blur-sm"
                      style={{ animation: `pop-star-combo ${COMBO_POPUP_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards` }}
                    >
                      <div className="font-zcool text-3xl text-warm-coral md:text-4xl">{combo} 连击!</div>
                      <div className="mt-1 text-sm font-semibold text-warm-brown">连续消除，手感正热</div>
                    </div>
                  </div>
                ) : null}

                {praiseBanner ? (
                  <div className="pointer-events-none absolute inset-x-0 top-5 z-20 flex justify-center">
                    <div
                      className="rounded-full border border-white/85 bg-gradient-to-r from-white via-[#fff5ec] to-white px-6 py-2.5 text-center shadow-[0_14px_32px_rgba(255,173,133,0.24)] backdrop-blur-sm"
                      style={{ animation: `pop-star-praise ${PRAISE_POPUP_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards` }}
                    >
                      <div className="font-zcool text-2xl text-warm-coral md:text-3xl">{praiseBanner.title}</div>
                      <div className="text-xs font-semibold tracking-wide text-warm-brown md:text-sm">{praiseBanner.subtitle}</div>
                    </div>
                  </div>
                ) : null}

                {scoreBurst ? (
                  <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center">
                    <div
                      className={`rounded-full px-5 py-2 text-center font-zcool text-2xl ${scoreBurst.tone === "perfect" ? "text-warm-coral" : "text-warm-brown"}`}
                      style={{
                        background: scoreBurst.tone === "perfect"
                          ? "rgba(255, 255, 255, 0.86)"
                          : "rgba(255, 248, 240, 0.78)",
                        boxShadow: scoreBurst.tone === "perfect"
                          ? "0 14px 34px rgba(255, 107, 107, 0.18)"
                          : "0 12px 28px rgba(255, 173, 133, 0.16)",
                        animation: `pop-star-score ${PRAISE_POPUP_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                      }}
                    >
                      {scoreBurst.label}
                    </div>
                  </div>
                ) : null}

                {particles.map((particle) => (
                  <span
                    key={particle.id}
                    className="pointer-events-none absolute z-10 flex items-center justify-center font-black"
                    style={{
                      left: `calc(${(particle.col + 0.5) * 10}% - ${particle.size / 2}px)`,
                      top: `calc(${(particle.row + 0.5) * 10}% - ${particle.size / 2}px)`,
                      width: `${particle.size}px`,
                      height: `${particle.size}px`,
                      color: particle.color,
                      textShadow: `0 0 10px rgba(255,255,255,0.7), ${particle.glow}`,
                      boxShadow: `${particle.glow}, 0 0 16px rgba(255,255,255,0.45)`,
                      animation: `pop-star-spark ${particle.duration}ms cubic-bezier(0.18, 0.9, 0.32, 1) ${particle.delay}ms forwards`,
                      ["--spark-x" as string]: `${particle.dx}px`,
                      ["--spark-y" as string]: `${particle.dy}px`,
                      fontSize: `${particle.size}px`,
                    }}
                  >
                    {particle.symbol}
                  </span>
                ))}

                {game.board.map((row, rowIndex) =>
                  row.map((tile, colIndex) => {
                    if (!tile) {
                      return (
                        <div
                          key={`empty-${rowIndex}-${colIndex}`}
                          className="aspect-square rounded-2xl border border-dashed border-white/50 bg-white/30"
                        />
                      );
                    }

                    const style = TILE_STYLES[tile.color];
                    const cellKey = keyOf(rowIndex, colIndex);
                    const isHighlighted = highlightedKeys.includes(cellKey);
                    const isRemoving = removingKeys.includes(cellKey);
                    const fallingMotion = fallingTileMotion[tile.id];
                    const isFalling = Boolean(fallingMotion);
                    const fallDistance = fallingMotion?.distance ?? 0;
                    const fallDuration = 260 + fallDistance * 85;
                    const fallLift = 12 + fallDistance * 8;
                    const horizontalSkew = (fallingMotion?.horizontalShift ?? 0) * 8;

                    return (
                      <button
                        key={tile.id}
                        type="button"
                        onMouseEnter={() => previewGroup(rowIndex, colIndex)}
                        onFocus={() => previewGroup(rowIndex, colIndex)}
                        onClick={() => handleTileClick(rowIndex, colIndex)}
                        disabled={isAnimating}
                        className="group relative aspect-square overflow-hidden rounded-2xl transition duration-200 hover:-translate-y-0.5 disabled:cursor-default"
                        style={{
                          backgroundImage: style.gradient,
                          boxShadow: isHighlighted ? style.shadow : "0 6px 14px rgba(139, 111, 71, 0.12)",
                          transform: isHighlighted ? "translateY(-2px) scale(1.03)" : undefined,
                          outline: isHighlighted ? `3px solid ${style.ring}` : "none",
                          outlineOffset: "-2px",
                          animation: isRemoving
                            ? "pop-star-burst 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards"
                            : isFalling
                              ? `pop-star-drop ${fallDuration}ms cubic-bezier(0.16, 0.84, 0.24, 1)`
                              : undefined,
                          ["--drop-distance" as string]: `${fallLift}px`,
                          ["--drop-shift" as string]: `${horizontalSkew}px`,
                        }}
                        aria-label={`${style.label}色星砖，位于第 ${rowIndex + 1} 行，第 ${colIndex + 1} 列`}
                      >
                        <div className="absolute inset-x-2 top-1.5 h-1/3 rounded-full bg-white/25 blur-md transition-opacity group-hover:opacity-90" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.45),transparent_35%)]" />
                        <span className="relative z-10 text-lg drop-shadow-sm md:text-xl">{style.emoji}</span>
                      </button>
                    );
                  }),
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-warm-text">
                <div className="rounded-full bg-warm-light px-4 py-2 font-semibold text-warm-brown">
                  当前连击 {combo > 0 ? `x${combo}` : "-"}
                </div>
                <div className="rounded-full bg-white/80 px-4 py-2">
                  单次消除得分: n x n x 5
                </div>
                <div className="rounded-full bg-white/80 px-4 py-2">
                  连续操作 2.2 秒内可续上连击
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={restartGame}
                  className="btn-warm inline-flex items-center gap-2 px-5 py-3 text-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  重新开局
                </button>

                {game.status === "cleared" ? (
                  <button
                    type="button"
                    onClick={goToNextLevel}
                    className="inline-flex items-center gap-2 rounded-full border border-warm-border bg-white px-5 py-3 text-sm font-bold text-warm-dark shadow-sm transition hover:-translate-y-0.5 hover:border-warm-peach/50"
                  >
                    <ArrowRight className="h-4 w-4 text-warm-coral" />
                    进入下一关
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<Sparkles className="h-5 w-5 text-warm-amber" />}
              label="累计分数"
              value={`${game.score}`}
              hint={game.lastCleared > 0 ? `上一次消除 ${game.lastCleared} 颗，获得 ${game.lastGain} 分` : "大团块后手消除，收益会更高。"}
            />
            <StatCard
              icon={<Target className="h-5 w-5 text-warm-coral" />}
              label="剩余星砖"
              value={`${game.remainingTiles}`}
              hint={game.bonusAwarded > 0 ? `本关额外奖励 ${game.bonusAwarded} 分` : "关底剩余越少，奖励越高。"}
            />
            <StatCard
              icon={<Trophy className="h-5 w-5 text-warm-brown" />}
              label="最大可消团块"
              value={`${maxGroupSize}`}
              hint={maxGroupSize >= 8 ? "当前盘面有大团块，可以优先规划。" : "先腾挪出更大的连通块再出手。"}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card-warm rounded-[2rem] p-5 shadow-warm-card md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-warm-peach to-warm-amber text-white shadow-warm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-warm-brown">本关配色</div>
                <div className="font-zcool text-2xl text-warm-dark">100 颗小星砖</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {TILE_COLORS.map((color) => {
                const tileStyle = TILE_STYLES[color];
                return (
                  <div
                    key={color}
                    className="flex items-center justify-between rounded-2xl border border-warm-border/70 bg-warm-light/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
                        style={{ backgroundImage: tileStyle.gradient, boxShadow: tileStyle.shadow }}
                      >
                        {tileStyle.emoji}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-warm-dark">{tileStyle.label}色</div>
                        <div className="text-xs text-warm-text">开局 {game.colorCounts[color]} 颗</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-warm-brown">当前 {currentCounts[color]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-warm rounded-[2rem] p-5 shadow-warm-card md:p-6">
            <h3 className="mb-4 font-zcool text-2xl text-warm-dark">计分规则</h3>
            <div className="space-y-4 text-sm leading-7 text-warm-text">
              <p>
                消除得分按公式计算：<span className="font-bold text-warm-dark">n x n x 5</span>。
                也就是单块得分会按 5、15、25 这样递增，团块越大越划算。
              </p>
              <p>
                关底奖励为 <span className="font-bold text-warm-dark">2000 - n x n x 20</span>，这里的 n 是剩余星砖数量；
                剩得越少，奖励越高。
              </p>
              <p>
                当前关目标分是 <span className="font-bold text-warm-dark">{game.targetScore}</span>，并且只有在盘面没有可消团块时，
                才会结算通关或失败。
              </p>
            </div>
          </div>

          <div className="card-warm rounded-[2rem] p-5 shadow-warm-card md:p-6">
            <h3 className="mb-4 font-zcool text-2xl text-warm-dark">游玩记录</h3>
            <div className="space-y-3 text-sm text-warm-text">
              <div className="flex items-center justify-between rounded-2xl bg-warm-light/70 px-4 py-3">
                <span>挑战结束次数</span>
                <span className="font-bold text-warm-dark">{stats.gamesPlayed}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-warm-light/70 px-4 py-3">
                <span>历史最高分</span>
                <span className="font-bold text-warm-dark">{stats.bestScore}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-warm-light/70 px-4 py-3">
                <span>最高抵达关卡</span>
                <span className="font-bold text-warm-dark">{stats.bestLevel}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        @keyframes pop-star-burst {
          0% {
            transform: scale(1);
            opacity: 1;
            filter: saturate(1);
          }
          55% {
            transform: scale(1.18);
            opacity: 0.92;
            filter: saturate(1.25) brightness(1.06);
          }
          100% {
            transform: scale(0.18);
            opacity: 0;
            filter: saturate(1.45) brightness(1.15);
          }
        }

        @keyframes pop-star-drop {
          0% {
            transform: translate3d(var(--drop-shift, 0px), calc(var(--drop-distance, 22px) * -1), 0) scale(0.94);
            opacity: 0.1;
          }
          62% {
            transform: translate3d(calc(var(--drop-shift, 0px) * -0.12), 5px, 0) scale(1.03);
            opacity: 1;
          }
          82% {
            transform: translate3d(calc(var(--drop-shift, 0px) * 0.06), -2px, 0) scale(0.99);
            opacity: 1;
          }
          92% {
            transform: translate3d(0, 1px, 0) scale(1.01);
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }

        @keyframes pop-star-spark {
          0% {
            transform: translate3d(0, 0, 0) scale(0.4) rotate(0deg);
            opacity: 0;
          }
          15% {
            transform: translate3d(calc(var(--spark-x) * 0.18), calc(var(--spark-y) * 0.18), 0) scale(1.08) rotate(60deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--spark-x), var(--spark-y), 0) scale(0.18) rotate(210deg);
            opacity: 0;
          }
        }

        @keyframes pop-star-combo {
          0% {
            transform: translateY(18px) scale(0.82);
            opacity: 0;
          }
          20% {
            transform: translateY(0) scale(1.06);
            opacity: 1;
          }
          80% {
            transform: translateY(-8px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-18px) scale(0.94);
            opacity: 0;
          }
        }

        @keyframes pop-star-praise {
          0% {
            transform: translateY(-10px) scale(0.86);
            opacity: 0;
          }
          18% {
            transform: translateY(0) scale(1.04);
            opacity: 1;
          }
          78% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-8px) scale(0.96);
            opacity: 0;
          }
        }

        @keyframes pop-star-score {
          0% {
            transform: translateY(10px) scale(0.85);
            opacity: 0;
          }
          18% {
            transform: translateY(0) scale(1.03);
            opacity: 1;
          }
          80% {
            transform: translateY(-14px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-26px) scale(0.96);
            opacity: 0;
          }
        }

        @keyframes pop-star-flash {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}