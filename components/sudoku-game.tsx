"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RotateCcw,
  Info,
  ChartLine,
  Trophy,
  Undo2,
  Lightbulb,
  PencilLine,
  Grid3X3,
  Eraser,
  Clock,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   常量与类型
   ═══════════════════════════════════════════════════════ */

/** 宫格类型：四宫、六宫、九宫 */
type GridType = "4x4" | "6x6" | "9x9";

/** 宫格配置：尺寸、宫行/列数、挖空数量 */
interface GridConfig {
  size: number;
  boxRows: number;
  boxCols: number;
  label: string;
  cluesRemoved: number;
}

const GRID_CONFIGS: Record<GridType, GridConfig> = {
  "4x4": { size: 4, boxRows: 2, boxCols: 2, label: "四宫", cluesRemoved: 8 },
  "6x6": { size: 6, boxRows: 2, boxCols: 3, label: "六宫", cluesRemoved: 20 },
  "9x9": { size: 9, boxRows: 3, boxCols: 3, label: "九宫", cluesRemoved: 45 },
};

const STATS_KEY = "playai_sudoku_stats";

/** 单元格数据 */
interface Cell {
  value: number;
  given: boolean;
  notes: Set<number>;
  error: boolean;
}

/** 历史操作，用于撤销 */
interface HistoryEntry {
  row: number;
  col: number;
  prevValue: number;
  prevNotes: Set<number>;
  wasNote: boolean;
}

/** 游戏状态 */
interface GameState {
  grid: Cell[][];
  solution: number[][];
  selected: { row: number; col: number } | null;
  history: HistoryEntry[];
  over: boolean;
  won: boolean;
  errors: number;
  hintsUsed: number;
  noteMode: boolean;
}

/** 持久化战绩 */
interface Stats {
  total: number;
  wins: number;
  byGrid: Record<GridType, { games: number; wins: number; bestTime: number }>;
}

/* ═══════════════════════════════════════════════════════
   纯函数：数独生成
   ═══════════════════════════════════════════════════════ */

