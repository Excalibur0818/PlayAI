import type { ReactNode } from "react";
import {
  BookOpenText,
  Cat,
  Languages,
  Newspaper,
  UtensilsCrossed,
  Brain,
  Shield,
  Zap,
} from "lucide-react";

export const tools: Array<{
  href: string;
  title: string;
  description: string;
  badge: string;
  gradient: string;
  icon: ReactNode;
}> = [
  {
    href: "/ai-news",
    title: "AI 早报",
    description: "每日 AI 领域最新动态、技术突破、产品发布，一站式获取前沿资讯。",
    badge: "AI",
    gradient: "from-blue-600 to-blue-800",
    icon: <Newspaper className="h-9 w-9 text-white" />,
  },
  {
    href: "/translate",
    title: "在线翻译",
    description: "支持多行文本批量翻译，百度翻译 API 驱动，快速准确。",
    badge: "API",
    gradient: "from-violet-600 to-violet-800",
    icon: <Languages className="h-9 w-9 text-white" />,
  },
  {
    href: "/catch-the-cat",
    title: "围住小猫",
    description: "经典策略小游戏。在棋盘上放置障碍物，把小猫困在正中央。",
    badge: "游戏",
    gradient: "from-amber-500 to-orange-700",
    icon: <Cat className="h-9 w-9 text-white" />,
  },
  {
    href: "/turtle-soup",
    title: "海龟汤",
    description: "AI 驱动的逻辑推理谜题生成器。清汤、红汤、黑汤，多种风格一键生成。",
    badge: "AI",
    gradient: "from-emerald-600 to-emerald-800",
    icon: <UtensilsCrossed className="h-9 w-9 text-white" />,
  },
];

export const featureCards = [
  {
    title: "AI 驱动",
    description: "利用先进的人工智能技术，智能识别和处理各类数据，提供精准的解决方案。",
    icon: <Brain className="h-8 w-8 text-apple-blue" />,
    panel: "from-blue-50 to-blue-100",
  },
  {
    title: "隐私保护",
    description: "所有数据在浏览器本地处理，不上传服务器，严格保护用户隐私安全。",
    icon: <Shield className="h-8 w-8 text-emerald-600" />,
    panel: "from-emerald-50 to-emerald-100",
  },
  {
    title: "快速高效",
    description: "基于现代 Web 技术构建，响应迅速，操作流畅，带来极致的使用体验。",
    icon: <Zap className="h-8 w-8 text-violet-600" />,
    panel: "from-violet-50 to-violet-100",
  },
];

export const migrationNotice = {
  title: "迁移进行中",
  description: "这个工具页正在从原生 HTML 迁移到 Next.js。当前先保留统一的视觉样式和路由结构，交互逻辑将在下一批提交中继续平移。",
  icon: <BookOpenText className="h-8 w-8 text-apple-blue" />,
};