import type { Metadata } from "next";
import { Nunito, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Nunito - 圆润温暖的英文字体，用于正文和 UI 元素
 */
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

/**
 * Noto Sans SC - 清晰易读的中文正文字体
 */
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PlayAI - 游戏合集",
    template: "%s | PlayAI",
  },
  description: "围住小猫、五子棋等经典游戏，在浏览器中尽情畅玩。",
};

/**
 * 根布局组件 - 提供全局字体、暖色主题和页面结构
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${nunito.variable} ${notoSansSC.variable} bg-warm-cream font-sans text-warm-dark`}
      >
        <div className="warm-texture min-h-screen">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
