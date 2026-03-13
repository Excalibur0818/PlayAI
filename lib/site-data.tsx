import type { ReactNode } from "react";
import { Cat, Target } from "lucide-react";

export const tools: Array<{
  href: string;
  title: string;
  description: string;
  badge: string;
  gradient: string;
  icon: ReactNode;
}> = [
  {
    href: "/catch-the-cat",
    title: "围住小猫",
    description: "经典策略小游戏。在棋盘上放置障碍物，把小猫困在正中央。",
    badge: "游戏",
    gradient: "from-amber-500 to-orange-700",
    icon: <Cat className="h-9 w-9 text-white" />,
  },
  {
    href: "/gomoku",
    title: "五子棋",
    description: "经典策略对弈游戏。支持人机三种难度与双人对战，先连五子者胜。",
    badge: "游戏",
    gradient: "from-indigo-600 to-indigo-800",
    icon: <Target className="h-9 w-9 text-white" />,
  },
];