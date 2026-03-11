"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Rss, Sparkles, X } from "lucide-react";

type SourceKey = "jiqizhixin" | "openai" | "googleai" | "infoq";

type RssItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tag: string;
  tagClass: string;
  time: string;
  image: string;
  source: string;
  link: string;
  pubDate: string;
};

type ToastState = {
  type: "success" | "warning" | "error";
  message: string;
} | null;

const RSS_SOURCES: Record<SourceKey, { name: string; url: string; category: string }> = {
  jiqizhixin: {
    name: "机器之心",
    url: "https://www.jiqizhixin.com/rss",
    category: "tech",
  },
  openai: {
    name: "OpenAI",
    url: "https://openai.com/blog/rss.xml",
    category: "tech",
  },
  googleai: {
    name: "Google AI",
    url: "https://blog.google/technology/ai/rss/",
    category: "tech",
  },
  infoq: {
    name: "InfoQ",
    url: "https://www.infoq.cn/feed",
    category: "tech",
  },
};

const SOURCE_META: Array<{ key: SourceKey; label: string; icon: string }> = [
  { key: "jiqizhixin", label: "机器之心", icon: "微" },
  { key: "openai", label: "OpenAI", icon: "O" },
  { key: "googleai", label: "Google AI", icon: "G" },
  { key: "infoq", label: "InfoQ", icon: "I" },
];

function getDefaultImage(source: string) {
  const defaults: Record<string, string> = {
    机器之心: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    OpenAI: "https://images.unsplash.com/photo-1676299081847-824916de030a?w=800&q=80",
    "Google AI": "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80",
    InfoQ: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
  };

  return defaults[source] ?? defaults["机器之心"];
}

