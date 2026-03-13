"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RotateCcw,
  Info,
  ChartLine,
  Trophy,
  Undo2,
  Users,
  Bot,
  Target,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   常量与类型
   ═══════════════════════════════════════════════════════ */

const SIZE = 15;
const CELL = 56;
const PAD = 36;
const BOARD_PX = PAD * 2 + (SIZE - 1) * CELL;
const STONE_R = CELL * 0.43;
const STATS_KEY = "playai_gomoku_stats";

/** 棋盘星位：天元 + 八星 */
const STARS: [number, number][] = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11],
];

/** 四个搜索方向：水平、垂直、主对角线、副对角线 */
const DIRS: [number, number][] = [
  [0, 1], [1, 0], [1, 1], [1, -1],
];

type Player = 1 | 2;
type CellVal = 0 | 1 | 2;
type Board = CellVal[][];
type GameMode = "pvp" | "pve";
type Difficulty = "easy" | "medium" | "hard";
type Pos = { r: number; c: number };
type Move = Pos & { player: Player };

/** 棋局状态 */
interface GameState {
  board: Board;
  current: Player;
  moves: Move[];
  over: boolean;
  winner: Player | null;
  winLine: Pos[] | null;
}

interface DiffStats {
  games: number;
  wins: number;
}

/** 持久化战绩 */
interface Stats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  byDiff: Record<Difficulty, DiffStats>;
}

const DIFF_CFG: Record<Difficulty, { label: string; hint: string }> = {
  easy: { label: "新手", hint: "AI 偶尔犯错，适合练习入门" },
  medium: { label: "进阶", hint: "攻防兼备，需要认真应对" },
  hard: { label: "高手", hint: "精准判断威胁，想赢不容易" },
};

/* ═══════════════════════════════════════════════════════
   纯函数：棋盘初始化与状态
   ═══════════════════════════════════════════════════════ */

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array<CellVal>(SIZE).fill(0));
}

function initGame(): GameState {
  return {
    board: emptyBoard(),
    current: 1,
    moves: [],
    over: false,
    winner: null,
    winLine: null,
  };
}

function emptyStats(): Stats {
  return {
    total: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    byDiff: {
      easy: { games: 0, wins: 0 },
      medium: { games: 0, wins: 0 },
      hard: { games: 0, wins: 0 },
    },
  };
}

function loadStats(): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return emptyStats();
    const p = JSON.parse(raw);
    const b = emptyStats();
    return {
      total: p.total ?? 0,
      wins: p.wins ?? 0,
      losses: p.losses ?? 0,
      draws: p.draws ?? 0,
      byDiff: {
        easy: { ...b.byDiff.easy, ...(p.byDiff?.easy ?? {}) },
        medium: { ...b.byDiff.medium, ...(p.byDiff?.medium ?? {}) },
        hard: { ...b.byDiff.hard, ...(p.byDiff?.hard ?? {}) },
      },
    };
  } catch {
    return emptyStats();
  }
}

function saveStats(s: Stats) {
  if (typeof window !== "undefined")
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
}

function pct(w: number, g: number) {
  return g === 0 ? "0%" : `${Math.round((w / g) * 100)}%`;
}

/* ═══════════════════════════════════════════════════════
   胜负判定
   ═══════════════════════════════════════════════════════ */

/** 从 (r,c) 出发沿四个方向检测连珠，返回获胜连线或 null */
function findWin(board: Board, r: number, c: number, p: Player): Pos[] | null {
  for (const [dr, dc] of DIRS) {
    const line: Pos[] = [{ r, c }];
    for (let i = 1; i < SIZE; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== p)
        break;
      line.push({ r: nr, c: nc });
    }
    for (let i = 1; i < SIZE; i++) {
      const nr = r - dr * i;
      const nc = c - dc * i;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== p)
        break;
      line.push({ r: nr, c: nc });
    }
    if (line.length >= 5) return line;
  }
  return null;
}

function isFull(board: Board) {
  return board.every((row) => row.every((v) => v !== 0));
}

/* ═══════════════════════════════════════════════════════
   AI 逻辑
   ═══════════════════════════════════════════════════════ */

