import Link from "next/link";
import type { ReactNode } from "react";

type ToolCardProps = {
  href: string;
  title: string;
  description: string;
  badge: string;
  icon: ReactNode;
  gradient: string;
};

/**
 * 游戏卡片组件 - 暖色系设计，hover 时上浮并显示温暖阴影
 */
export function ToolCard({ href, title, description, badge, icon, gradient }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="card-warm game-card group block overflow-hidden"
    >
      <div className="relative h-36 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            {icon}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-zcool text-lg transition-colors group-hover:text-warm-peach">
            {title}
          </h3>
          <span className="rounded-full bg-warm-light px-2.5 py-0.5 text-sm font-semibold text-warm-brown">
            {badge}
          </span>
        </div>
        <p className="mb-4 text-base leading-relaxed text-warm-text">{description}</p>
        <span className="inline-flex items-center text-base font-bold text-warm-peach transition-transform group-hover:translate-x-1">
          开始游戏 <span className="ml-2">→</span>
        </span>
      </div>
    </Link>
  );
}
