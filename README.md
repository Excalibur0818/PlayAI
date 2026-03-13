# PlayAI

围住小猫、五子棋等经典策略小游戏合集，基于 Next.js App Router 构建，继续保持 Apple 黑白商务风格。

![PlayAI](https://img.shields.io/badge/PlayAI-Games-blue)
![Next.js](https://img.shields.io/badge/Next.js-App_Router-black)
![Apple Style](https://img.shields.io/badge/Style-Apple-gray)

---

## 游戏列表

### 1. 围住小猫 🐱
**经典策略小游戏**

- 在六边形棋盘上放置障碍物
- 目标是把小猫困在正中央
- 小猫会智能逃跑，考验你的策略

访问：`/catch-the-cat`

---

### 2. 五子棋 ⚫
**经典策略对弈游戏**

- 支持人机对战（三种难度）
- 支持双人对战
- 先连五子者胜

访问：`/gomoku`

---

## 快速开始

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/Excalibur0818/PlayAI.git
cd PlayAI

# 安装依赖
npm install

# 启动 Next.js 开发服务器
npm run dev
```

访问 `http://localhost:3000`

### 生产构建

```bash
npm run build
npm start
```

### Vercel 部署

项目已配置 `vercel.json`，可直接部署到 Vercel。

---

## 技术栈

- **前端框架**: Next.js App Router + React + TypeScript
- **样式**: Tailwind CSS
- **图标**: lucide-react
- **风格**: Apple 黑白商务风格
- **字体**: DM Sans + Playfair Display
- **托管**: Vercel

---

## 项目结构

```
PlayAI/
├── app/                    # Next.js App Router（页面）
├── components/             # 共享组件
├── lib/                    # 共享数据和工具函数
├── README.md               # 本文档
└── LICENSE                 # MIT 协议
```

---

## 注意事项

1. 所有游戏均在浏览器本地运行，无需服务器端 API。
2. 游戏进度不保存，刷新页面即重置。

---

## 开源协议

[MIT License](./LICENSE)

---

## 联系

- GitHub: [@Excalibur0818](https://github.com/Excalibur0818)
- 邮箱: excalibur0818@gmail.com

---

如果觉得这个小游戏合集有趣，欢迎 Star ⭐ 支持！
