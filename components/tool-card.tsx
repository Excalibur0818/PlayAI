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

export function ToolCard({ href, title, description, badge, icon, gradient }: ToolCardProps) {
  return (
    <Link href={href} className="tool-card card-hover group block overflow-hidden rounded-3xl border border-gray-100/50 bg-white shadow-sm">
      <div className="relative h-44 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            {icon}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      <div className="p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold transition-colors group-hover:text-apple-blue">{title}</h3>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-apple-text">{badge}</span>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-apple-text">{description}</p>
        <span className="inline-flex items-center text-sm font-semibold text-apple-blue transition-transform group-hover:translate-x-1">
          立即使用 <span className="ml-2">→</span>
        </span>
      </div>
    </Link>
  );
}