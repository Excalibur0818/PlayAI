"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  Flame,
  LoaderCircle,
  Moon,
  RefreshCw,
  Settings2,
  Sparkles,
  Sun,
} from "lucide-react";

type ProviderKey = "minimax" | "deepseek" | "glm";
type SoupType = "clear" | "red" | "black";
type Difficulty = "easy" | "medium" | "hard";

type SoupResult = {
  question: string;
  answer: string;
  hint: string;
};

type ExportPayload = {
  id: string;
  title: string;
  type: SoupType;
  typeName: string;
  difficulty: Difficulty;
  difficultyName: string;
  provider: ProviderKey;
  providerName: string;
  createdAt: string;
  version: string;
  content: SoupResult;
};

const PROVIDERS: Array<{ key: ProviderKey; name: string; link: string }> = [
  { key: "minimax", name: "MiniMax-M2.1", link: "https://platform.minimaxi.com" },
  { key: "deepseek", name: "DeepSeek-3.2", link: "https://platform.deepseek.com" },
  { key: "glm", name: "GLM-5", link: "https://open.bigmodel.cn" },
];

const PROVIDER_STORAGE_KEYS: Record<ProviderKey, string[]> = {
  minimax: ["minimax_api_key"],
  deepseek: ["deepseek_api_key", "playai_deepseek_key"],
  glm: ["glm_api_key"],
};

