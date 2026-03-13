"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, Info, ChartLine, Trophy, Gem, Timer, Footprints, Infinity } from "lucide-react";

// ─── 常量 ───────────────────────────────────────────────────

const COLS = 8;
const ROWS = 8;
const GEM_COLORS = ["red", "green", "blue", "yellow", "purple", "orange"] as const;
type GemColor = (typeof GEM_COLORS)[number];
type SpecialType = "none" | "stripe-h" | "stripe-v" | "bomb" | "rainbow";
type GameMode = "steps" | "time" | "endless";

const COLOR_EMOJI: Record<GemColor, string> = {
  red: "🔴",
  green: "🟢",
  blue: "🔵",
  yellow: "🟡",
  purple: "🟣",
  orange: "🟠",
};

const COLOR_BG: Record<GemColor, string> = {
  red: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
  green: "linear-gradient(135deg, #6BCB77, #2d9e3f)",
  blue: "linear-gradient(135deg, #74b9ff, #0984e3)",
  yellow: "linear-gradient(135deg, #ffeaa7, #fdcb6e)",
  purple: "linear-gradient(135deg, #a29bfe, #6c5ce7)",
  orange: "linear-gradient(135deg, #ffbe76, #f0932b)",
};

const MAX_STEPS = 30;
const MAX_TIME = 60;

// ─── 类型 ───────────────────────────────────────────────────

interface Cell {
  color: GemColor;
  special: SpecialType;
  id: number;
  matched: boolean;
  isNew: boolean;
}

interface Stats {
  totalGames: number;
  bestScore: number;
  bestByMode: Record<GameMode, number>;
}

// ─── 工具函数 ────────────────────────────────────────────────

let nextId = 1;

/** 生成一个随机宝石 */
function randomGem(): Cell {
  return {
    color: GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)],
    special: "none",
    id: nextId++,
    matched: false,
    isNew: false,
  };
}

/** 创建初始棋盘，确保没有初始三连 */
function createBoard(): Cell[][] {
  const board: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      let gem = randomGem();
      // 避免水平三连
      while (
        c >= 2 &&
        board[r][c - 1].color === gem.color &&
        board[r][c - 2].color === gem.color
      ) {
        gem = randomGem();
      }
      // 避免垂直三连
      while (
        r >= 2 &&
        board[r - 1][c].color === gem.color &&
        board[r - 2][c].color === gem.color
      ) {
        gem = randomGem();
      }
      board[r][c] = gem;
    }
  }
  return board;
}

/** 深拷贝棋盘 */
function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

/** 查找棋盘上所有匹配（横向和纵向 3+连） */
function findMatches(board: Cell[][]): { r: number; c: number }[][] {
  const matches: { r: number; c: number }[][] = [];
  const visited = new Set<string>();

  // 横向扫描
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const color = board[r][c].color;
      let end = c;
      while (end + 1 < COLS && board[r][end + 1].color === color) end++;
      const len = end - c + 1;
      if (len >= 3) {
        const group: { r: number; c: number }[] = [];
        for (let i = c; i <= end; i++) {
          const key = `${r},${i}`;
          if (!visited.has(key)) {
            visited.add(key);
          }
          group.push({ r, c: i });
        }
        matches.push(group);
      }
      c = end + 1;
    }
  }

  // 纵向扫描
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const color = board[r][c].color;
      let end = r;
      while (end + 1 < ROWS && board[end + 1][c].color === color) end++;
      const len = end - r + 1;
      if (len >= 3) {
        const group: { r: number; c: number }[] = [];
        for (let i = r; i <= end; i++) {
          group.push({ r: i, c });
        }
        matches.push(group);
      }
      r = end + 1;
    }
  }

  return matches;
}

/** 合并重叠的匹配组 */
function mergeGroups(matches: { r: number; c: number }[][]): { r: number; c: number }[][] {
  if (matches.length === 0) return [];
  const cellToGroup = new Map<string, number>();
  const groups: Set<string>[] = [];

  for (const match of matches) {
    const touching: Set<number> = new Set();
    for (const pos of match) {
      const key = `${pos.r},${pos.c}`;
      if (cellToGroup.has(key)) {
        touching.add(cellToGroup.get(key)!);
      }
    }

    if (touching.size === 0) {
      const idx = groups.length;
      const set = new Set<string>();
      for (const pos of match) {
        const key = `${pos.r},${pos.c}`;
        set.add(key);
        cellToGroup.set(key, idx);
      }
      groups.push(set);
    } else {
      const indices = Array.from(touching).sort((a, b) => a - b);
      const target = indices[0];
      for (const pos of match) {
        const key = `${pos.r},${pos.c}`;
        groups[target].add(key);
        cellToGroup.set(key, target);
      }
      for (let i = indices.length - 1; i >= 1; i--) {
        const src = indices[i];
        for (const key of groups[src]) {
          groups[target].add(key);
          cellToGroup.set(key, target);
        }
        groups[src] = new Set();
      }
    }
  }

  return groups
    .filter((s) => s.size > 0)
    .map((s) =>
      Array.from(s).map((key) => {
        const [r, c] = key.split(",").map(Number);
        return { r, c };
      })
    );
}

