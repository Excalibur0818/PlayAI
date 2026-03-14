import { PopStarGame } from "@/components/pop-star-game";

/**
 * 消灭星星游戏页 - 暖色温馨背景
 */
export default function PopStarPage() {
  return (
    <main className="hero-warm hero-warm-glow min-h-screen px-4 pb-12 pt-28 text-warm-dark">
      <PopStarGame />
    </main>
  );
}