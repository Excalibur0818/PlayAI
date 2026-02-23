# RSS Proxy 部署指南

基于 Cloudflare Workers / Vercel Serverless Functions 的 RSS 转 JSON 代理服务，解决以下问题：

- RSS 源跨域访问限制（CORS）
- 第三方 API 调用次数限制
- 第三方 API 缓存延迟问题

---

## 功能特性

| 特性 | 说明 |
|------|------|
| **无缓存** | 实时获取最新 RSS 数据 |
| **高额度** | Cloudflare 100,000 次/天，Vercel 100GB 带宽/月 |
| **CORS 支持** | 前端可直接调用 |
| **多格式支持** | RSS 2.0 / Atom |
| **安全防护** | 域名白名单限制 |

---

## 免费额度对比

| 服务 | 免费额度 | 缓存 | 国内访问 |
|------|----------|------|----------|
| RSS2JSON | 200 次/天 | 1-4 小时 | ✅ |
| Cloudflare Workers | 100,000 次/天 | 无 | ❌ workers.dev 被墙 |
| **Vercel Functions** | **100GB 带宽/月** | **无** | **⚠️ 部分被墙** |

---

## 方案一：Vercel Serverless Functions（推荐）

### 第一步：创建 API 目录

在项目根目录创建 `api` 文件夹：

```
PlayAI/
├── api/
│   └── rss-proxy.js    ← 新建
├── index.html
├── ai-news.html
└── ...
```

### 第二步：创建 Function 文件

在 `api/rss-proxy.js` 中写入代码（参考 `Doc/rss-proxy-worker.js`，格式略有不同）

### 第三步：部署到 Vercel

1. 推送代码到 GitHub
2. Vercel 会自动检测 `api` 目录并部署为 Serverless Function
3. 访问地址：`https://你的项目.vercel.app/api/rss-proxy?url=...`

### 第四步：测试

```
https://play-ai-boki.vercel.app/api/rss-proxy?url=https://www.jiqizhixin.com/rss
```

---

## 方案二：Cloudflare Workers

### 第一步：注册 Cloudflare 账号

1. 访问 https://dash.cloudflare.com/sign-up
2. 输入邮箱和密码，点击 **Sign up**
3. 查收验证邮件，点击验证链接
4. 验证后登录 Cloudflare

### 第二步：进入 Workers 页面

1. 登录后进入 Dashboard 首页
2. 左侧菜单找到 **Workers & Pages**
3. 点击进入

### 第三步：创建 Worker

1. 点击右上角 **Create application**
2. 选择 **Create Worker** 选项卡
3. 在 **Name** 输入框填写：`rss-proxy`
4. 点击 **Deploy**

### 第四步：编辑代码

1. 部署完成后，点击 **Edit code**
2. 删除编辑器中的默认代码
3. 粘贴 `Doc/rss-proxy-worker.js` 文件中的代码
4. 点击 **Deploy**

### 第五步：获取 Worker URL

```
https://rss-proxy.你的用户名.workers.dev
```

### 第六步：测试

```
https://rss-proxy.你的用户名.workers.dev/?url=https://www.jiqizhixin.com/rss
```

---

## API 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `url` | 是 | RSS 源地址 |
| `count` | 否 | 返回条目数，默认 20 |

---

## 返回格式

```json
{
  "status": "ok",
  "feed": {
    "title": "机器之心",
    "description": "...",
    "link": "https://www.jiqizhixin.com",
    "url": "https://www.jiqizhixin.com/rss"
  },
  "items": [
    {
      "title": "文章标题",
      "link": "https://...",
      "pubDate": "Sat, 14 Feb 2026 12:00:00 GMT",
      "description": "文章摘要（限制300字符）",
      "content": "完整内容（HTML格式）",
      "thumbnail": "https://...",
      "author": "作者名"
    }
  ]
}
```

---

## 项目集成

在 `ai-news.html` 中配置：

```javascript
// Vercel
const RSS_PROXY = 'https://play-ai-boki.vercel.app/api/rss-proxy?url=';

// 或 Cloudflare
const RSS_PROXY = 'https://rss-proxy.xxx.workers.dev/?url=';
```

---

## 域名白名单

为防止 SSRF 攻击，代码中限制了允许访问的域名：

```javascript
const ALLOWED_DOMAINS = [
  'jiqizhixin.com',
  'openai.com',
  'blog.google',
  'google.com',
  'infoq.cn'
];
```

如需添加新 RSS 源，需在白名单中添加对应域名。

---

## 已解决的问题

### 1. HTML 实体编码问题

**问题**：机器之心的 RSS 内容被 HTML 实体编码（如 `&lt;p&gt;`）

**解决**：添加 `decodeEntities` 函数解码

```javascript
const decodeEntities = (text) => {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};
```

### 2. description 为空问题

**问题**：部分 RSS 源的 `<description>` 为空，内容在 `<content:encoded>` 中

**解决**：优先使用 `content:encoded`，如果 description 为空则从中提取摘要

### 3. 图片链接显示问题

**问题**：摘要中包含 `<img>` 标签，显示为纯文本链接

**解决**：在 `cleanText` 函数中移除 `<img>` 标签

```javascript
const cleanText = (text) => {
  return text
    .replace(/<img[^>]+>/gi, '')  // 移除图片标签
    .replace(/<[^>]+>/g, ' ')      // 移除其他标签
    .replace(/\s+/g, ' ')
    .trim();
};
```

### 4. InfoQ 访问失败问题

**问题**：InfoQ 需要完整的浏览器请求头才能访问

**解决**：添加完整的请求头模拟真实浏览器

```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache'
}
```

### 5. workers.dev 被墙问题

**问题**：Cloudflare 的 `workers.dev` 域名在国内无法访问

**解决**：使用 Vercel Serverless Functions 替代

---

## 文件说明

```
PlayAI/
├── api/
│   └── rss-proxy.js           # Vercel Function 代码
├── Doc/
│   ├── rss-proxy-worker.js    # Cloudflare Worker 代码
│   └── RSS-Proxy-Deploy-Guide.md  # 本文档
└── ai-news.html               # AI 早报页面
```

---

## 常见问题

### Q: 访问返回 "Missing url parameter"

需要在 URL 后面加上 `?url=RSS地址` 参数。

### Q: 返回 "Domain not allowed"

请求的域名不在白名单中，需在代码中添加。

### Q: 返回 "fetch failed"

目标服务器可能限制了请求，尝试添加更完整的请求头。

### Q: 国内访问超时

`workers.dev` 域名被墙，建议使用 Vercel 或绑定自定义域名。

---

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Vercel Functions 文档](https://vercel.com/docs/functions)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