/** 沿单个方向统计连子数与开放端数 */
function lineInfo(
  board: Board,
  r: number,
  c: number,
  p: Player,
  dr: number,
  dc: number,
) {
  let count = 1;
  let open = 0;

  for (let i = 1; ; i++) {
    const nr = r + dr * i;
    const nc = c + dc * i;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
    if (board[nr][nc] === p) {
      count++;
    } else {
      if (board[nr][nc] === 0) open++;
      break;
    }
  }

  for (let i = 1; ; i++) {
    const nr = r - dr * i;
    const nc = c - dc * i;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
    if (board[nr][nc] === p) {
      count++;
    } else {
      if (board[nr][nc] === 0) open++;
      break;
    }
  }

  return { count, open };
}

/** 根据连子数和开放端数计算棋形分值 */
function patternScore(n: number, open: number) {
  if (n >= 5) return 100000;
  if (n === 4) return open === 2 ? 10000 : open === 1 ? 1000 : 0;
  if (n === 3) return open === 2 ? 1000 : open === 1 ? 100 : 0;
  if (n === 2) return open === 2 ? 100 : open === 1 ? 10 : 0;
  if (n === 1) return open === 2 ? 10 : open === 1 ? 1 : 0;
  return 0;
}

/** 评估在 (r,c) 落子后的综合得分；advanced 模式检测组合威胁 */
function evalPos(
  board: Board,
  r: number,
  c: number,
  p: Player,
  advanced: boolean,
) {
  let total = 0;
  let liveFours = 0;
  let deadFours = 0;
  let liveThrees = 0;

  for (const [dr, dc] of DIRS) {
    const { count, open } = lineInfo(board, r, c, p, dr, dc);
    total += patternScore(count, open);

    if (advanced) {
      if (count === 4 && open === 2) liveFours++;
      else if (count === 4 && open === 1) deadFours++;
      else if (count === 3 && open === 2) liveThrees++;
    }
  }

  if (advanced) {
    if (liveFours > 0) total = Math.max(total, 100000);
    if (deadFours + liveFours >= 2) total = Math.max(total, 50000);
    if (liveThrees >= 2) total = Math.max(total, 50000);
    if ((deadFours > 0 || liveFours > 0) && liveThrees > 0)
      total = Math.max(total, 50000);
  }

  return total;
}

/** 获取已有棋子附近的空位作为候选落子点 */
function candidates(board: Board): Pos[] {
  const set = new Set<string>();
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] !== 0)
        for (let dr = -2; dr <= 2; dr++)
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 &&
              nr < SIZE &&
              nc >= 0 &&
              nc < SIZE &&
              board[nr][nc] === 0
            )
              set.add(`${nr},${nc}`);
          }

  return [...set].map((k) => {
    const [r, c] = k.split(",").map(Number);
    return { r, c };
  });
}

/** AI 选择最优落子点 */
function aiMove(board: Board, ai: Player, diff: Difficulty): Pos {
  const human: Player = ai === 1 ? 2 : 1;
  const cands = candidates(board);
  if (cands.length === 0) return { r: 7, c: 7 };

  const adv = diff === "hard";
  const atkW = diff === "easy" ? 1.0 : diff === "medium" ? 1.2 : 1.5;
  const defW = diff === "easy" ? 0.6 : diff === "medium" ? 1.0 : 1.3;
  const noise = diff === "easy" ? 0.25 : diff === "medium" ? 0.03 : 0;

  let best = -Infinity;
  let picks: Pos[] = [];

  for (const p of cands) {
    board[p.r][p.c] = ai;
    const atk = evalPos(board, p.r, p.c, ai, adv);
    board[p.r][p.c] = 0 as CellVal;

    board[p.r][p.c] = human;
    const def = evalPos(board, p.r, p.c, human, adv);
    board[p.r][p.c] = 0 as CellVal;

    const jitter = noise > 0 ? Math.random() * noise * 1000 : 0;
    const score = atk * atkW + def * defW + jitter;

    if (score > best) {
      best = score;
      picks = [p];
    } else if (Math.abs(score - best) < 0.001) {
      picks.push(p);
    }
  }

  return picks[Math.floor(Math.random() * picks.length)];
}

/* ═══════════════════════════════════════════════════════
   组件
   ═══════════════════════════════════════════════════════ */

