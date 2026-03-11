import Link from "next/link";
import { AlertTriangle, ArrowLeft, Clock3, RefreshCcw } from "lucide-react";

type ErrorInfoPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    context?: string;
    time?: string;
  }>;
};

export default async function ErrorInfoPage({ searchParams }: ErrorInfoPageProps) {
  const params = await searchParams;
  const error = params.error ?? "未知错误";
  const message = params.message ?? "未提供详细错误信息。";
  const context = params.context ?? "无";
  const time = params.time ?? new Date().toISOString();

  return (
    <main className="hero-gradient hero-glow min-h-screen px-4 pb-16 pt-28">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
            <AlertTriangle className="h-4 w-4" /> 系统提示
          </div>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight">发生了一点问题</h1>
          <p className="text-apple-text">迁移到 Next.js 后，错误信息会统一聚合到这个页面，便于后续排查和监控。</p>
        </div>

        <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-apple-text">错误类型</p>
              <h2 className="text-2xl font-semibold">{error}</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-apple-gray/70 p-5">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-apple-text">Message</p>
              <p className="leading-relaxed text-apple-dark">{message}</p>
            </div>
            <div className="rounded-3xl bg-apple-gray/70 p-5">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-apple-text">Context</p>
              <p className="leading-relaxed text-apple-dark">{context}</p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-apple-gray/70 p-5">
            <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-apple-text">
              <Clock3 className="h-4 w-4" /> Time
            </p>
            <p className="text-apple-dark">{time}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="btn-apple inline-flex items-center justify-center rounded-full bg-apple-dark px-6 py-3 text-sm font-semibold text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回首页
            </Link>
            <Link href="/error" className="btn-apple inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-apple-dark">
              <RefreshCcw className="mr-2 h-4 w-4" /> 刷新页面状态
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}