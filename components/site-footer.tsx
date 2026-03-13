import Link from "next/link";
import { Cpu, Github, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative bg-apple-dark py-16 text-white">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-semibold">PlayAI</span>
              <p className="mt-1 text-xs text-gray-500">策略游戏合集</p>
            </div>
          </div>

          <div className="flex gap-8 text-sm text-gray-400">
            <Link href="#">使用条款</Link>
            <Link href="#">隐私政策</Link>
          </div>

          <div className="flex gap-4">
            <a
              href="https://github.com/Excalibur0818/PlayAI"
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all duration-300 hover:bg-white/20"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="mailto:excalibur0818@gmail.com"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all duration-300 hover:bg-white/20"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-500">© 2026 PlayAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}