"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Check, Copy, Eye, EyeOff, Languages, LoaderCircle, Settings2 } from "lucide-react";

import { md5, toUtf8Bytes } from "@/lib/md5";

type TranslationResult = {
  source: string;
  translated: string;
};

const LOCAL_STORAGE_KEYS = {
  appid: "playai_baidu_appid",
  key: "playai_baidu_key",
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "英语 (English)" },
  { value: "ja", label: "日语 (日本語)" },
  { value: "ko", label: "韩语 (한국어)" },
  { value: "fr", label: "法语 (Français)" },
  { value: "de", label: "德语 (Deutsch)" },
  { value: "ru", label: "俄语 (Русский)" },
  { value: "es", label: "西班牙语 (Español)" },
  { value: "pt", label: "葡萄牙语 (Português)" },
  { value: "it", label: "意大利语 (Italiano)" },
  { value: "ar", label: "阿拉伯语 (العربية)" },
  { value: "vi", label: "越南语 (Tiếng Việt)" },
  { value: "th", label: "泰语 (ไทย)" },
  { value: "zh", label: "中文 (简体)" },
];

function buildSalt() {
  return Math.random().toString(36).slice(2, 12);
}

async function translateLine(text: string, targetLang: string, appid: string, key: string) {
  const salt = buildSalt();
  const sign = md5(toUtf8Bytes(`${appid}${text}${salt}${key}`));

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: encodeURIComponent(text),
      from: "auto",
      to: targetLang,
      appid,
      salt,
      sign,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || "翻译失败");
  }

  return data.trans_result?.[0]?.dst ?? "";
}

