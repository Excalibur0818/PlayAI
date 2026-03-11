import { Brain, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { featureCards, tools } from "@/lib/site-data";

export default function HomePage() {
  return (
    <main>
      <section id="home" className="hero-gradient hero-glow relative flex min-h-[70vh] items-center justify-center overflow-hidden pt-10">
        <div className="absolute left-10 top-1/4 h-64 w-64 rounded-full bg-apple-blue/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-10 h-80 w-80 rounded-full bg-apple-blue/3 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="mb-10 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-gray-100 bg-white/80 px-5 py-2.5 shadow-sm backdrop-blur-sm">
            <span className="pulse-dot h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-apple-text">AI 驱动 · 智能工具</span>
          </div>

          <h1 className="mb-8 animate-fade-in-up text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
            <span className="text-apple-dark">Play</span>
            <span className="bg-gradient-to-r from-apple-blue to-blue-600 bg-clip-text text-transparent">AI</span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl animate-fade-in-up text-lg leading-relaxed text-apple-text md:text-xl">
            由 AI 精心打造的实用在线工具集合，为日常工作提供智能化解决方案。
          </p>

          <div className="mb-16 flex flex-wrap justify-center gap-4 animate-fade-in-up">
            <a href="#tools" className="btn-apple rounded-full bg-apple-dark px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-apple-dark/20 hover:shadow-2xl hover:shadow-apple-dark/30">
              <Sparkles className="mr-2 inline-block h-4 w-4" /> 探索工具
            </a>
            <a href="#features" className="btn-apple rounded-full border border-gray-200 bg-white px-8 py-4 text-sm font-semibold text-apple-dark shadow-lg hover:border-gray-300">
              了解更多
            </a>
          </div>

          <div className="mx-auto grid max-w-lg grid-cols-3 gap-6 animate-fade-in-up">
            <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
              <p className="bg-gradient-to-br from-apple-dark to-[#434344] bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">4</p>
              <p className="mt-1 text-sm text-apple-text">AI 工具</p>
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
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-apple-blue">AI Tools</span>
            <h2 className="mb-4 text-4xl font-semibold">AI 工具</h2>
            <p className="mx-auto max-w-2xl text-center leading-relaxed text-apple-text">
              由 AI 精心打造的智能工具集，更多 AI 工具正在开发中，敬请期待。
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
              <span className="text-sm font-medium">更多工具正在开发中...</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-apple-gray py-24">
        <div className="decorative-line absolute left-0 right-0 top-0" />
        <div className="bg-texture absolute inset-0 opacity-50" />

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-apple-blue">Why Choose Us</span>
            <h2 className="text-3xl font-semibold md:text-4xl">核心优势</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {featureCards.map((feature) => (
              <div key={feature.title} className="group rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-gray-100/50">
                <div className="relative mb-6">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.panel} transition-transform duration-500 group-hover:scale-110`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p className="leading-relaxed text-apple-text">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-4 rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl shadow-gray-200/40 backdrop-blur md:grid-cols-3">
            <div className="flex items-start gap-4 rounded-3xl bg-white/70 p-5">
              <Brain className="mt-1 h-5 w-5 text-apple-blue" />
              <div>
                <p className="font-semibold">适合继续扩展</p>
                <p className="mt-1 text-sm text-apple-text">App Router、共享组件和 API route 已经成为后续新增工具的统一入口。</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-3xl bg-white/70 p-5">
              <ShieldCheck className="mt-1 h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-semibold">保留现有视觉</p>
                <p className="mt-1 text-sm text-apple-text">首轮优先迁移主题、卡片、导航、背景和按钮手感，避免样式漂移。</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-3xl bg-white/70 p-5">
              <Zap className="mt-1 h-5 w-5 text-violet-600" />
              <div>
                <p className="font-semibold">减少遗留耦合</p>
                <p className="mt-1 text-sm text-apple-text">知识库链接已从新站主流程剥离，避免 docs 影响框架迁移节奏。</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}