/** 决定特殊宝石类型 */
function decideSpecial(group: { r: number; c: number }[]): SpecialType {
  if (group.length >= 5) return "rainbow";

  const rows = new Set(group.map((p) => p.r));
  const cols = new Set(group.map((p) => p.c));
  if (rows.size >= 2 && cols.size >= 2 && group.length >= 5) return "bomb";

  if (group.length === 4) {
    if (rows.size === 1) return "stripe-h";
    if (cols.size === 1) return "stripe-v";
  }

  // L/T 型检测
  if (group.length >= 5 && rows.size >= 2 && cols.size >= 2) return "bomb";

  return "none";
}

/** 触发特殊宝石效果，返回额外被消除的坐标 */
function triggerSpecial(
  board: Cell[][],
  r: number,
  c: number
): { r: number; c: number }[] {
  const special = board[r][c].special;
  const extra: { r: number; c: number }[] = [];

  if (special === "stripe-h") {
    for (let cc = 0; cc < COLS; cc++) extra.push({ r, c: cc });
  } else if (special === "stripe-v") {
    for (let rr = 0; rr < ROWS; rr++) extra.push({ r: rr, c });
  } else if (special === "bomb") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          extra.push({ r: nr, c: nc });
        }
      }
    }
  } else if (special === "rainbow") {
    const targetColor = board[r][c].color;
    for (let rr = 0; rr < ROWS; rr++) {
      for (let cc = 0; cc < COLS; cc++) {
        if (board[rr][cc].color === targetColor) {
          extra.push({ r: rr, c: cc });
        }
      }
    }
  }

  return extra;
}

/**
 * 标记匹配并处理特殊宝石，返回本轮消除的宝石数和是否生成了特殊宝石
 */
function markAndRemoveMatches(board: Cell[][]): { removed: number; specialCreated: boolean } {
  const rawMatches = findMatches(board);
  if (rawMatches.length === 0) return { removed: 0, specialCreated: false };

  const groups = mergeGroups(rawMatches);
  const toRemove = new Set<string>();
  let specialCreated = false;

  for (const group of groups) {
    const specialType = decideSpecial(group);

    for (const pos of group) {
      // 触发已有特殊宝石
      if (board[pos.r][pos.c].special !== "none") {
        const extras = triggerSpecial(board, pos.r, pos.c);
        for (const e of extras) toRemove.add(`${e.r},${e.c}`);
      }
      toRemove.add(`${pos.r},${pos.c}`);
    }

    // 在匹配中心位置放置特殊宝石
    if (specialType !== "none") {
      const center = group[Math.floor(group.length / 2)];
      toRemove.delete(`${center.r},${center.c}`);
      board[center.r][center.c].special = specialType;
      board[center.r][center.c].matched = false;
      specialCreated = true;
    }
  }

  for (const key of toRemove) {
    const [r, c] = key.split(",").map(Number);
    board[r][c].matched = true;
  }

  return { removed: toRemove.size, specialCreated };
}

/** 应用重力：宝石下落 + 顶部填充新宝石 */
function applyGravity(board: Cell[][]): Cell[][] {
  const newBoard = cloneBoard(board);

  for (let c = 0; c < COLS; c++) {
    const col: Cell[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!newBoard[r][c].matched) {
        col.push(newBoard[r][c]);
      }
    }
    const missing = ROWS - col.length;
    for (let i = 0; i < missing; i++) {
      const gem = randomGem();
      gem.isNew = true;
      col.push(gem);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      newBoard[r][c] = col[ROWS - 1 - r];
    }
  }

  return newBoard;
}

/** 检查是否有合法交换 */
function hasValidMoves(board: Cell[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // 右交换
      if (c + 1 < COLS) {
        const b = cloneBoard(board);
        [b[r][c], b[r][c + 1]] = [b[r][c + 1], b[r][c]];
        if (findMatches(b).length > 0) return true;
      }
      // 下交换
      if (r + 1 < ROWS) {
        const b = cloneBoard(board);
        [b[r][c], b[r + 1][c]] = [b[r + 1][c], b[r][c]];
        if (findMatches(b).length > 0) return true;
      }
    }
  }
  return false;
}