export function TranslateClient() {
  const [appid, setAppid] = useState("");
  const [key, setKey] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    setAppid(window.localStorage.getItem(LOCAL_STORAGE_KEYS.appid) ?? "");
    setKey(window.localStorage.getItem(LOCAL_STORAGE_KEYS.key) ?? "");
  }, []);

  async function handleTranslate() {
    if (!appid.trim()) {
      setError("请输入百度翻译 AppID");
      return;
    }

    if (!key.trim()) {
      setError("请输入百度翻译 Key");
      return;
    }

    if (!sourceText.trim()) {
      setError("请输入要翻译的文本");
      return;
    }

    const lines = sourceText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setError("请输入有效的翻译文本");
      return;
    }

    setError("");
    setLoading(true);
    setResults([]);

    window.localStorage.setItem(LOCAL_STORAGE_KEYS.appid, appid.trim());
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.key, key.trim());

    try {
      const translatedResults = await Promise.all(
        lines.map(async (line) => ({
          source: line,
          translated: await translateLine(line, targetLang, appid.trim(), key.trim()),
        })),
      );

      setResults(translatedResults);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "翻译失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <main className="hero-gradient hero-glow min-h-screen bg-texture px-4 pb-16 pt-28">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-apple-gray px-5 py-2.5 shadow-sm">
            <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-apple-dark">百度翻译 API</span>
          </div>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl">在线翻译</h1>
          <p className="text-apple-text">支持多行文本批量翻译，实时显示结果，一键复制</p>
        </header>

        <section className="card-hover mb-6 rounded-3xl border border-gray-100/50 bg-white p-7 shadow-lg shadow-gray-200/50 animate-fade-in-up">
          <h2 className="mb-5 flex items-center gap-3 font-semibold text-apple-dark">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-apple-gray">
              <Settings2 className="h-4 w-4 text-apple-text" />
            </span>
            API 配置
          </h2>

          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-apple-text">百度翻译 AppID</label>
            <input
              type="text"
              value={appid}
              onChange={(event) => setAppid(event.target.value)}
              placeholder="请输入百度翻译 AppID"
              className="w-full rounded-2xl border border-gray-200/80 bg-apple-gray/30 px-5 py-3.5 text-apple-dark transition-all duration-300 focus:border-apple-blue focus:bg-white focus:outline-none"
            />
          </div>

          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-apple-text">百度翻译 Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder="请输入百度翻译 Key"
                className="w-full rounded-2xl border border-gray-200/80 bg-apple-gray/30 px-5 py-3.5 pr-12 text-apple-dark transition-all duration-300 focus:border-apple-blue focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-text transition-colors hover:text-apple-dark"
                aria-label={showKey ? "隐藏 Key" : "显示 Key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 text-xs text-apple-text">API 配置仅保存在本地浏览器中，不会上传到服务器</p>
          </div>

          <div className="rounded-2xl border border-gray-200/50 bg-apple-gray p-5">
            <p className="text-sm text-apple-text">
              如何获取 API？访问
              <a href="https://api.fanyi.baidu.com/" target="_blank" rel="noreferrer" className="ml-1 font-medium text-apple-blue hover:underline">
                百度翻译开放平台
              </a>
              注册并创建应用获取 AppID 和 Key。
            </p>
          </div>
        </section>

        <section className="card-hover mb-6 rounded-3xl border border-gray-100/50 bg-white p-7 shadow-lg shadow-gray-200/50 animate-fade-in-up">
          <h2 className="mb-5 flex items-center gap-3 font-semibold text-apple-dark">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-apple-gray">
              <Languages className="h-4 w-4 text-apple-text" />
            </span>
            翻译内容
          </h2>

          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-apple-text">输入要翻译的文本（每行一条）</label>
            <textarea
              rows={6}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder={"请输入要翻译的文本，每行一条\n例如：\n你好\n世界\nHello World"}
              className="w-full resize-none rounded-2xl border border-gray-200/80 bg-apple-gray/30 px-5 py-4 text-apple-dark transition-all duration-300 focus:border-apple-blue focus:bg-white focus:outline-none"
            />
            <p className="mt-3 text-xs text-apple-text">支持批量翻译，每行文本将单独翻译</p>
          </div>

          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-apple-text">目标语言</label>
            <div className="relative">
              <select
                value={targetLang}
                onChange={(event) => setTargetLang(event.target.value)}
                className="w-full cursor-pointer appearance-none rounded-2xl border border-gray-200/80 bg-white px-5 py-3.5 text-apple-dark transition-all duration-300 focus:border-apple-blue focus:outline-none"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ArrowRightLeft className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-apple-text" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleTranslate()}
            disabled={loading}
            className="btn-apple w-full rounded-2xl bg-apple-dark px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-apple-dark/20 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="inline-flex items-center gap-2">
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Languages className="h-5 w-5" />}
              {loading ? "翻译中..." : "开始翻译"}
            </span>
          </button>
        </section>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {results.length > 0 ? (
          <section className="animate-fade-in-up">
            <h3 className="mb-5 flex items-center gap-3 font-semibold text-apple-dark">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-apple-gray">
                <ArrowRightLeft className="h-4 w-4 text-apple-text" />
              </span>
              翻译结果
            </h3>
            <div className="space-y-4">
              {results.map((result, index) => (
                <article key={`${result.source}-${index}`} className="card-hover rounded-2xl border border-gray-100/50 bg-white p-5 shadow-lg shadow-gray-200/40">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="mb-2 text-xs font-medium text-apple-text">原文</div>
                      <div className="mb-4 text-sm leading-relaxed text-apple-dark">{result.source}</div>
                      <div className="mb-2 text-xs font-medium text-apple-text">译文</div>
                      <div className="leading-relaxed text-apple-dark">{result.translated}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopy(result.translated, index)}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-apple-gray text-apple-text transition-all duration-300 hover:bg-blue-50 hover:text-apple-blue"
                      title="复制译文"
                    >
                      {copiedIndex === index ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setResults([]);
                  setSourceText("");
                  setError("");
                }}
                className="btn-apple w-full rounded-2xl border border-gray-200/50 bg-apple-gray px-6 py-3.5 font-medium text-apple-dark hover:bg-gray-200"
              >
                清空结果
              </button>
            </div>
          </section>
        ) : null}

        <div className="mt-10 text-center text-sm text-apple-text">
          <p>支持多种语言互译，每行文本单独翻译</p>
        </div>
      </div>
    </main>
  );
}
