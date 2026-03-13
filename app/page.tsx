import { Gamepad2, Star, Heart, Dice1, Sparkles } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { GameMarquee } from "@/components/game-marquee";
import { tools } from "@/lib/site-data";

/**
 * 主页 - 温暖温馨风格的游戏合集展示页
 * 包含 Hero 区域、游戏展示区、底部滚动条
 */
export default function HomePage() {
  return (
    <main>
      {/* ===== Hero 区域（紧凑版） ===== */}
      <section
        id="home"
        className="hero-warm hero-warm-glow relative flex min-h-[45vh] items-center justify-center overflow-hidden pt-20 pb-8"
      >
        {/* 装饰性漂浮元素 */}
        <div className="pointer-events-none absolute inset-0">
          <Star className="absolute left-[10%] top-[20%] h-5 w-5 animate-float text-warm-amber/20" />
          <Heart className="absolute right-[15%] top-[25%] h-4 w-4 animate-float-delayed text-warm-pink/25" />
          <Dice1 className="absolute left-[20%] bottom-[25%] h-6 w-6 animate-float-slow text-warm-peach/15" />
          <Gamepad2 className="absolute right-[10%] bottom-[30%] h-5 w-5 animate-float text-warm-amber/20" />
          <Star className="absolute left-[45%] top-[15%] h-3 w-3 animate-float-delayed text-warm-coral/15" />
          <Sparkles className="absolute right-[30%] top-[18%] h-4 w-4 animate-float-slow text-warm-pink/20" />
        </div>

        {/* 暖色光晕装饰 */}
        <div className="absolute left-10 top-1/4 h-64 w-64 rounded-full bg-warm-peach/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-10 h-80 w-80 rounded-full bg-warm-pink/6 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* 标签 */}
          <div className="mb-5 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-warm-border bg-white/80 px-5 py-2 shadow-sm backdrop-blur-sm">
            <span className="text-base font-semibold text-warm-brown">
              🎮 经典游戏合集 · 一起来玩吧
            </span>
          </div>

          {/* 主标题 */}
          <h1 className="mb-4 animate-fade-in-up font-zcool text-5xl leading-tight tracking-tight md:text-7xl">
            <span className="text-warm-dark">Play</span>
            <span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #FFAD85, #FF6B6B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI
            </span>
          </h1>

          {/* 副标题 */}
          <p className="mx-auto mb-6 max-w-2xl animate-fade-in-up text-lg leading-relaxed text-warm-text delay-100 md:text-xl">
            围住小猫、五子棋等经典游戏，在浏览器中尽情畅玩。
            <br />
            <span className="text-warm-brown">温暖的午后，来一局轻松的小游戏吧 ☀️</span>
          </p>

          {/* CTA 按钮 */}
          <div className="flex animate-fade-in-up flex-wrap justify-center gap-4 delay-200">
            <a
              href="#games"
              className="btn-warm inline-flex items-center gap-2 px-8 py-4 text-base"
            >
              <Gamepad2 className="h-4 w-4" />
              开始游戏
            </a>
          </div>
        </div>

        <div className="divider-warm absolute bottom-0 left-0 right-0" />
      </section>

      {/* ===== 游戏展示区（暖色背景 + 漂浮装饰） ===== */}
      <section id="games" className="hero-warm hero-warm-glow relative overflow-hidden py-16">
        <div className="divider-warm absolute left-0 right-0 top-0" />

        {/* 装饰性漂浮元素 */}
        <div className="pointer-events-none absolute inset-0">
          <Heart className="absolute left-[8%] top-[15%] h-4 w-4 animate-float text-warm-pink/20" />
          <Star className="absolute right-[12%] top-[20%] h-5 w-5 animate-float-delayed text-warm-amber/15" />
          <Gamepad2 className="absolute left-[15%] bottom-[20%] h-5 w-5 animate-float-slow text-warm-peach/15" />
          <Dice1 className="absolute right-[8%] bottom-[25%] h-4 w-4 animate-float text-warm-coral/12" />
          <Sparkles className="absolute left-[50%] bottom-[10%] h-3 w-3 animate-float-delayed text-warm-amber/15" />
        </div>

        {/* 暖色光晕 */}
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-warm-peach/6 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-warm-pink/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          {/* 区域标题 */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-warm-peach" />
              <span className="text-xs font-bold uppercase tracking-widest text-warm-peach">
                Games
              </span>
              <Gamepad2 className="h-4 w-4 text-warm-peach" />
            </div>
            <h2 className="mb-4 font-zcool text-4xl text-warm-dark">游戏大厅</h2>
            <p className="mx-auto max-w-2xl text-center text-base leading-relaxed text-warm-text">
              精选经典小游戏，随时随地，想玩就玩 🎯
            </p>
          </div>

          {/* 游戏卡片网格（收窄最大宽度） */}
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {tools.map((tool, index) => (
              <div
                key={tool.href}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <ToolCard {...tool} />
              </div>
            ))}
          </div>

          {/* 更多游戏提示 */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-warm-border/60 bg-white/60 px-6 py-3 text-warm-text backdrop-blur-sm">
              <Sparkles className="h-4 w-4 animate-pulse text-warm-amber" />
              <span className="text-base font-semibold">更多游戏正在开发中...</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 底部游戏缩略图滚动条 ===== */}
      <GameMarquee />
    </main>
  );
}