export function GomokuGame() {
  const [mode, setMode] = useState<GameMode>("pve");
  const [diff, setDiff] = useState<Difficulty>("medium");
  const [game, setGame] = useState<GameState>(initGame);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loaded, setLoaded] = useState(false);
  const [hover, setHover] = useState<Pos | null>(null);
  const [thinking, setThinking] = useState(false);
  const [lastPlaced, setLastPlaced] = useState<Pos | null>(null);
  const recordedRef = useRef(false);

  useEffect(() => {
    setStats(loadStats());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveStats(stats);
  }, [stats, loaded]);

  /** 在 (r,c) 落子并推进棋局状态 */
  const placeStone = useCallback((r: number, c: number) => {
    setGame((prev) => {
      if (prev.over || prev.board[r][c] !== 0) return prev;

      const board = prev.board.map((row) => [...row]) as Board;
      board[r][c] = prev.current;
      const moves: Move[] = [...prev.moves, { r, c, player: prev.current }];

      const wl = findWin(board, r, c, prev.current);
      if (wl)
        return {
          board,
          current: prev.current,
          moves,
          over: true,
          winner: prev.current,
          winLine: wl,
        };
      if (isFull(board))
        return {
          board,
          current: prev.current,
          moves,
          over: true,
          winner: null,
          winLine: null,
        };

      const next: Player = prev.current === 1 ? 2 : 1;
      return {
        board,
        current: next,
        moves,
        over: false,
        winner: null,
        winLine: null,
      };
    });
    setLastPlaced({ r, c });
  }, []);

  /** 对局结束时记录战绩（仅人机模式） */
  useEffect(() => {
    if (!game.over) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current || mode !== "pve") return;
    recordedRef.current = true;

    setStats((s) => {
      const n = structuredClone(s) as Stats;
      n.total++;
      const d = n.byDiff[diff];
      d.games++;
      if (game.winner === 1) {
        n.wins++;
        d.wins++;
      } else if (game.winner === 2) {
        n.losses++;
      } else {
        n.draws++;
      }
      return n;
    });
  }, [game.over, game.winner, mode, diff]);

  /** AI 在轮到白棋时自动落子 */
  useEffect(() => {
    if (mode !== "pve" || game.current !== 2 || game.over) return;
    setThinking(true);

    const boardCopy = game.board.map((row) => [...row]) as Board;
    const move = aiMove(boardCopy, 2, diff);

    const timer = setTimeout(
      () => {
        placeStone(move.r, move.c);
        setThinking(false);
      },
      300 + Math.random() * 250,
    );

    return () => {
      clearTimeout(timer);
      setThinking(false);
    };
  }, [game.current, game.over, game.moves.length, mode, diff, placeStone]);

  const handleClick = (r: number, c: number) => {
    if (game.over || game.board[r][c] !== 0 || thinking) return;
    if (mode === "pve" && game.current !== 1) return;
    placeStone(r, c);
  };

  /** 悔棋：PvE 模式下同时撤回人类和 AI 各一步 */
  const handleUndo = () => {
    if (game.moves.length === 0 || game.over || thinking) return;
    if (mode === "pve" && game.current === 2) return;

    setGame((prev) => {
      const moves = [...prev.moves];
      const board = prev.board.map((row) => [...row]) as Board;

      if (mode === "pve") {
        const lastPlayer = moves[moves.length - 1]?.player;
        const steps = Math.min(lastPlayer === 2 ? 2 : 1, moves.length);
        for (let i = 0; i < steps; i++) {
          const m = moves.pop()!;
          board[m.r][m.c] = 0;
        }
      } else {
        const m = moves.pop()!;
        board[m.r][m.c] = 0;
      }

      const current = (
        moves.length > 0
          ? moves[moves.length - 1].player === 1
            ? 2
            : 1
          : 1
      ) as Player;
      return {
        board,
        current,
        moves,
        over: false,
        winner: null,
        winLine: null,
      };
    });
    setLastPlaced(null);
  };

  const reset = () => {
    setGame(initGame());
    setLastPlaced(null);
    setThinking(false);
    recordedRef.current = false;
  };

  const switchMode = (m: GameMode) => {
    if (m !== mode) {
      setMode(m);
      reset();
    }
  };

  const switchDiff = (d: Difficulty) => {
    if (d !== diff) {
      setDiff(d);
      reset();
    }
  };

  const isWinCell = (r: number, c: number) =>
    game.winLine?.some((p) => p.r === r && p.c === c) ?? false;

  const isLast = (r: number, c: number) =>
    lastPlaced?.r === r && lastPlaced?.c === c;

  const canUndo =
    game.moves.length > 0 &&
    !game.over &&
    !thinking &&
    !(mode === "pve" && game.current === 2);

  const statusText = game.over
    ? game.winner
      ? mode === "pve"
        ? game.winner === 1
          ? "你赢了！🎉"
          : "AI 获胜 🤖"
        : game.winner === 1
          ? "黑棋获胜！"
          : "白棋获胜！"
      : "平局！"
    : thinking
      ? "AI 思考中…"
      : mode === "pvp"
        ? game.current === 1
          ? "黑棋落子"
          : "白棋落子"
        : "轮到你了";

  const statusColor = game.over
    ? game.winner === 1
      ? "text-green-600"
      : game.winner === 2
        ? "text-red-500"
        : "text-amber-500"
    : thinking
      ? "text-warm-peach"
      : "text-warm-peach";

  const ringClass = game.over
    ? game.winner === 1
      ? "ring-2 ring-green-400/50"
      : game.winner === 2
        ? "ring-2 ring-red-400/50"
        : "ring-2 ring-amber-400/50"
    : "ring-1 ring-warm-border/40";

  return (
    <div className="mx-auto w-full max-w-xl px-1 sm:px-2 animate-fade-in-up">
      <style jsx>{`
        .gomoku-board-bg {
          background:
            repeating-linear-gradient(
              78deg,
              transparent,
              transparent 120px,
              rgba(160, 120, 60, 0.04) 120px,
              rgba(160, 120, 60, 0.04) 122px
            ),
            linear-gradient(160deg, #e8c480 0%, #d4a656 40%, #c89840 100%);
          border-radius: 16px;
          box-shadow:
            0 30px 80px rgba(120, 80, 20, 0.18),
            0 8px 24px rgba(120, 80, 20, 0.12),
            inset 0 2px 0 rgba(255, 255, 255, 0.2),
            inset 0 -2px 4px rgba(0, 0, 0, 0.08);
        }
        .gomoku-dot1 {
          animation: gomokuThink 1.4s ease-in-out infinite;
        }
        .gomoku-dot2 {
          animation: gomokuThink 1.4s ease-in-out 0.2s infinite;
        }
        .gomoku-dot3 {
          animation: gomokuThink 1.4s ease-in-out 0.4s infinite;
        }
        @keyframes gomokuThink {
          0%,
          80%,
          100% {
            opacity: 0.2;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>

      {/* SVG 动画需要全局作用域才能作用于子元素 */}
      <style>{`
        @keyframes gomokuStoneIn {
          from { opacity: 0; transform: scale(0); }
          60% { transform: scale(1.08); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gomokuWinGlow {
          0%, 100% { filter: none; }
          50% { filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.7)); }
        }
        .gomoku-stone-enter {
          transform-box: fill-box;
          transform-origin: center;
          animation: gomokuStoneIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .gomoku-win-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: gomokuWinGlow 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* ── 标题区 ──────────────────────────────── */}
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-warm-border bg-white/80 px-4 py-1.5 text-base font-semibold text-warm-brown backdrop-blur-sm">
          <Target className="h-4 w-4" /> 益智游戏
        </div>
        <h1 className="mb-2 font-zcool text-3xl text-warm-dark">五子棋</h1>
        <p className="text-base text-warm-text">
          经典策略对弈，先在横竖斜任一方向连成五子者胜。支持人机与双人对战。
        </p>
      </div>

      {/* ── 控制面板 ──────────────────────────────── */}
      <div className="mb-4 space-y-4 rounded-2xl border border-warm-border/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        {/* 状态行 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[56px] text-center">
            <p className="text-xs text-warm-text">手数</p>
            <p className="font-zcool text-2xl text-warm-dark">{game.moves.length}</p>
          </div>

          <div className="min-w-[90px] text-center">
            <p className="text-xs text-warm-text">状态</p>
            <p className={`text-sm font-medium ${statusColor}`}>
              {thinking ? (
                <span className="inline-flex items-center gap-1">
                  AI 思考中
                  <span className="ml-0.5 inline-flex gap-0.5">
                    <span className="gomoku-dot1 inline-block h-1 w-1 rounded-full bg-warm-peach" />
                    <span className="gomoku-dot2 inline-block h-1 w-1 rounded-full bg-warm-peach" />
                    <span className="gomoku-dot3 inline-block h-1 w-1 rounded-full bg-warm-peach" />
                  </span>
                </span>
              ) : (
                statusText
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="rounded-full border border-warm-border px-3 py-2 text-sm font-medium text-warm-dark transition-colors hover:bg-warm-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 className="mr-1 inline-block h-4 w-4" />
              悔棋
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full bg-warm-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-warm-brown"
            >
              <RotateCcw className="h-4 w-4" />
              新局
            </button>
          </div>
        </div>

        {/* 模式切换 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-warm-text">
            模式
          </span>
          {(
            [
              ["pve", "人机对战", Bot],
              ["pvp", "双人对战", Users],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => switchMode(k)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === k
                  ? "border-warm-peach bg-warm-peach text-white"
                  : "border-warm-border bg-white text-warm-text hover:bg-warm-light"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* 难度（仅人机） */}
        {mode === "pve" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-warm-text">
              难度
            </span>
            {(
              Object.entries(DIFF_CFG) as [
                Difficulty,
                (typeof DIFF_CFG)["easy"],
              ][]
            ).map(([k, cfg]) => (
              <button
                key={k}
                type="button"
                onClick={() => switchDiff(k)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  diff === k
                    ? "border-warm-peach bg-warm-peach text-white"
                    : "border-warm-border bg-white text-warm-text hover:bg-warm-light"
                }`}
              >
                {cfg.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-warm-text">
              {DIFF_CFG[diff].hint}
            </span>
          </div>
        )}
      </div>

      {/* ── 棋盘 ──────────────────────────────────── */}
      <div className="flex animate-fade-in-up justify-center">
        <div
          className={`gomoku-board-bg overflow-hidden ${ringClass}`}
          style={{ width: "100%", maxWidth: BOARD_PX, aspectRatio: "1" }}
        >
          <svg
            viewBox={`0 0 ${BOARD_PX} ${BOARD_PX}`}
            className="block h-auto w-full"
          >
            <defs>
              <radialGradient id="gB" cx="38%" cy="36%">
                <stop offset="0%" stopColor="#555" />
                <stop offset="50%" stopColor="#2a2a2a" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </radialGradient>
              <radialGradient id="gW" cx="38%" cy="36%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#eaeaea" />
                <stop offset="100%" stopColor="#c8c8c8" />
              </radialGradient>
              <filter
                id="sS"
                x="-30%"
                y="-20%"
                width="160%"
                height="160%"
              >
                <feDropShadow
                  dx="0.8"
                  dy="1.5"
                  stdDeviation="1.8"
                  floodColor="#000"
                  floodOpacity="0.25"
                />
              </filter>
            </defs>

            {/* 网格线 */}
            {Array.from({ length: SIZE }).map((_, i) => (
              <g key={`g-${i}`}>
                <line
                  x1={PAD}
                  y1={PAD + i * CELL}
                  x2={PAD + (SIZE - 1) * CELL}
                  y2={PAD + i * CELL}
                  stroke="#7A5C1E"
                  strokeWidth={i === 0 || i === SIZE - 1 ? 1.3 : 0.6}
                  strokeOpacity={0.6}
                />
                <line
                  x1={PAD + i * CELL}
                  y1={PAD}
                  x2={PAD + i * CELL}
                  y2={PAD + (SIZE - 1) * CELL}
                  stroke="#7A5C1E"
                  strokeWidth={i === 0 || i === SIZE - 1 ? 1.3 : 0.6}
                  strokeOpacity={0.6}
                />
              </g>
            ))}

            {/* 星位 */}
            {STARS.map(([r, c]) => (
              <circle
                key={`s-${r}-${c}`}
                cx={PAD + c * CELL}
                cy={PAD + r * CELL}
                r={3.5}
                fill="#7A5C1E"
                fillOpacity={0.75}
              />
            ))}

            {/* 交叉点：点击区域 / 悬停预览 / 棋子 */}
            {game.board.map((row, r) =>
              row.map((cell, c) => {
                const cx = PAD + c * CELL;
                const cy = PAD + r * CELL;
                const wc = isWinCell(r, c);
                const lm = isLast(r, c);
                const isHover =
                  hover?.r === r &&
                  hover?.c === c &&
                  cell === 0 &&
                  !game.over &&
                  !thinking;
                const clickable =
                  cell === 0 &&
                  !game.over &&
                  !thinking &&
                  (mode === "pvp" || game.current === 1);

                return (
                  <g key={`p-${r}-${c}`}>
                    {clickable && (
                      <rect
                        x={cx - CELL / 2}
                        y={cy - CELL / 2}
                        width={CELL}
                        height={CELL}
                        fill="transparent"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleClick(r, c)}
                        onMouseEnter={() => setHover({ r, c })}
                        onMouseLeave={() => setHover(null)}
                      />
                    )}

                    {isHover && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={STONE_R}
                        fill={
                          game.current === 1
                            ? "rgba(0,0,0,0.15)"
                            : "rgba(200,200,200,0.35)"
                        }
                        style={{ pointerEvents: "none" }}
                      />
                    )}

                    {cell !== 0 && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={STONE_R}
                        fill={cell === 1 ? "url(#gB)" : "url(#gW)"}
                        stroke={cell === 2 ? "#b0b0b0" : "none"}
                        strokeWidth={cell === 2 ? 0.5 : 0}
                        filter="url(#sS)"
                        className={`${wc ? "gomoku-win-pulse" : ""} ${lm && !wc ? "gomoku-stone-enter" : ""}`}
                      />
                    )}

                    {cell !== 0 && lm && !wc && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={cell === 1 ? "#fff" : "#333"}
                        fillOpacity={0.85}
                      />
                    )}

                    {wc && (
                      <circle cx={cx} cy={cy} r={3.5} fill="#4ade80" />
                    )}
                  </g>
                );
              }),
            )}
          </svg>
        </div>
      </div>

      {/* ── 当前回合指示 ──────────────────────────── */}
      <div className="mt-5 flex justify-center gap-6">
        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-2 transition-all duration-300 ${
            game.current === 1 && !game.over
              ? "scale-105 border-gray-800 bg-gray-900 text-white shadow-lg"
              : "border-warm-border bg-white/80 text-warm-text"
          }`}
        >
          <span className="inline-block h-3.5 w-3.5 rounded-full bg-gray-900 ring-1 ring-gray-600" />
          <span className="text-sm font-medium">
            {mode === "pve" ? "你" : "黑棋"}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-2 transition-all duration-300 ${
            game.current === 2 && !game.over
              ? "scale-105 border-gray-300 bg-white text-gray-900 shadow-lg ring-2 ring-gray-200"
              : "border-warm-border bg-white/80 text-warm-text"
          }`}
        >
          <span className="inline-block h-3.5 w-3.5 rounded-full bg-white ring-2 ring-gray-300" />
          <span className="text-sm font-medium">
            {mode === "pve" ? "AI" : "白棋"}
          </span>
        </div>
      </div>

      {/* ── 战绩总览 & 分难度（仅人机） ───── */}
      {mode === "pve" && (
        <div className="mt-4 mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-warm-border/60 bg-white/80 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warm-brown">
              <ChartLine className="h-4 w-4" /> 游戏统计
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-warm-text">总局数</p>
                <p className="font-zcool text-xl text-warm-dark">{stats.total}</p>
              </div>
              <div>
                <p className="text-xs text-warm-text">胜率</p>
                <p className="font-zcool text-xl text-warm-dark">{pct(stats.wins, stats.total)}</p>
              </div>
              <div>
                <p className="text-xs text-warm-text">胜/负/平</p>
                <p className="font-zcool text-xl text-warm-dark">{stats.wins}/{stats.losses}/{stats.draws}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-warm-border/60 bg-white/80 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warm-brown">
              <Trophy className="h-4 w-4" /> 分难度
            </div>
            <div className="space-y-1 text-sm">
              {(
                Object.entries(DIFF_CFG) as [
                  Difficulty,
                  (typeof DIFF_CFG)["easy"],
                ][]
              ).map(([k, cfg]) => {
                const d = stats.byDiff[k];
                return (
                  <div key={k} className="flex justify-between">
                    <span className="text-warm-text">{cfg.label}</span>
                    <span className={`font-semibold ${k === diff ? "text-warm-peach" : "text-warm-dark"}`}>
                      {pct(d.wins, d.games)} ({d.games}局)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 规则说明 ──────────────────────────────── */}
      <div className="mt-4 rounded-2xl border border-warm-border/60 bg-white/50 p-5 backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-warm-dark">
          <Info className="h-4 w-4" /> 游戏规则
        </h3>
        <ul className="space-y-2 text-sm leading-relaxed text-warm-text">
          <li>• 黑棋先行，双方轮流在棋盘交叉点上落子。</li>
          <li>• 先在横、竖或斜方向上连成五子（或更多）的一方获胜。</li>
          <li>• 人机模式下你执黑棋，AI 执白棋。可自由切换三种难度。</li>
          <li>• 支持悔棋；人机模式下悔棋会同时撤回你和 AI 的各一步。</li>
        </ul>
      </div>
    </div>
  );
}