// ─── 本地存储 ────────────────────────────────────────────────

const STORAGE_KEY = "playai_gem_crush_stats";

function emptyStats(): Stats {
  return { totalGames: 0, bestScore: 0, bestByMode: { steps: 0, time: 0, endless: 0 } };
}

function loadStats(): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
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

// ─── 组件 ────────────────────────────────────────────────────

/**
 * 宝石消消乐游戏组件
 * 经典三消玩法：交换相邻宝石消除三连，支持特殊道具和连击积分
 */
export function GemCrushGame() {
  const [board, setBoard] = useState<Cell[][]>(() => createBoard());
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [moves, setMoves] = useState(MAX_STEPS);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [mode, setMode] = useState<GameMode>("steps");
  const [gameOver, setGameOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loaded, setLoaded] = useState(false);
  const [invalidSwap, setInvalidSwap] = useState<{ r: number; c: number } | null>(null);
  const recordedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载统计
  useEffect(() => {
    setStats(loadStats());
    setLoaded(true);
  }, []);

  // 保存统计
  useEffect(() => {
    if (loaded) saveStats(stats);
  }, [stats, loaded]);

  // 时间模式计时器
  useEffect(() => {
    if (mode === "time" && !gameOver && loaded) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [mode, gameOver, loaded]);

  // 时间到则结束
  useEffect(() => {
    if (mode === "time" && timeLeft <= 0 && !gameOver) {
      endGame();
    }
  }, [timeLeft, mode, gameOver]);

  // 检查步数模式结束
  useEffect(() => {
    if (mode === "steps" && moves <= 0 && !gameOver) {
      endGame();
    }
  }, [moves, mode, gameOver]);

  /** 结束游戏并记录统计 */
  const endGame = useCallback(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    setGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setStats((prev) => {
      const s = { ...prev, totalGames: prev.totalGames + 1 };
      if (score > s.bestScore) s.bestScore = score;
      const byMode = { ...s.bestByMode };
      if (score > (byMode[mode] || 0)) byMode[mode] = score;
      s.bestByMode = byMode;
      return s;
    });
  }, [score, mode]);

  /** 处理连锁消除直到棋盘稳定 */
  const processChain = useCallback(
    async (b: Cell[][], currentCombo: number) => {
      let board = cloneBoard(b);
      let chainCombo = currentCombo;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { removed } = markAndRemoveMatches(board);
        if (removed === 0) break;

        chainCombo++;
        const multiplier = Math.min(chainCombo, 5);
        const points = removed * 10 * multiplier;

        setBoard(cloneBoard(board));
        setCombo(chainCombo);
        if (chainCombo > 1) {
          setShowCombo(true);
          setTimeout(() => setShowCombo(false), 800);
        }
        setScore((prev) => prev + points);

        await new Promise((resolve) => setTimeout(resolve, 300));

        // 清除已标记的并应用重力
        board = applyGravity(board);
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            board[r][c].matched = false;
          }
        }
        setBoard(cloneBoard(board));

        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      // 检查是否有合法交换
      if (!hasValidMoves(board)) {
        board = createBoard();
        setBoard(board);
      }

      return board;
    },
    []
  );

  /** 处理宝石点击 */
  const handleCellClick = useCallback(
    async (r: number, c: number) => {
      if (gameOver || isAnimating) return;

      if (!selected) {
        setSelected({ r, c });
        return;
      }

      const dr = Math.abs(selected.r - r);
      const dc = Math.abs(selected.c - c);

      // 取消选中（点自己）
      if (dr === 0 && dc === 0) {
        setSelected(null);
        return;
      }

      // 只允许相邻交换
      if (dr + dc !== 1) {
        setSelected({ r, c });
        return;
      }

      // 尝试交换
      const newBoard = cloneBoard(board);
      [newBoard[selected.r][selected.c], newBoard[r][c]] = [
        newBoard[r][c],
        newBoard[selected.r][selected.c],
      ];

      // 检查交换是否产生匹配
      if (findMatches(newBoard).length === 0) {
        setInvalidSwap({ r, c });
        setTimeout(() => setInvalidSwap(null), 400);
        setSelected(null);
        return;
      }

      setSelected(null);
      setIsAnimating(true);
      setBoard(newBoard);

      if (mode === "steps") setMoves((prev) => prev - 1);

      setCombo(0);
      await processChain(newBoard, 0);

      setIsAnimating(false);
    },
    [board, selected, gameOver, isAnimating, mode, processChain]
  );

  /** 重新开始游戏 */
  const resetGame = useCallback(
    (newMode?: GameMode) => {
      const m = newMode ?? mode;
      nextId = 1;
      recordedRef.current = false;
      setBoard(createBoard());
      setSelected(null);
      setScore(0);
      setCombo(0);
      setShowCombo(false);
      setMoves(MAX_STEPS);
      setTimeLeft(MAX_TIME);
      setGameOver(false);
      setIsAnimating(false);
      setInvalidSwap(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if (newMode) setMode(m);
    },
    [mode]
  );

  const modeLabel: Record<GameMode, string> = { steps: "步数限制", time: "限时挑战", endless: "无尽模式" };
  const ModeIcon: Record<GameMode, typeof Footprints> = { steps: Footprints, time: Timer, endless: Infinity };

  return (
    <div className="mx-auto max-w-xl animate-fade-in-up">
      {/* 标题区 */}
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-warm-border bg-white/80 px-4 py-1.5 text-base font-semibold text-warm-brown backdrop-blur-sm">
          <Gem className="h-4 w-4" /> 休闲游戏
        </div>
        <h1 className="mb-2 font-zcool text-3xl text-warm-dark">宝石消消乐</h1>
        <p className="text-base text-warm-text">
          交换相邻宝石组成三连消除，连击触发倍数加成，挑战最高分吧！
        </p>
      </div>

      {/* 控制面板 */}
      <div className="mb-4 rounded-2xl border border-warm-border/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-warm-text">分数</p>
            <p className="font-zcool text-2xl text-warm-dark">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-warm-text">连击</p>
            <p className={`font-zcool text-2xl ${combo > 1 ? "text-warm-coral" : "text-warm-dark"}`}>
              {combo > 0 ? `x${combo}` : "-"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-warm-text">
              {mode === "time" ? "时间" : mode === "steps" ? "剩余步数" : "模式"}
            </p>
            <p className="font-zcool text-2xl text-warm-dark">
              {mode === "time"
                ? `${timeLeft}s`
                : mode === "steps"
                  ? moves
                  : "∞"}
            </p>
          </div>
          <button
            onClick={() => resetGame()}
            className="flex items-center gap-1.5 rounded-full bg-warm-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-warm-brown"
          >
            <RotateCcw className="h-4 w-4" /> 重来
          </button>
        </div>

        {/* 模式切换 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-warm-text">模式</span>
          {(["steps", "time", "endless"] as GameMode[]).map((m) => {
            const Icon = ModeIcon[m];
            return (
              <button
                key={m}
                onClick={() => {
                  if (m !== mode) {
                    resetGame(m);
                  }
                }}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? "border-warm-peach bg-warm-peach text-white"
                    : "border-warm-border bg-white text-warm-text hover:bg-warm-light"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {modeLabel[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 游戏棋盘 */}
      <div className="relative mb-4">
        <div className="rounded-2xl border border-warm-border/60 bg-white/60 p-3 shadow-sm backdrop-blur-sm">
          <div className="grid-board">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isSelected =
                  selected?.r === r && selected?.c === c;
                const isInvalid =
                  invalidSwap?.r === r && invalidSwap?.c === c;
                return (
                  <button
                    key={cell.id}
                    onClick={() => handleCellClick(r, c)}
                    disabled={isAnimating}
                    className={`gem-cell ${isSelected ? "gem-selected" : ""} ${
                      cell.matched ? "gem-matched" : ""
                    } ${cell.isNew ? "gem-new" : ""} ${
                      isInvalid ? "gem-invalid" : ""
                    } ${cell.special !== "none" ? `gem-special gem-${cell.special}` : ""}`}
                    style={{ background: COLOR_BG[cell.color] }}
                    aria-label={`${cell.color} 宝石，第${r + 1}行第${c + 1}列`}
                  >
                    <span className="gem-emoji">{COLOR_EMOJI[cell.color]}</span>
                    {cell.special === "stripe-h" && <span className="stripe-overlay stripe-h" />}
                    {cell.special === "stripe-v" && <span className="stripe-overlay stripe-v" />}
                    {cell.special === "bomb" && <span className="bomb-overlay">💥</span>}
                    {cell.special === "rainbow" && <span className="rainbow-overlay">🌈</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Combo 弹出 */}
        {showCombo && combo > 1 && (
          <div className="combo-popup font-zcool">
            {combo}连击! x{Math.min(combo, 5)}
          </div>
        )}

        {/* 游戏结束遮罩 */}
        {gameOver && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-warm-dark/60 backdrop-blur-sm">
            <p className="mb-2 font-zcool text-4xl text-white">游戏结束</p>
            <p className="mb-4 text-lg text-warm-sand">最终得分：{score}</p>
            <button
              onClick={() => resetGame()}
              className="btn-warm px-6 py-3 text-base"
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      {/* 统计区 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-warm-border/60 bg-white/80 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warm-brown">
            <ChartLine className="h-4 w-4" /> 游戏统计
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xs text-warm-text">总局数</p>
              <p className="font-zcool text-xl text-warm-dark">{stats.totalGames}</p>
            </div>
            <div>
              <p className="text-xs text-warm-text">最高分</p>
              <p className="font-zcool text-xl text-warm-dark">{stats.bestScore}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-warm-border/60 bg-white/80 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warm-brown">
            <Trophy className="h-4 w-4" /> 模式最高
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-text">步数限制</span>
              <span className="font-semibold text-warm-dark">{stats.bestByMode.steps || "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-text">限时挑战</span>
              <span className="font-semibold text-warm-dark">{stats.bestByMode.time || "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-text">无尽模式</span>
              <span className="font-semibold text-warm-dark">{stats.bestByMode.endless || "--"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 规则说明 */}
      <div className="rounded-2xl border border-warm-border/60 bg-white/50 p-5 backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-warm-dark">
          <Info className="h-4 w-4" /> 游戏规则
        </h3>
        <ul className="space-y-2 text-sm leading-relaxed text-warm-text">
          <li>• 点击选中一颗宝石，再点击相邻宝石进行交换，只有能形成三连的交换才有效。</li>
          <li>• 匹配 4 颗宝石生成条纹宝石（消除整行/列），匹配 5 颗生成彩虹宝石（消除所有同色宝石）。</li>
          <li>• 连续消除触发连击加成，最高 5 倍积分。</li>
          <li>• 步数限制模式有 {MAX_STEPS} 步，限时挑战有 {MAX_TIME} 秒，无尽模式无限制。</li>
        </ul>
      </div>

      <style jsx>{`
        .grid-board {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
        }
        .gem-cell {
          aspect-ratio: 1;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.25s;
          position: relative;
          border: 2px solid transparent;
          overflow: hidden;
        }
        .gem-cell:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 2;
        }
        .gem-emoji {
          font-size: 1.3rem;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
          pointer-events: none;
        }
        .gem-selected {
          border-color: #fff;
          box-shadow: 0 0 0 3px rgba(255, 173, 133, 0.8), 0 4px 16px rgba(255, 173, 133, 0.4);
          transform: scale(1.1);
          z-index: 3;
        }
        .gem-matched {
          animation: gemPop 0.3s ease-out forwards;
        }
        .gem-new {
          animation: gemDrop 0.35s ease-out;
        }
        .gem-invalid {
          animation: gemShake 0.4s ease-out;
        }
        .gem-special {
          border-color: rgba(255, 255, 255, 0.6);
        }
        .stripe-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .stripe-overlay.stripe-h {
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 3px,
            rgba(255, 255, 255, 0.4) 3px,
            rgba(255, 255, 255, 0.4) 5px
          );
        }
        .stripe-overlay.stripe-v {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(255, 255, 255, 0.4) 3px,
            rgba(255, 255, 255, 0.4) 5px
          );
        }
        .bomb-overlay,
        .rainbow-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          font-size: 0.65rem;
          pointer-events: none;
        }
        .gem-bomb {
          animation: bombPulse 1s ease-in-out infinite;
        }
        .gem-rainbow {
          animation: rainbowGlow 1.5s linear infinite;
        }
        .combo-popup {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 2.5rem;
          color: #FF6B6B;
          text-shadow: 0 2px 8px rgba(255, 107, 107, 0.5);
          animation: comboIn 0.8s ease-out forwards;
          z-index: 20;
          pointer-events: none;
        }
        @keyframes gemPop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes gemDrop {
          0% { transform: translateY(-30px); opacity: 0; }
          60% { transform: translateY(4px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes gemShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes bombPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 200, 0, 0.4); }
          50% { box-shadow: 0 0 12px 4px rgba(255, 200, 0, 0.3); }
        }
        @keyframes rainbowGlow {
          0% { box-shadow: 0 0 8px 2px rgba(255, 0, 0, 0.3); }
          33% { box-shadow: 0 0 8px 2px rgba(0, 255, 0, 0.3); }
          66% { box-shadow: 0 0 8px 2px rgba(0, 0, 255, 0.3); }
          100% { box-shadow: 0 0 8px 2px rgba(255, 0, 0, 0.3); }
        }
        @keyframes comboIn {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -80%) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