/** 洗牌数组 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 判断在 (row, col) 放置 num 是否合法 */
function isValid(
  board: number[][],
  row: number,
  col: number,
  num: number,
  config: GridConfig,
): boolean {
  const { size, boxRows, boxCols } = config;

  for (let c = 0; c < size; c++) {
    if (board[row][c] === num) return false;
  }
  for (let r = 0; r < size; r++) {
    if (board[r][col] === num) return false;
  }

  const br = Math.floor(row / boxRows) * boxRows;
  const bc = Math.floor(col / boxCols) * boxCols;
  for (let r = br; r < br + boxRows; r++) {
    for (let c = bc; c < bc + boxCols; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

/** 回溯法填充完整数独 */
function fillBoard(board: number[][], config: GridConfig): boolean {
  const { size } = config;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== 0) continue;
      const nums = shuffle(
        Array.from({ length: size }, (_, i) => i + 1),
      );
      for (const n of nums) {
        if (isValid(board, r, c, n, config)) {
          board[r][c] = n;
          if (fillBoard(board, config)) return true;
          board[r][c] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

/** 生成数独谜题：返回 [题目, 答案] */
function generatePuzzle(
  gridType: GridType,
): { puzzle: number[][]; solution: number[][] } {
  const config = GRID_CONFIGS[gridType];
  const { size, cluesRemoved } = config;

  const solution = Array.from({ length: size }, () =>
    Array<number>(size).fill(0),
  );
  fillBoard(solution, config);

  const puzzle = solution.map((row) => [...row]);

  const positions = shuffle(
    Array.from({ length: size * size }, (_, i) => [
      Math.floor(i / size),
      i % size,
    ]),
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= cluesRemoved) break;
    puzzle[r][c] = 0;
    removed++;
  }

  return { puzzle, solution };
}

/* ═══════════════════════════════════════════════════════
   纯函数：状态管理
   ═══════════════════════════════════════════════════════ */

function createGrid(puzzle: number[][]): Cell[][] {
  return puzzle.map((row) =>
    row.map((v) => ({
      value: v,
      given: v !== 0,
      notes: new Set<number>(),
      error: false,
    })),
  );
}

function initGame(gridType: GridType): GameState {
  const { puzzle, solution } = generatePuzzle(gridType);
  return {
    grid: createGrid(puzzle),
    solution,
    selected: null,
    history: [],
    over: false,
    won: false,
    errors: 0,
    hintsUsed: 0,
    noteMode: false,
  };
}

function emptyStats(): Stats {
  return {
    total: 0,
    wins: 0,
    byGrid: {
      "4x4": { games: 0, wins: 0, bestTime: 0 },
      "6x6": { games: 0, wins: 0, bestTime: 0 },
      "9x9": { games: 0, wins: 0, bestTime: 0 },
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
      byGrid: {
        "4x4": { ...b.byGrid["4x4"], ...(p.byGrid?.["4x4"] ?? {}) },
        "6x6": { ...b.byGrid["6x6"], ...(p.byGrid?.["6x6"] ?? {}) },
        "9x9": { ...b.byGrid["9x9"], ...(p.byGrid?.["9x9"] ?? {}) },
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** 检查整个棋盘是否完成且正确 */
function checkComplete(grid: Cell[][], solution: number[][]): boolean {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c].value !== solution[r][c]) return false;
    }
  }
  return true;
}

/* ═══════════════════════════════════════════════════════
   组件
   ═══════════════════════════════════════════════════════ */

/**
 * 数独游戏主组件
 * 支持四宫(4x4)、六宫(6x6)、九宫(9x9)三种模式
 */
export function SudokuGame() {
  const [gridType, setGridType] = useState<GridType>("9x9");
  const [game, setGame] = useState<GameState>(() => initGame("9x9"));
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loaded, setLoaded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recordedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = GRID_CONFIGS[gridType];

  useEffect(() => {
    setStats(loadStats());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveStats(stats);
  }, [stats, loaded]);

  /** 计时器：游戏进行中每秒自增 */
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!game.over) {
      timerRef.current = setInterval(() => {
        setElapsed((p) => p + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game.over]);

  /** 对局结束时记录战绩 */
  useEffect(() => {
    if (!game.over || !game.won) return;
    if (recordedRef.current) return;
    recordedRef.current = true;

    setStats((s) => {
      const n = structuredClone(s) as Stats;
      n.total++;
      n.wins++;
      const g = n.byGrid[gridType];
      g.games++;
      g.wins++;
      if (g.bestTime === 0 || elapsed < g.bestTime) {
        g.bestTime = elapsed;
      }
      return n;
    });
  }, [game.over, game.won, gridType, elapsed]);

  /** 点击单元格选中 */
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (game.over) return;
      setGame((prev) => ({ ...prev, selected: { row, col } }));
    },
    [game.over],
  );

  /** 填入数字或笔记 */
  const handleNumberInput = useCallback(
    (num: number) => {
      setGame((prev) => {
        if (prev.over || !prev.selected) return prev;
        const { row, col } = prev.selected;
        const cell = prev.grid[row][col];
        if (cell.given) return prev;

        const grid = prev.grid.map((r) =>
          r.map((c) => ({ ...c, notes: new Set(c.notes) })),
        );
        const historyEntry: HistoryEntry = {
          row,
          col,
          prevValue: cell.value,
          prevNotes: new Set(cell.notes),
          wasNote: prev.noteMode,
        };

        if (prev.noteMode) {
          const notes = grid[row][col].notes;
          if (notes.has(num)) notes.delete(num);
          else notes.add(num);
          grid[row][col] = { ...grid[row][col], value: 0, notes };
        } else {
          const correct = prev.solution[row][col] === num;
          grid[row][col] = {
            ...grid[row][col],
            value: num,
            notes: new Set<number>(),
            error: !correct,
          };

          if (correct) {
            clearRelatedNotes(grid, row, col, num, config);
          }

          const errors = prev.errors + (correct ? 0 : 1);
          const won = correct && checkComplete(grid, prev.solution);

          return {
            ...prev,
            grid,
            history: [...prev.history, historyEntry],
            errors,
            over: won,
            won,
          };
        }

        return {
          ...prev,
          grid,
          history: [...prev.history, historyEntry],
        };
      });
    },
    [config],
  );

  /** 填入正确数字后，清除同行/列/宫中的相关笔记 */
  const clearRelatedNotes = (
    grid: Cell[][],
    row: number,
    col: number,
    num: number,
    cfg: GridConfig,
  ) => {
    const { size, boxRows, boxCols } = cfg;
    for (let c = 0; c < size; c++) grid[row][c].notes.delete(num);
    for (let r = 0; r < size; r++) grid[r][col].notes.delete(num);
    const br = Math.floor(row / boxRows) * boxRows;
    const bc = Math.floor(col / boxCols) * boxCols;
    for (let r = br; r < br + boxRows; r++) {
      for (let c = bc; c < bc + boxCols; c++) {
        grid[r][c].notes.delete(num);
      }
    }
  };

  /** 擦除当前选中单元格 */
  const handleErase = useCallback(() => {
    setGame((prev) => {
      if (prev.over || !prev.selected) return prev;
      const { row, col } = prev.selected;
      const cell = prev.grid[row][col];
      if (cell.given) return prev;

      const grid = prev.grid.map((r) =>
        r.map((c) => ({ ...c, notes: new Set(c.notes) })),
      );
      const historyEntry: HistoryEntry = {
        row,
        col,
        prevValue: cell.value,
        prevNotes: new Set(cell.notes),
        wasNote: false,
      };

      grid[row][col] = {
        ...grid[row][col],
        value: 0,
        notes: new Set<number>(),
        error: false,
      };

      return {
        ...prev,
        grid,
        history: [...prev.history, historyEntry],
      };
    });
  }, []);

  /** 撤销上一步操作 */
  const handleUndo = useCallback(() => {
    setGame((prev) => {
      if (prev.over || prev.history.length === 0) return prev;
      const history = [...prev.history];
      const entry = history.pop()!;

      const grid = prev.grid.map((r) =>
        r.map((c) => ({ ...c, notes: new Set(c.notes) })),
      );
      grid[entry.row][entry.col] = {
        ...grid[entry.row][entry.col],
        value: entry.prevValue,
        notes: new Set(entry.prevNotes),
        error: false,
      };

      return { ...prev, grid, history };
    });
  }, []);

  /** 提示：填入一个正确数字 */
  const handleHint = useCallback(() => {
    setGame((prev) => {
      if (prev.over) return prev;

      const emptyCells: { row: number; col: number }[] = [];
      for (let r = 0; r < prev.grid.length; r++) {
        for (let c = 0; c < prev.grid[r].length; c++) {
          if (prev.grid[r][c].value !== prev.solution[r][c]) {
            emptyCells.push({ row: r, col: c });
          }
        }
      }
      if (emptyCells.length === 0) return prev;

      const target =
        prev.selected &&
        prev.grid[prev.selected.row][prev.selected.col].value !==
          prev.solution[prev.selected.row][prev.selected.col]
          ? prev.selected
          : emptyCells[Math.floor(Math.random() * emptyCells.length)];

      const grid = prev.grid.map((r) =>
        r.map((c) => ({ ...c, notes: new Set(c.notes) })),
      );
      const correctVal = prev.solution[target.row][target.col];
      grid[target.row][target.col] = {
        value: correctVal,
        given: false,
        notes: new Set<number>(),
        error: false,
      };

      const won = checkComplete(grid, prev.solution);

      return {
        ...prev,
        grid,
        selected: target,
        hintsUsed: prev.hintsUsed + 1,
        over: won,
        won,
      };
    });
  }, []);

  /** 开始新局 */
  const reset = useCallback(
    (type?: GridType) => {
      const gt = type ?? gridType;
      setGame(initGame(gt));
      setElapsed(0);
      recordedRef.current = false;
    },
    [gridType],
  );

  /** 切换宫格类型 */
  const switchGrid = (type: GridType) => {
    if (type !== gridType) {
      setGridType(type);
      reset(type);
    }
  };

  /** 切换笔记模式 */
  const toggleNoteMode = () => {
    setGame((prev) => ({ ...prev, noteMode: !prev.noteMode }));
  };

  /** 键盘输入支持 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= config.size) {
        handleNumberInput(num);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleErase();
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config.size, handleNumberInput, handleErase, handleUndo]);

  /** 判断 (r, c) 是否高亮（同行/同列/同宫） */
  const isHighlighted = (r: number, c: number) => {
    if (!game.selected) return false;
    const { row, col } = game.selected;
    if (r === row || c === col) return true;

    const br1 = Math.floor(row / config.boxRows) * config.boxRows;
    const bc1 = Math.floor(col / config.boxCols) * config.boxCols;
    const br2 = Math.floor(r / config.boxRows) * config.boxRows;
    const bc2 = Math.floor(c / config.boxCols) * config.boxCols;
    return br1 === br2 && bc1 === bc2;
  };

  /** 判断 (r, c) 是否与选中格同数字 */
  const isSameNumber = (r: number, c: number) => {
    if (!game.selected) return false;
    const selectedCell =
      game.grid[game.selected.row][game.selected.col];
    const cell = game.grid[r][c];
    return (
      selectedCell.value !== 0 &&
      cell.value !== 0 &&
      selectedCell.value === cell.value
    );
  };

  /** 计算每个数字已正确填入的次数，用于禁用已满的数字按钮 */
  const numberCounts = (() => {
    const counts: Record<number, number> = {};
    for (let n = 1; n <= config.size; n++) counts[n] = 0;
    for (let r = 0; r < game.grid.length; r++) {
      for (let c = 0; c < game.grid[r].length; c++) {
        const v = game.grid[r][c].value;
        if (v > 0 && v === game.solution[r][c]) {
          counts[v] = (counts[v] || 0) + 1;
        }
      }
    }
    return counts;
  })();

  const cellSizePx =
    gridType === "4x4" ? 64 : gridType === "6x6" ? 52 : 44;
  const boardPx = cellSizePx * config.size;

  const statusText = game.over
    ? game.won
      ? "恭喜通关！"
      : "游戏结束"
    : "游戏中";

  return (
    <div className="mx-auto w-full max-w-xl px-1 sm:px-2 animate-fade-in-up">
      {/* ── 标题区 ──────────────────────────────── */}
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-warm-border bg-white/80 px-4 py-1.5 text-base font-semibold text-warm-brown backdrop-blur-sm">
          <Grid3X3 className="h-4 w-4" /> 逻辑游戏
        </div>
        <h1 className="mb-2 font-zcool text-3xl text-warm-dark">数独</h1>
        <p className="text-base text-warm-text">
          经典数字逻辑游戏，在每行、每列、每宫中填入不重复的数字。
        </p>
      </div>

      {/* ── 控制面板 ──────────────────────────────── */}
      <div className="mb-4 space-y-4 rounded-2xl border border-warm-border/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        {/* 状态行 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[56px] text-center">
            <p className="text-xs text-warm-text">用时</p>
            <p className="font-zcool text-2xl text-warm-dark">
              {formatTime(elapsed)}
            </p>
          </div>

          <div className="min-w-[70px] text-center">
            <p className="text-xs text-warm-text">状态</p>
            <p
              className={`text-sm font-medium ${
                game.over && game.won
                  ? "text-green-600"
                  : "text-warm-peach"
              }`}
            >
              {statusText}
            </p>
          </div>

          <div className="min-w-[50px] text-center">
            <p className="text-xs text-warm-text">错误</p>
            <p
              className={`font-zcool text-2xl ${game.errors > 0 ? "text-red-500" : "text-warm-dark"}`}
            >
              {game.errors}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="flex items-center gap-1.5 rounded-full bg-warm-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-warm-brown"
            >
              <RotateCcw className="h-4 w-4" />
              新局
            </button>
          </div>
        </div>

        {/* 宫格切换 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-warm-text">棋盘</span>
          {(Object.keys(GRID_CONFIGS) as GridType[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => switchGrid(k)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                gridType === k
                  ? "border-warm-peach bg-warm-peach text-white"
                  : "border-warm-border bg-white text-warm-text hover:bg-warm-light"
              }`}
            >
              {GRID_CONFIGS[k].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 棋盘 ──────────────────────────────────── */}
      <div className="flex animate-fade-in-up justify-center">
        <div
          className={`overflow-hidden rounded-2xl border-2 bg-white shadow-warm-card ${
            game.over && game.won
              ? "border-green-400/60 ring-2 ring-green-400/30"
              : "border-warm-border"
          }`}
          style={{ width: "fit-content" }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${config.size}, ${cellSizePx}px)`,
              gridTemplateRows: `repeat(${config.size}, ${cellSizePx}px)`,
              width: boardPx,
              height: boardPx,
            }}
          >
            {game.grid.map((row, r) =>
              row.map((cell, c) => {
                const isSelected =
                  game.selected?.row === r && game.selected?.col === c;
                const highlighted = isHighlighted(r, c);
                const sameNum = isSameNumber(r, c);

                const borderR =
                  (c + 1) % config.boxCols === 0 &&
                  c < config.size - 1;
                const borderB =
                  (r + 1) % config.boxRows === 0 &&
                  r < config.size - 1;

                let bgClass = "bg-white";
                if (isSelected) bgClass = "bg-warm-peach/25";
                else if (sameNum) bgClass = "bg-warm-peach/15";
                else if (highlighted) bgClass = "bg-warm-light/80";

                const textClass = cell.given
                  ? "text-warm-dark font-bold"
                  : cell.error
                    ? "text-red-500 font-semibold"
                    : "text-warm-brown font-medium";

                const fontSize =
                  gridType === "4x4"
                    ? "text-2xl"
                    : gridType === "6x6"
                      ? "text-xl"
                      : "text-lg";

                const noteFontSize =
                  gridType === "4x4"
                    ? "text-xs"
                    : gridType === "6x6"
                      ? "text-[10px]"
                      : "text-[9px]";

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    className={`relative flex items-center justify-center border-warm-border/50 transition-colors duration-100 ${bgClass} ${
                      c < config.size - 1 ? "border-r" : ""
                    } ${r < config.size - 1 ? "border-b" : ""} ${
                      borderR ? "!border-r-2 !border-r-warm-brown/30" : ""
                    } ${borderB ? "!border-b-2 !border-b-warm-brown/30" : ""} ${
                      isSelected
                        ? "ring-2 ring-inset ring-warm-peach/60 z-10"
                        : ""
                    }`}
                    style={{
                      width: cellSizePx,
                      height: cellSizePx,
                    }}
                  >
                    {cell.value !== 0 ? (
                      <span className={`${fontSize} ${textClass}`}>
                        {cell.value}
                      </span>
                    ) : cell.notes.size > 0 ? (
                      <div
                        className="grid gap-0"
                        style={{
                          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(config.size))}, 1fr)`,
                          width: "85%",
                          height: "85%",
                        }}
                      >
                        {Array.from(
                          { length: config.size },
                          (_, i) => i + 1,
                        ).map((n) => (
                          <span
                            key={n}
                            className={`flex items-center justify-center ${noteFontSize} leading-none ${
                              cell.notes.has(n)
                                ? "text-warm-brown"
                                : "text-transparent"
                            }`}
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* ── 操作按钮行 ──────────────────────────── */}
      <div className="mt-4 flex justify-center gap-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={game.history.length === 0 || game.over}
          className="flex flex-col items-center gap-1 rounded-xl border border-warm-border px-3 py-2 text-warm-dark transition-colors hover:bg-warm-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 className="h-5 w-5" />
          <span className="text-xs">撤销</span>
        </button>
        <button
          type="button"
          onClick={handleErase}
          disabled={game.over}
          className="flex flex-col items-center gap-1 rounded-xl border border-warm-border px-3 py-2 text-warm-dark transition-colors hover:bg-warm-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Eraser className="h-5 w-5" />
          <span className="text-xs">擦除</span>
        </button>
        <button
          type="button"
          onClick={toggleNoteMode}
          disabled={game.over}
          className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            game.noteMode
              ? "border-warm-peach bg-warm-peach text-white"
              : "border-warm-border text-warm-dark hover:bg-warm-light"
          }`}
        >
          <PencilLine className="h-5 w-5" />
          <span className="text-xs">笔记</span>
        </button>
        <button
          type="button"
          onClick={handleHint}
          disabled={game.over}
          className="flex flex-col items-center gap-1 rounded-xl border border-warm-border px-3 py-2 text-warm-dark transition-colors hover:bg-warm-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Lightbulb className="h-5 w-5" />
          <span className="text-xs">提示</span>
        </button>
      </div>

      {/* ── 数字键盘 ──────────────────────────────── */}
      <div className="mt-3 flex justify-center gap-1.5 flex-wrap">
        {Array.from({ length: config.size }, (_, i) => i + 1).map(
          (n) => {
            const isFull = numberCounts[n] >= config.size;
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleNumberInput(n)}
                disabled={game.over || isFull}
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold transition-all ${
                  isFull
                    ? "border border-warm-border/40 bg-warm-light/50 text-warm-border cursor-not-allowed"
                    : game.selected &&
                        game.grid[game.selected.row][game.selected.col]
                          .value === n
                      ? "border-2 border-warm-peach bg-warm-peach text-white shadow-md"
                      : "border border-warm-border bg-white text-warm-dark hover:bg-warm-light hover:border-warm-peach/60 active:scale-95"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {n}
              </button>
            );
          },
        )}
      </div>

      {/* ── 胜利提示 ──────────────────────────────── */}
      {game.over && game.won && (
        <div className="mt-4 animate-fade-in-up rounded-2xl border border-green-300/60 bg-green-50/80 p-4 text-center backdrop-blur-sm">
          <p className="mb-1 font-zcool text-2xl text-green-700">
            恭喜通关！
          </p>
          <p className="text-sm text-green-600">
            用时 {formatTime(elapsed)}
            {game.errors > 0 && `，犯错 ${game.errors} 次`}
            {game.hintsUsed > 0 && `，使用 ${game.hintsUsed} 次提示`}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            <RotateCcw className="h-4 w-4" />
            再来一局
          </button>
        </div>
      )}

      {/* ── 战绩统计 ──────────────────────────── */}
      <div className="mt-4 mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-warm-border/60 bg-white/80 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warm-brown">
            <ChartLine className="h-4 w-4" /> 游戏统计
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-warm-text">总局数</p>
              <p className="font-zcool text-xl text-warm-dark">
                {stats.total}
              </p>
            </div>
            <div>
              <p className="text-xs text-warm-text">胜率</p>
              <p className="font-zcool text-xl text-warm-dark">
                {pct(stats.wins, stats.total)}
              </p>
            </div>
            <div>
              <p className="text-xs text-warm-text">通关</p>
              <p className="font-zcool text-xl text-warm-dark">
                {stats.wins}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-warm-border/60 bg-white/80 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warm-brown">
            <Trophy className="h-4 w-4" /> 分棋盘
          </div>
          <div className="space-y-1 text-sm">
            {(Object.keys(GRID_CONFIGS) as GridType[]).map((k) => {
              const g = stats.byGrid[k];
              return (
                <div key={k} className="flex justify-between">
                  <span className="text-warm-text">
                    {GRID_CONFIGS[k].label}
                  </span>
                  <span
                    className={`font-semibold ${
                      k === gridType
                        ? "text-warm-peach"
                        : "text-warm-dark"
                    }`}
                  >
                    {pct(g.wins, g.games)} ({g.games}局)
                    {g.bestTime > 0 && (
                      <span className="ml-1 text-xs text-warm-text">
                        <Clock className="mr-0.5 inline h-3 w-3" />
                        {formatTime(g.bestTime)}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 规则说明 ──────────────────────────────── */}
      <div className="mt-4 rounded-2xl border border-warm-border/60 bg-white/50 p-5 backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-warm-dark">
          <Info className="h-4 w-4" /> 游戏规则
        </h3>
        <ul className="space-y-2 text-sm leading-relaxed text-warm-text">
          <li>• 在空格中填入数字，使每行、每列、每个宫格内数字不重复。</li>
          <li>
            • 四宫使用 1-4，六宫使用 1-6，九宫使用 1-9。
          </li>
          <li>• 点击单元格选中后，通过数字键盘输入数字，也可使用键盘输入。</li>
          <li>
            • 笔记模式下可以在格中标记候选数字，方便推理。
          </li>
          <li>• 使用提示可自动填入一个正确数字。</li>
        </ul>
      </div>
    </div>
  );
}
