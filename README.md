# PlayAI - AI 工具箱

🌐 在线预览：[https://excalibur0818.github.io/PlayAI](https://excalibur0818.github.io/PlayAI)

一个聚合多种 AI 工具的个人工具箱，采用赛博胡克风格设计。

![PlayAI](https://img.shields.io/badge/PlayAI-Tools-blue)
![Pure Frontend](https://img.shields.io/badge/Pure-Frontend-orange)
![Cyberpunk](https://img.shields.io/badge/Style-Cyberpunk-purple)

---

## 🎨 工具列表

### 1. AI 早报 📰
**AI 资讯聚合页面**

- 多 RSS 源动态获取（机器之心、OpenAI、Google AI 等）
- 支持源筛选和分类过滤
- RSS 地址一键复制
- 响应式卡片布局

→ 访问：`ai-news.html`

---

### 2. 海龟汤生成器 🐢
**推理游戏题目生成工具**

- 智能生成海龟汤推理题目
- 支持自定义题目难度和类型
- 答案逐层揭示功能
- 适合聚会、团建活动

→ 访问：`turtle-soup.html`

---

## 🚀 快速开始

### 本地预览

```bash
# 克隆仓库
git clone https://github.com/Excalibur0818/PlayAI.git
cd PlayAI

# 用任意静态服务器预览
npx serve .
# 或
python -m http.server 8080
```

访问 `http://localhost:8080`

### GitHub Pages 部署

1. Fork 本仓库
2. 进入 Settings → Pages
3. Source 选择 `Deploy from a branch`，Branch 选择 `main`
4. 等待部署完成

---

## 📜 技术栈

- **前端**: 原生 HTML5 + Tailwind CSS
- **图标**: Lucide Icons
- **样式**: 赛博胡克风格（红色/绿色/蓝色渐变）
- **托管**: GitHub Pages

---

## 📁 项目结构

```
PlayAI/
├── index.html              # 工具箱首页/导航
├── ai-news.html            # AI 资讯聚合
├── turtle-soup.html        # 海龟汤生成器
├── errorpage.html          # 错误页面
├── main.js                 # 公共逻辑
├── README.md               # 本文档
├── RSSHub-Deploy-Guide.md  # RSSHub 部署指南
└── LICENSE                 # MIT 协议
```

---

## 🔧 配置说明

### AI 早报 RSS 源配置

在 `ai-news.html` 中修改 `RSS_SOURCES`：

```javascript
const RSS_SOURCES = {
    jiqizhixin: {
        name: '机器之心',
        url: 'https://www.jiqizhixin.com/rss',
        category: 'tech',
        color: 'neon-blue'
    },
    openai: {
        name: 'OpenAI',
        url: 'https://openai.com/blog/rss.xml',
        category: 'tech',
        color: 'neon-purple'
    }
    // 添加更多源...
};
```

### 扩展更多 RSS 源

如需获取知乎、微博等没有官方 RSS 的平台，可参阅 [RSSHub 部署指南](./RSSHub-Deploy-Guide.md)自建 RSSHub 实例。

---

## ⚠️ 注意事项

1. **纯前端项目** - 所有功能均在浏览器端运行，无需后端服务
2. **RSS2JSON 限制** - 免费版 API 有调用次数限制（约 200 次/天）
3. **图片加载** - 部分网站图片有防盗链限制，可能显示默认图

---

## 📜 开源协议

[MIT License](./LICENSE)

---

## 👋 联系

- GitHub: [@Excalibur0818](https://github.com/Excalibur0818)
- 邮箱: excalibur0818@gmail.com

---

如果觉得这个工具箱有用，欢迎 Star ⭐ 支持！
