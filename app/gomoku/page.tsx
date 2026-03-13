import { GomokuGame } from "@/components/gomoku-game";

/**
 * 五子棋游戏页 - 暖色温馨背景
 */
export default function GomokuPage() {
  return (
    <main className="hero-warm hero-warm-glow min-h-screen w-full px-2 pb-12 pt-28 text-warm-dark">
      <GomokuGame />
    </main>
  );
}