const SOUP_LABELS: Record<SoupType, { text: string; desc: string; className: string }> = {
  clear: { text: "清汤", desc: "温馨治愈", className: "bg-green-100 text-green-700 border border-green-200" },
  red: { text: "红汤", desc: "悬疑刺激", className: "bg-red-100 text-red-700 border border-red-200" },
  black: { text: "黑汤", desc: "恐怖黑暗", className: "bg-gray-800 text-white border border-gray-700" },
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const PROVIDER_NAMES: Record<ProviderKey, string> = {
  minimax: "MiniMax-M2.1",
  deepseek: "DeepSeek-3.2",
  glm: "GLM-5",
};

function buildPrompt(soupType: SoupType, difficulty: Difficulty) {
  const soupDescriptions = {
    clear: "温馨治愈风格，故事温暖人心，正能量结局",
    red: "悬疑刺激风格，故事紧张烧脑，反转结局",
    black: "恐怖黑暗风格，故事令人不安，细思极恐",
  };

  const difficultyDescriptions = {
    easy: "简单难度，线索较多，容易猜到答案",
    medium: "中等难度，需要仔细思考",
    hard: "困难难度，线索很少，需要深入推理",
  };

  return `你是一个海龟汤（推理游戏）题目生成专家。请根据以下要求生成一道海龟汤题目。

要求：
- 风格：${soupDescriptions[soupType]}
- 难度：${difficultyDescriptions[difficulty]}
- 必须包含：题目（场景描述）、答案（完整故事）、提示（一步步引导）

请按以下JSON格式输出：
{
  "question": "题目内容（一个场景描述，50-100字）",
  "answer": "答案内容（完整的故事背景和原因，100-200字）",
  "hint": "提示内容（一步步引导玩家思考，50-100字）"
}

请直接输出JSON，不要有其他内容。`;
}

function extractJsonContent(rawText: string) {
  const blockMatch = rawText.match(/```json\n?([\s\S]*?)```/) || rawText.match(/```\n?([\s\S]*?)```/);
  const jsonText = (blockMatch?.[1] ?? rawText).trim();
  return JSON.parse(jsonText) as SoupResult;
}

function generateId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function downloadJson(payload: ExportPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `turtle-soup-${payload.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function TurtleSoupClient() {
  const [provider, setProvider] = useState<ProviderKey>("deepseek");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [soupType, setSoupType] = useState<SoupType>("clear");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoupResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [exportPayload, setExportPayload] = useState<ExportPayload | null>(null);

  useEffect(() => {
    const keys = PROVIDER_STORAGE_KEYS[provider];
    const savedValue = keys.map((key) => window.localStorage.getItem(key)).find(Boolean) ?? "";
    setApiKey(savedValue);
  }, [provider]);

  async function handleGenerate() {
    if (!apiKey.trim()) {
      setError(`请输入 ${PROVIDER_NAMES[provider]} API Key`);
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);
    setShowAnswer(false);
    setShowHint(false);

    PROVIDER_STORAGE_KEYS[provider].forEach((storageKey) => {
      window.localStorage.setItem(storageKey, apiKey.trim());
    });

    try {
      const response = await fetch("/api/turtle-soup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          prompt: buildPrompt(soupType, difficulty),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "生成失败");
      }

      const parsed = extractJsonContent(data.content as string);
      const nextPayload: ExportPayload = {
        id: generateId(),
        title: `海龟汤谜题 - ${SOUP_LABELS[soupType].text}`,
        type: soupType,
        typeName: SOUP_LABELS[soupType].text,
        difficulty,
        difficultyName: DIFFICULTY_LABELS[difficulty],
        provider,
        providerName: PROVIDER_NAMES[provider],
        createdAt: new Date().toISOString(),
        version: "2.0",
        content: parsed,
      };

      setResult(parsed);
      setExportPayload(nextPayload);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "生成失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyQuestion() {
    if (!result?.question) return;
    await navigator.clipboard.writeText(result.question);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const providerLink = PROVIDERS.find((item) => item.key === provider)?.link ?? "#";

  return (
    <main className="hero-gradient min-h-screen bg-texture px-4 pb-16 pt-28">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700">AI 驱动</span>
          </div>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-apple-text md:text-5xl">海龟汤生成器</h1>
          <p className="mx-auto max-w-md text-lg text-apple-subtext">AI 驱动的逻辑推理谜题生成器。清汤、红汤、黑汤，多模型一键生成。</p>
        </header>

        <section className="card-hover mb-8 rounded-3xl border border-gray-100/50 bg-white p-8 shadow-lg animate-fade-in-up">
          <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold text-apple-text">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-apple-gray">
              <Settings2 className="h-4 w-4 text-apple-subtext" />
            </span>
            设置
          </h2>

          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-apple-subtext">AI 模型提供商</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PROVIDERS.map((item) => {
                const selected = item.key === provider;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setProvider(item.key)}
                    className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                      selected ? "border-apple-dark bg-apple-dark text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="mb-2 text-sm font-semibold">{item.name}</div>
                    <div className={`text-xs ${selected ? "text-white/75" : "text-apple-subtext"}`}>站内代理转发，减少跨域和浏览器兼容问题</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-apple-subtext">{PROVIDER_NAMES[provider]} API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={`请输入 ${PROVIDER_NAMES[provider]} API Key`}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-apple-text transition-all focus:border-apple-blue focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-apple-dark"
                aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 text-xs text-apple-subtext">API Key 仅保存在本地浏览器中，不会写入服务器。获取地址：
              <a href={providerLink} target="_blank" rel="noreferrer" className="ml-1 font-medium text-apple-blue hover:underline">
                {providerLink}
              </a>
            </p>
          </div>

          <div className="mb-8">
            <label className="mb-4 block text-sm font-medium text-apple-subtext">选择汤类型</label>
            <div className="grid grid-cols-3 gap-4">
              {([
                { key: "clear", icon: Sun, accent: "text-green-500", active: "border-green-200 bg-green-50 text-green-700", inactive: "border-gray-200 bg-white text-gray-600 hover:border-green-300" },
                { key: "red", icon: Flame, accent: "text-red-400", active: "border-red-200 bg-red-50 text-red-700", inactive: "border-gray-200 bg-white text-gray-600 hover:border-red-300" },
                { key: "black", icon: Moon, accent: "text-gray-600", active: "border-gray-400 bg-gray-100 text-gray-800", inactive: "border-gray-200 bg-white text-gray-600 hover:border-gray-400" },
              ] as const).map((item) => {
                const Icon = item.icon;
                const selected = soupType === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSoupType(item.key)}
                    className={`rounded-2xl border-2 px-5 py-5 text-center transition-all ${selected ? item.active : item.inactive}`}
                  >
                    <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${selected ? "bg-white" : "bg-gray-50"}`}>
                      <Icon className={`h-5 w-5 ${item.accent}`} />
                    </div>
                    <div className="font-semibold">{SOUP_LABELS[item.key].text}</div>
                    <div className="mt-1 text-xs opacity-70">{SOUP_LABELS[item.key].desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-4 block text-sm font-medium text-apple-subtext">选择难度</label>
            <div className="flex gap-4">
              {([
                { key: "easy", label: "简单", icon: Sparkles, active: "border-green-200 bg-green-50 text-green-700", inactive: "border-gray-200 bg-white text-gray-600 hover:border-green-300" },
                { key: "medium", label: "中等", icon: RefreshCw, active: "border-yellow-200 bg-yellow-50 text-yellow-700", inactive: "border-gray-200 bg-white text-gray-600 hover:border-yellow-300" },
                { key: "hard", label: "困难", icon: Brain, active: "border-gray-300 bg-gray-100 text-gray-800", inactive: "border-gray-200 bg-white text-gray-600 hover:border-gray-400" },
              ] as const).map((item) => {
                const Icon = item.icon;
                const selected = difficulty === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setDifficulty(item.key)}
                    className={`flex-1 rounded-2xl border-2 px-5 py-3 text-center font-semibold transition-all ${selected ? item.active : item.inactive}`}
                  >
                    <Icon className="mr-2 inline h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={loading}
            className="btn-apple w-full rounded-2xl bg-apple-dark px-8 py-5 text-lg font-semibold text-white shadow-lg hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="inline-flex items-center gap-2">
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {loading ? "AI 正在创作中..." : "生成海龟汤"}
            </span>
          </button>
        </section>

        {error ? <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div> : null}

        {result ? (
          <section className="animate-fade-in-up">
            <div className="result-card mb-8 rounded-3xl border border-gray-100/50 bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center justify-between gap-4">
                <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${SOUP_LABELS[soupType].className}`}>{SOUP_LABELS[soupType].text}</span>
                <button
                  type="button"
                  onClick={() => void handleCopyQuestion()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-apple-subtext transition-all hover:bg-gray-100 hover:text-apple-dark"
                  aria-label="复制题目"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <h3 className="mb-5 flex items-center gap-3 text-xl font-semibold text-apple-text">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-apple-gray">
                  <Sparkles className="h-4 w-4 text-apple-subtext" />
                </span>
                题目
              </h3>
              <div className="mb-6 rounded-2xl bg-gray-50 p-5 leading-relaxed text-apple-text">{result.question}</div>

              <div className="mt-5 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowAnswer((current) => !current)}
                  className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3 font-semibold text-apple-text">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </span>
                    点击查看答案
                  </span>
                  <ChevronDown className={`h-4 w-4 text-apple-subtext transition-transform ${showAnswer ? "rotate-180" : ""}`} />
                </button>
                {showAnswer ? (
                  <div className="ml-3 mt-4 rounded-2xl bg-green-50 p-5 text-apple-text">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      答案
                    </h4>
                    <div className="leading-relaxed">{result.answer}</div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowHint((current) => !current)}
                  className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3 font-semibold text-apple-text">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                    </span>
                    点击查看提示
                  </span>
                  <ChevronDown className={`h-4 w-4 text-apple-subtext transition-transform ${showHint ? "rotate-180" : ""}`} />
                </button>
                {showHint ? (
                  <div className="ml-3 mt-4 rounded-2xl bg-blue-50 p-5 text-apple-text">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-blue-700">
                      <Sparkles className="h-4 w-4" />
                      提示
                    </h4>
                    <div className="leading-relaxed">{result.hint}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                className="btn-apple flex-1 rounded-2xl bg-apple-dark px-6 py-4 font-semibold text-white shadow-lg hover:bg-gray-800"
              >
                <RefreshCw className="mr-2 inline h-4 w-4" />
                再生成一个
              </button>
              <button
                type="button"
                disabled={!exportPayload}
                onClick={() => exportPayload && downloadJson(exportPayload)}
                className="btn-apple rounded-2xl border border-gray-200 bg-white px-6 py-4 font-semibold text-apple-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="mr-2 inline h-4 w-4" />
                导出 JSON
              </button>
            </div>
          </section>
        ) : null}

        <div className="mt-12 text-center text-sm text-apple-subtext">
          <p className="mb-2 font-medium text-apple-text">什么是海龟汤？</p>
          <p className="mx-auto max-w-md leading-relaxed">海龟汤是一种推理游戏，玩家根据题目中给出的线索，推测出故事的真相。</p>
        </div>
      </div>
    </main>
  );
}
