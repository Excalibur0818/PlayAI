import Link from "next/link";
import { Gamepad2, Github, Mail } from "lucide-react";

/**
 * 网站底部页脚 - 深色背景 + 白色文字 + 紧凑布局
 */
export function SiteFooter() {
  return (
    <footer className="relative py-8" style={{ background: "#2C1E12" }}>
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-warm-brown/30 to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Gamepad2 className="h-4 w-4 text-warm-peach" />
            </div>
            <span className="font-zcool text-lg text-white">PlayAI</span>
          </div>

          <div className="flex gap-6 text-base text-white/80">
            <Link href="#" className="transition-colors hover:text-warm-peach">使用条款</Link>
            <Link href="#" className="transition-colors hover:text-warm-peach">隐私政策</Link>
          </div>

          <div className="flex gap-3">
            <a
              href="https://github.com/Excalibur0818/PlayAI"
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/80 transition-all duration-300 hover:bg-warm-peach/20 hover:text-warm-peach"
              aria-label="GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
            <a
              href="mailto:excalibur0818@gmail.com"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/80 transition-all duration-300 hover:bg-warm-peach/20 hover:text-warm-peach"
              aria-label="Email"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5 text-center">
          <p className="text-xs text-white/50">© 2026 PlayAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
