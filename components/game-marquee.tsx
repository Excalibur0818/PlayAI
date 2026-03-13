"use client";

/**
 * 游戏缩略图无限滚动条组件
 * 使用内联 CSS animation 实现无缝循环
 * 渲染两份相同内容，通过 translateX(-50%) 动画实现无缝衔接
 */

const marqueeItems = [
  { emoji: "🐱", label: "围住小猫", color: "from-amber-400 to-orange-400" },
  { emoji: "⚫", label: "五子棋", color: "from-rose-400 to-pink-400" },
  { emoji: "💎", label: "宝石消消乐", color: "from-emerald-400 to-teal-400" },
  { emoji: "🎮", label: "更多游戏", color: "from-warm-peach to-warm-amber" },
  { emoji: "🎲", label: "休闲娱乐", color: "from-warm-pink to-rose-300" },
  { emoji: "🏆", label: "挑战自我", color: "from-amber-300 to-yellow-400" },
  { emoji: "🧩", label: "益智解谜", color: "from-orange-300 to-amber-400" },
  { emoji: "⭐", label: "经典回忆", color: "from-warm-amber to-orange-400" },
  { emoji: "🎯", label: "策略对弈", color: "from-rose-300 to-warm-pink" },
];

/**
 * 单个滚动项卡片
 */
function MarqueeCard({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <div className="mx-2 flex flex-shrink-0 items-center gap-2.5 rounded-2xl border border-warm-border/40 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-sm">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}
      >
        <span className="text-sm">{emoji}</span>
      </div>
      <span className="whitespace-nowrap text-base font-semibold text-warm-dark">{label}</span>
    </div>
  );
}

export function GameMarquee() {
  const doubled = [...marqueeItems, ...marqueeItems];

  return (
    <section className="relative bg-warm-sand/40 py-6">
      <div className="mb-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-warm-brown/60">
          Game Collection
        </span>
      </div>

      <div
        className="overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div className="flex w-max" style={{ animation: "marquee 25s linear infinite" }}>
          {doubled.map((item, i) => (
            <MarqueeCard key={`${item.label}-${i}`} {...item} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
