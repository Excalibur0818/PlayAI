# RSSHub Vercel 部署指南

🚀 使用 Vercel 免费部署 RSSHub，为你的 AI 资讯页面提供更多 RSS 源。

## 为什么用 RSSHub？

- 为「没有官方 RSS 」的网站生成 RSS（如知乎、微博、B站等）
- 自主控制，不依赖第三方服务
- Vercel 免费托管，无需服务器

---

## 快速部署步骤

### 1. Fork RSSHub 仓库

1. 访问 https://github.com/DIYgod/RSSHub
2. 点击右上角 **Fork** 按钮
3. 等待 Fork 完成（约 5 秒）

### 2. Vercel 创建项目

1. 访问 https://vercel.com 并用 GitHub 账号登录
2. 点击 **Add New Project**
3. 选择刚 Fork 的 `RSSHub` 仓库
4. 配置项目：

| 配置项 | 值 |
|--------|-----|
| Framework Preset | `Other` |
| Build Command | `pnpm build` 或留空 |
| Output Directory | 留空 |
| Install Command | `pnpm install` |

### 3. 配置环境变量

点击 **Environment Variables**，添加以下变量：

```
CACHE_EXPIRE = 3600
CACHE_CONTENT_EXPIRE = 3600
```

> 说明：缓存 1 小时，减少请求频率和响应时间。

如需允许跨域请添加：
```
ALLOW_ORIGIN = *
```

### 4. 部署

点击 **Deploy**，等待 2-3 分钟。

部署成功后会获得域名：
```
https://rsshub-xxxx.vercel.app
```

---

## 修改 ai-news.html

将 RSS 源地址替换为你的 Vercel 域名：

```javascript
const RSS_SOURCES = {
    zhihu: {
        name: '知乎热榜',
        url: 'https://rsshub-xxxx.vercel.app/zhihu/hotlist',
        category: 'industry',
        color: 'neon-blue'
    },
    weibo: {
        name: '微博AI',
        url: 'https://rsshub-xxxx.vercel.app/weibo/search/AI',
        category: 'industry',
        color: 'neon-pink'
    }
};
```

---

## 常用 RSSHub 路由

### 社交媒体

| 平台 | 路由 | 示例 |
|------|------|------|
| 知乎热榜 | `/zhihu/hotlist` | 知乎全站热榜 |
| 知乎日报 | `/zhihu/daily` | 知乎日报精选 |
| 微博用户 | `/weibo/user/:uid` | 指定用户动态 |
| 微博搜索 | `/weibo/search/:keyword` | 关键词搜索 |
| B站 UP 主 | `/bilibili/user/:uid` | UP 主视频 |
| 小红书 | `/xiaohongshu/user/:user_id` | 用户笔记 |

### 技术社区

| 平台 | 路由 | 说明 |
|------|------|------|
| GitHub Trending | `/github/trending/:language/:since` | 热门仓库 |
| GitHub 用户 | `/github/user/:user` | 用户动态 |
| YouTube 频道 | `/youtube/channel/:id` | 频道视频 |
| Twitter 用户 | `/twitter/user/:id` | 用户推文 |

### AI 相关

| 平台 | 路由 | 说明 |
|------|------|------|
| 机器之心 | `/jiqizhixin/category/:id` | AI 新闻 |
| 量子位 | `/qbitai/category/:category` | 量子位栏目 |
| Papers With Code | `/paperswithcode/research-trending` | 热门论文 |
| arXiv | `/arxiv/query/:query` | 论文搜索 |

完整路由文档：https://docs.rsshub.app

---

## 注意事项

### 免费限制

- Vercel 免费版月带宽 100GB，个人使用足够
- 函数计算时间无限制（非流量）

### 冷启动延迟

Serverless 首次访问可能有 1-2 秒延迟，后续请求使用缓存。

### 国内访问

Vercel 国内部分地区可能不稳定，建议：
1. 绑定自定义域名（如通过 Cloudflare）
2. 或使用国内服务器自建

---

## 故障排除

### 部署失败

1. 检查 Node.js 版本是否 >= 18
2. 确认使用的是 `pnpm` 而非 `npm`
3. 查看 Vercel 日志找具体错误

### 跨域错误 (CORS)

确保已添加环境变量：
```
ALLOW_ORIGIN = *
```

### RSS 获取失败

1. 检查路由语法是否正确
2. 确认目标网站没有反爬机限制
3. 尝试调整 `CACHE_EXPIRE` 缓存时间

---

## 更新维护

RSSHub 会不断更新支持的网站。要更新你的实例：

1. 进入你 Fork 的 RSSHub 仓库
2. 点击 **Sync fork** 同步原仓库更新
3. Vercel 会自动重新部署

---

## 其他部署方案

如果 Vercel 不适合你，还有以下选择：

| 平台 | 特点 |
|------|------|
| Railway | 免费额度大，但会休眠 |
| Render | 简单，但冷启动慢 |
| 阿里云函数 | 国内访问快，按量付费 |
| 自建服务器 | 最稳定，需要运维 |

---

📝 **推荐配置**

对于本项目的 AI 资讯页，建议使用：

```javascript
const RSS_SOURCES = {
    jiqizhixin: {
        name: '机器之心',
        url: 'https://www.jiqizhixin.com/rss',  // 官方 RSS
        category: 'tech',
        color: 'neon-blue'
    },
    openai: {
        name: 'OpenAI',
        url: 'https://openai.com/blog/rss.xml',  // 官方 RSS
        category: 'tech',
        color: 'neon-purple'
    },
    googleai: {
        name: 'Google AI',
        url: 'https://blog.google/technology/ai/rss/',  // 官方 RSS
        category: 'tech',
        color: 'neon-pink'
    },
    // 以下通过 RSSHub 获取
    zhihu: {
        name: '知乎AI',
        url: 'https://rsshub-xxxx.vercel.app/zhihu/search/AI',
        category: 'industry',
        color: 'neon-green'
    }
};
```

这样官方 RSS 和 RSSHub 互补，即使 RSSHub 暂时不可用也不会影响核心功能。
