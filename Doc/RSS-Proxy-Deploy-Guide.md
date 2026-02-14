# RSS Proxy 部署指南

基于 Cloudflare Workers 的 RSS 转 JSON 代理服务，解决以下问题：

- RSS 源跨域访问限制（CORS）
- 第三方 API 调用次数限制
- 第三方 API 缓存延迟问题

---

## 功能特性

| 特性 | 说明 |
|------|------|
| **无缓存** | 实时获取最新 RSS 数据 |
| **高额度** | 免费版每天 100,000 次请求 |
| **CORS 支持** | 前端可直接调用 |
| **多格式支持** | RSS 2.0 / Atom |

---

## 免费额度对比

| 服务 | 免费额度 | 缓存 |
|------|----------|------|
| RSS2JSON | 200 次/天 | 1-4 小时 |
| **Cloudflare Workers** | **100,000 次/天** | **无** |

---

## 部署步骤

### 第一步：注册 Cloudflare 账号

1. 访问 https://dash.cloudflare.com/sign-up
2. 输入邮箱和密码，点击 **Sign up**
3. 查收验证邮件，点击验证链接
4. 验证后登录 Cloudflare

---

### 第二步：进入 Workers 页面

1. 登录后进入 Dashboard 首页
2. 左侧菜单找到 **Workers & Pages**
3. 点击进入

---

### 第三步：创建 Worker

1. 点击右上角 **Create application**
2. 选择 **Create Worker** 选项卡
3. 在 **Name** 输入框填写：`rss-proxy`
4. 点击 **Deploy**

---

### 第四步：编辑代码

1. 部署完成后，点击 **Edit code**
2. 删除编辑器中的默认代码
3. 粘贴 `rss-proxy-worker.js` 文件中的代码
4. 点击 **Deploy**

---

### 第五步：获取 Worker URL

1. 部署成功后返回 Worker 详情页
2. 复制 Worker URL，格式为：
   ```
   https://rss-proxy.你的用户名.workers.dev
   ```

---

### 第六步：测试

访问以下 URL 测试是否部署成功：

```
https://rss-proxy.你的用户名.workers.dev/?url=https://www.jiqizhixin.com/rss
```

成功返回示例：

```json
{
  "status": "ok",
  "feed": {
    "title": "机器之心",
    "description": "...",
    "link": "https://www.jiqizhixin.com"
  },
  "items": [
    {
      "title": "文章标题",
      "link": "https://...",
      "pubDate": "Sat, 14 Feb 2026 12:00:00 GMT",
      "description": "文章摘要...",
      "content": "完整内容...",
      "thumbnail": "https://...",
      "author": "作者名"
    }
  ]
}
```

---

## 使用方法

### API 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `url` | 是 | RSS 源地址 |
| `count` | 否 | 返回条目数，默认 20 |

### 请求示例

```javascript
// 获取机器之心 RSS
const rssUrl = 'https://www.jiqizhixin.com/rss';
const proxyUrl = `https://rss-proxy.xxx.workers.dev/?url=${encodeURIComponent(rssUrl)}&count=10`;

fetch(proxyUrl)
  .then(res => res.json())
  .then(data => {
    console.log(data.feed.title);
    data.items.forEach(item => {
      console.log(item.title, item.pubDate);
    });
  });
```

---

## 项目集成

在 `ai-news.html` 中配置：

```javascript
// RSS 代理配置
const RSS_PROXY = 'https://rss-proxy.你的用户名.workers.dev/?url=';
```

---

## 文件说明

```
PlayAI/
├── rss-proxy-worker.js        # Cloudflare Worker 代码
├── RSS-Proxy-Deploy-Guide.md  # 本文档
└── ai-news.html               # AI 早报页面（使用代理）
```

---

## 常见问题

### Q: 访问返回 "Missing url parameter"

这是正常的，需要在 URL 后面加上 `?url=RSS地址` 参数。

### Q: 返回 "HTTP 403" 错误

部分 RSS 源可能有访问限制，尝试更换其他源。

### Q: 返回 "HTTP 429" 错误

请求过于频繁，稍后再试。

### Q: 数据格式和 RSS2JSON 不一样？

是的，返回格式略有不同，但核心字段一致。需要调整前端代码适配。

---

## 注意事项

1. **免费额度**：每天 100,000 次请求，超出会返回错误
2. **CPU 限制**：每次请求最多 10ms CPU 时间
3. **超时限制**：请求超时时间约 50ms（免费版）

---

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
