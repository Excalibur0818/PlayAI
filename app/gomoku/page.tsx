import { GomokuGame } from "@/components/gomoku-game";

/** 五子棋游戏页 */
export default function GomokuPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5f5f7_100%)] px-4 pb-12 pt-28 text-apple-dark">
      <GomokuGame />
    </main>
  );
}
