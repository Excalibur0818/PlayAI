import { Sparkles } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { tools } from "@/lib/site-data";

export default function HomePage() {
  return (
    <main>
      <section id="home" className="hero-gradient hero-glow relative flex min-h-[70vh] items-center justify-center overflow-hidden pt-10">
        <div className="absolute left-10 top-1/4 h-64 w-64 rounded-full bg-apple-blue/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-10 h-80 w-80 rounded-full bg-apple-blue/3 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="mb-10 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-gray-100 bg-white/80 px-5 py-2.5 shadow-sm backdrop-blur-sm">
            <span className="pulse-dot h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-apple-text">经典游戏合集 · 休闲娱乐</span>
          </div>

          <h1 className="mb-8 animate-fade-in-up text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
            <span className="text-apple-dark">Play</span>
            <span className="bg-gradient-to-r from-apple-blue to-blue-600 bg-clip-text text-transparent">AI</span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl animate-fade-in-up text-lg leading-relaxed text-apple-text md:text-xl">
            围住小猫、五子棋等经典游戏，在浏览器中尽情畅玩。
          </p>

          <div className="mb-16 flex flex-wrap justify-center gap-4 animate-fade-in-up">
            <a href="#tools" className="btn-apple rounded-full bg-apple-dark px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-apple-dark/20 hover:shadow-2xl hover:shadow-apple-dark/30">
              <Sparkles className="mr-2 inline-block h-4 w-4" /> 探索游戏
            </a>
          </div>

          <div className="mx-auto grid max-w-lg grid-cols-3 gap-6 animate-fade-in-up">
            <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
              <p className="bg-gradient-to-br from-apple-dark to-[#434344] bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">2</p>
              <p className="mt-1 text-sm text-apple-text">经典游戏</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
              <p className="bg-gradient-to-br from-apple-dark to-[#434344] bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">100%</p>
              <p className="mt-1 text-sm text-apple-text">免费使用</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
              <p className="bg-gradient-to-br from-apple-dark to-[#434344] bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">本地</p>
              <p className="mt-1 text-sm text-apple-text">隐私保护</p>
            </div>
          </div>
        </div>

        <div className="decorative-line absolute bottom-0 left-0 right-0" />
      </section>

      <section id="tools" className="relative bg-white py-20">
        <div className="decorative-line absolute left-0 right-0 top-0" />
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-apple-blue/3 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-apple-blue/2 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-apple-blue">Games</span>
            <h2 className="mb-4 text-4xl font-semibold">经典游戏</h2>
            <p className="mx-auto max-w-2xl text-center leading-relaxed text-apple-text">
              围住小猫、五子棋，经典游戏，在浏览器中尽情畅玩。
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.href} {...tool} />
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-gray-50 px-6 py-3 text-apple-text">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-medium">更多游戏正在开发中...</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}