function extractSummary(content: string, maxLength = 80) {
  if (!content) return "暂无摘要";
  const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function extractPlainText(content: string) {
  if (!content) return "暂无内容";
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getRelativeTime(pubDate: string) {
  const date = new Date(pubDate);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (Number.isNaN(date.getTime())) return "未知时间";
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString("zh-CN");
}

async function fetchRSS(sourceKey: SourceKey) {
  const source = RSS_SOURCES[sourceKey];
  const apiUrl = `/api/rss-proxy?url=${encodeURIComponent(source.url)}&count=10`;
  const response = await fetch(apiUrl, { cache: "no-store" });
  const data = await response.json();

  if (!response.ok || data.status !== "ok") {
    throw new Error(data.message || `获取 ${source.name} 失败`);
  }

  const items: RssItem[] = data.items.map((item: Record<string, string>, index: number) => ({
    id: `${sourceKey}-${index}`,
    title: item.title,
    summary: extractSummary(item.description || item.content || ""),
    content: extractPlainText(item.content || item.description || "暂无内容"),
    category: source.category,
    tag: index < 3 ? "热门" : "最新",
    tagClass: index < 3 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600",
    time: getRelativeTime(item.pubDate),
    image: item.thumbnail || getDefaultImage(source.name),
    source: source.name,
    link: item.link,
    pubDate: item.pubDate,
  }));

  return { name: source.name, items };
}

export function AiNewsClient() {
  const [selectedSources, setSelectedSources] = useState<Record<SourceKey, boolean>>({
    jiqizhixin: true,
    openai: true,
    googleai: true,
    infoq: true,
  });
  const [newsData, setNewsData] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [activeNews, setActiveNews] = useState<RssItem | null>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveNews(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function fetchAllNews() {
    const enabledSources = Object.entries(selectedSources)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key as SourceKey);

    if (enabledSources.length === 0) {
      setNewsData([]);
      setToast({ type: "warning", message: "请至少选择一个资讯源" });
      return;
    }

    setLoading(true);
    setNewsData([]);

    try {
      const results = await Promise.allSettled(enabledSources.map((sourceKey) => fetchRSS(sourceKey)));
      let failedCount = 0;
      const mergedItems: RssItem[] = [];

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          mergedItems.push(...result.value.items);
        } else {
          failedCount += 1;
        }
      });

      const sortedItems = mergedItems
        .sort((left, right) => new Date(right.pubDate).getTime() - new Date(left.pubDate).getTime())
        .slice(0, 30);

      setNewsData(sortedItems);

      if (failedCount === 0) {
        setToast({ type: "success", message: `共获取 ${sortedItems.length} 条资讯` });
      } else {
        setToast({ type: "warning", message: `获取 ${sortedItems.length} 条资讯，${failedCount} 个源失败` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "请稍后重试";
      setToast({ type: "error", message: `获取资讯失败: ${message}` });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAllNews();
  }, [selectedSources]);

  const toastIcon = toast?.type === "success" ? "text-green-500" : toast?.type === "warning" ? "text-yellow-500" : "text-red-500";

  return (
    <main className="hero-gradient hero-glow min-h-screen bg-texture px-4 pb-16 pt-28">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white/60 px-5 py-2.5 shadow-sm backdrop-blur-sm">
            <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-apple-text">每日 AI 资讯</span>
          </div>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl">AI 早报</h1>
          <p className="mx-auto max-w-xl text-apple-text">每日 AI 领域最新动态、技术突破、产品发布，一站式获取前沿资讯。</p>
        </header>

        <section className="mb-8 rounded-3xl border border-gray-100/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm md:p-8 animate-fade-in-up">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-apple-gray">
                <Rss className="h-5 w-5 text-apple-text" />
              </div>
              <div>
                <div className="text-lg font-semibold">选择资讯源</div>
                <p className="text-xs text-apple-text">勾选想要查看的来源</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void fetchAllNews()}
              disabled={loading}
              className="btn-apple rounded-full bg-apple-dark px-5 py-2.5 text-sm font-medium text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                刷新资讯
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {SOURCE_META.map((source) => {
              const selected = selectedSources[source.key];
              return (
                <label key={source.key} className="cursor-pointer">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selected}
                    onChange={(event) => {
                      setSelectedSources((current) => ({
                        ...current,
                        [source.key]: event.target.checked,
                      }));
                    }}
                  />
                  <span
                    className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                      selected ? "border-apple-dark bg-apple-dark text-white" : "border-transparent bg-apple-gray text-apple-dark"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-xs">{source.icon}</span>
                    {source.label}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {toast ? (
          <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2">
            <div className="animate-fade-in-up rounded-2xl border border-gray-100 bg-white/90 px-6 py-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Sparkles className={`h-5 w-5 ${toastIcon}`} />
                <div className="text-sm font-medium text-apple-dark">{toast.message}</div>
                <button type="button" onClick={() => setToast(null)} className="ml-2 text-apple-text transition-colors hover:text-apple-dark">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="mb-8">
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex gap-3">
                <span className="h-3 w-3 animate-bounce rounded-full bg-apple-blue" />
                <span className="h-3 w-3 animate-bounce rounded-full bg-apple-blue" style={{ animationDelay: "0.1s" }} />
                <span className="h-3 w-3 animate-bounce rounded-full bg-apple-blue" style={{ animationDelay: "0.2s" }} />
              </div>
              <span className="text-sm text-apple-text">正在获取最新资讯...</span>
            </div>
          </div>
        ) : null}

        {newsData.length === 0 && !loading ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-12 text-center shadow-lg">
            <div className="mb-2 text-apple-dark">暂无资讯</div>
            <button type="button" onClick={() => void fetchAllNews()} className="font-medium text-apple-blue hover:underline">
              点击刷新
            </button>
          </div>
        ) : null}

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {newsData.map((news, index) => (
            <article
              key={news.id}
              className="card-hover animate-fade-in-up cursor-pointer overflow-hidden rounded-3xl border border-gray-100/50 bg-white shadow-sm"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setActiveNews(news)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={news.image}
                  alt={news.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                  onError={(event) => {
                    event.currentTarget.src = getDefaultImage(news.source);
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute left-4 top-4">
                  <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${news.tagClass}`}>{news.tag}</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-xs font-medium text-white/90">{news.source}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="line-clamp-2 mb-2 font-semibold text-apple-dark transition-colors hover:text-apple-blue">{news.title}</h3>
                <p className="line-clamp-2 mb-3 text-sm text-apple-text">{news.summary}</p>
                <div className="flex items-center justify-between text-xs text-apple-text/60">
                  <span>{news.time}</span>
                  <span className="text-apple-blue">查看详情</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {activeNews ? (
        <div className="fixed inset-0 z-[100]">
          <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActiveNews(null)} aria-label="关闭详情" />
          <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="sticky top-4 z-50 flex justify-end pr-4 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveNews(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-apple-text shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-apple-dark"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative -mt-10">
                <div className="h-64 overflow-hidden rounded-t-3xl">
                  <img src={activeNews.image} alt={activeNews.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-8">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${activeNews.tagClass}`}>{activeNews.tag}</span>
                    <span className="text-sm text-apple-text">{activeNews.time}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm font-medium text-apple-blue">{activeNews.source}</span>
                  </div>
                  <h2 className="mb-4 text-2xl font-semibold text-apple-dark">{activeNews.title}</h2>
                  <div className="mb-6 whitespace-pre-line leading-relaxed text-apple-text">{activeNews.content}</div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={activeNews.link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-apple rounded-full bg-apple-dark px-5 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-gray-800"
                    >
                      查看原文
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveNews(null)}
                      className="rounded-full bg-apple-gray px-5 py-2.5 text-sm font-medium text-apple-text transition-all hover:bg-gray-200"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
