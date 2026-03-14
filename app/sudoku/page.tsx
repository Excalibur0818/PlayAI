import { SudokuGame } from "@/components/sudoku-game";

/**
 * 数独游戏页 - 暖色温馨背景
 */
export default function SudokuPage() {
  return (
    <main className="hero-warm hero-warm-glow min-h-screen w-full px-2 pb-12 pt-28 text-warm-dark">
      <SudokuGame />
    </main>
  );
}
