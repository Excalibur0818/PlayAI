# PlayAI

一个聚合多种 AI 工具的工具箱，当前正在从原生 HTML 多页站点迁移到 Next.js App Router，并继续保持现有的 Apple 黑白商务风格。

在线预览旧版静态站点：[https://excalibur0818.github.io/PlayAI](https://excalibur0818.github.io/PlayAI)

![PlayAI](https://img.shields.io/badge/PlayAI-Tools-blue)
![Next.js](https://img.shields.io/badge/Next.js-App_Router-black)
![Apple Style](https://img.shields.io/badge/Style-Apple-gray)

---

## 当前迁移状态

- 已建立 Next.js App Router、TypeScript、Tailwind CSS 基础骨架
- 已迁移共享布局、首页、错误页、围住小猫和两个 API 路由
- AI 早报、在线翻译、海龟汤已挂上新路由，完整交互逻辑将在下一批迁移中继续平移
- docs/ 知识库暂不纳入首轮迁移，以避免阻塞主站切换

---

## 工具列表

### 1. AI 早报 📰
**AI 资讯聚合页面**

- 多 RSS 源动态获取（机器之心、OpenAI、Google AI 等）
- 支持源筛选
- RSS 地址一键复制
- 响应式卡片布局

访问：`ai-news.html`

---

### 2. 海龟汤生成器 🐢
**推理游戏题目生成工具**

- 智能生成海龟汤推理题目
- 支持自定义题目难度和类型（清汤/红汤/黑汤）
- 答案逐层揭示功能
- 适合聚会、团建活动

访问：`turtle-soup.html`

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
npm run start
```

### GitHub Pages 部署

1. Fork 本仓库
2. 进入 Settings → Pages
3. Source 选择 `Deploy from a branch`，Branch 选择 `main`
4. 等待部署完成

---

## 技术栈

- **前端框架**: Next.js App Router + React + TypeScript
- **样式**: Tailwind CSS
- **图标**: lucide-react
- **样式**: Apple 黑白商务风格
- **字体**: DM Sans + Playfair Display
- **托管**: Vercel

---

## 项目结构

```
PlayAI/
├── app/                    # Next.js App Router
├── components/             # 共享组件与客户端逻辑
├── lib/                    # 共享数据和工具函数
├── api/                    # 原有 Vercel Serverless 参考实现
├── *.html                  # 旧版静态页面，当前保留作迁移参考
├── README.md               # 本文档
└── LICENSE                 # MIT 协议
```

---

## 配置说明

### API 路由

- RSS 代理：`/api/rss-proxy?url=https://example.com/feed`
- 百度翻译代理：`/api/translate`

---

## 注意事项

1. 旧版 HTML 文件当前仍保留在仓库中，方便逐页对照迁移，但新开发应基于 Next.js 目录结构进行。
2. 首轮迁移目标是界面与结构稳定，不是一次性重写所有工具逻辑。
3. docs/ 知识库暂未纳入 Next.js 主站路由，后续会单独决定保留静态方案还是迁到 MDX。

---

## 开源协议

[MIT License](./LICENSE)

---

## 联系

- GitHub: [@Excalibur0818](https://github.com/Excalibur0818)
- 邮箱: excalibur0818@gmail.com

---

如果觉得这个工具箱有用，欢迎 Star ⭐ 支持！
