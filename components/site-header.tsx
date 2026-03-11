"use client";

import Link from "next/link";
import { Menu, Github, Cpu } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/#tools", label: "工具" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <nav className="glass-premium fixed left-0 right-0 top-0 z-50 border-b border-apple-border/30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-apple-dark to-gray-600 shadow-lg">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div className="pulse-dot absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">PlayAI</span>
            <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-xs text-apple-text sm:inline">Beta</span>
          </div>
        </Link>
        <div className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="nav-link text-sm text-apple-text transition-colors hover:text-apple-dark"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://github.com/Excalibur0818/PlayAI"
            target="_blank"
            rel="noreferrer"
            className="text-apple-text transition-colors hover:text-apple-dark"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
        <button type="button" className="text-apple-dark md:hidden" aria-label="打开导航菜单">
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
}