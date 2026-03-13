"use client";

import Link from "next/link";
import { Menu, Gamepad2 } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/#games", label: "游戏" },
];

/**
 * 网站顶部导航栏 - 暖色毛玻璃效果 + 游戏手柄 Logo
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <nav className="glass-warm fixed left-0 right-0 top-0 z-50 border-b border-warm-border/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-warm-peach to-warm-amber shadow-warm">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-zcool text-xl tracking-tight text-warm-dark">PlayAI</span>
            <span className="hidden rounded-full bg-warm-light px-2 py-0.5 text-xs font-semibold text-warm-brown sm:inline">
              Beta
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="nav-warm text-base text-warm-text transition-colors hover:text-warm-dark"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button type="button" className="text-warm-dark md:hidden" aria-label="打开导航菜单">
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
}
