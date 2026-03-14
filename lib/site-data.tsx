import type { ReactNode } from "react";
import { Cat, Target, Gem, Grid3X3, Sparkles } from "lucide-react";

/**
 * 游戏数据类型定义
 */
export type GameItem = {
  href: string;
  title: string;
  description: string;
  badge: string;
  gradient: string;
  icon: ReactNode;
  emoji: string;
};

/**
 * 游戏列表数据 - 包含所有可用游戏的信息
 */
export const tools: GameItem[] = [
  {
    href: "/catch-the-cat",
    title: "围住小猫",
    description: "经典策略小游戏。在棋盘上放置障碍物，把小猫困在正中央。",
    badge: "策略",
    gradient: "from-amber-400 to-orange-500",
    icon: <Cat className="h-9 w-9 text-white" />,
    emoji: "🐱",
  },
  {
    href: "/gomoku",
    title: "五子棋",
    description: "经典策略对弈游戏。支持人机三种难度与双人对战，先连五子者胜。",
    badge: "对弈",
    gradient: "from-rose-400 to-pink-500",
    icon: <Target className="h-9 w-9 text-white" />,
    emoji: "⚫",
  },
  {
    href: "/gem-crush",
    title: "宝石消消乐",
    description: "交换相邻宝石消除三连，触发连击与特殊道具，挑战最高分！",
    badge: "消除",
    gradient: "from-emerald-400 to-teal-500",
    icon: <Gem className="h-9 w-9 text-white" />,
    emoji: "💎",
  },
  {
    href: "/sudoku",
    title: "数独",
    description: "经典数字逻辑游戏。支持四宫、六宫、九宫三种棋盘，锻炼逻辑推理能力！",
    badge: "逻辑",
    gradient: "from-violet-400 to-purple-500",
    icon: <Grid3X3 className="h-9 w-9 text-white" />,
    emoji: "🔢",
  },
  {
    href: "/pop-star",
    title: "消灭星星",
    description: "点击相连同色星砖获取高分，挑战关卡目标，体验经典爽快消除。",
    badge: "休闲",
    gradient: "from-orange-300 via-rose-300 to-pink-400",
    icon: <Sparkles className="h-9 w-9 text-white" />,
    emoji: "⭐",
  },
];
