/**
 * RSS to JSON 代理服务
 * 部署到 Cloudflare Workers 使用
 * 
 * 使用方式: https://your-worker.workers.dev/?url=https://example.com/feed
 */

// 允许的 RSS 源域名白名单
const ALLOWED_DOMAINS = [
  'jiqizhixin.com',
  'openai.com',
  'blog.google',
  'google.com',
  'infoq.cn'
];

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);
    const rssUrl = url.searchParams.get('url');
    const count = parseInt(url.searchParams.get('count') || '20');

    if (!rssUrl) {
      return jsonResponse({
        status: 'error',
        message: 'Missing url parameter'
      }, 400);
    }

    // 验证域名白名单
    try {
      const rssDomain = new URL(rssUrl).hostname;
      const isAllowed = ALLOWED_DOMAINS.some(domain => 
        rssDomain === domain || rssDomain.endsWith('.' + domain)
      );
      
      if (!isAllowed) {
        return jsonResponse({
          status: 'error',
          message: 'Domain not allowed'
        }, 403);
      }
    } catch (e) {
      return jsonResponse({
        status: 'error',
        message: 'Invalid URL'
      }, 400);
    }

    try {
      // 获取 RSS 源
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RSS-Proxy/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      
      // 解析 XML
      const result = parseRSS(text, count, rssUrl);
      
      return jsonResponse({
        status: 'ok',
        feed: result.feed,
        items: result.items
      });

    } catch (error) {
      return jsonResponse({
        status: 'error',
        message: error.message
      }, 500);
    }
  }
};

/**
 * 解析 RSS XML
 * @param {string} xmlText - XML 文本
 * @param {number} maxItems - 最大条目数
 * @param {string} feedUrl - 源 URL
 * @returns {Object} - { feed, items }
 */
function parseRSS(xmlText, maxItems, feedUrl) {
  // 解码 HTML 实体
  const decodeEntities = (text) => {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  };

  // 简单的 XML 解析（不依赖 DOMParser）
  const getItem = (text, tag) => {
    const match = text.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    return match ? (match[1] || match[2] || '').trim() : '';
  };

  const cleanText = (text) => {
    return text
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
      .replace(/<img[^>]+>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const extractImage = (item) => {
    // 先解码 HTML 实体
    const decoded = decodeEntities(item);
    
    // 尝试从 media:content 提取
    let match = decoded.match(/<media:content[^>]*url="([^"]+)"[^>]*>/i);
    if (match) return match[1];
    
    // 尝试从 media:thumbnail 提取
    match = decoded.match(/<media:thumbnail[^>]*url="([^"]+)"[^>]*\/?>/i);
    if (match) return match[1];
    
    // 尝试从 enclosure 提取
    match = decoded.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image[^"]*"/i);
    if (match) return match[1];
    
    // 尝试从 content:encoded 中提取 img 标签
    match = decoded.match(/<img[^>]+src="([^"]+)"/i);
    if (match) return match[1];
    
    return null;
  };

  // 提取 channel 信息
  const channelMatch = xmlText.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i);
  const channelText = channelMatch ? channelMatch[1] : '';

  const feed = {
    title: getItem(channelText, 'title'),
    description: getItem(channelText, 'description'),
    link: getItem(channelText, 'link'),
    url: feedUrl
  };

  // 提取 items
  const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
  
  const items = itemMatches.slice(0, maxItems).map((itemText, index) => {
    const title = getItem(itemText, 'title');
    const link = getItem(itemText, 'link');
    const pubDate = getItem(itemText, 'pubDate') || getItem(itemText, 'published');
    let description = getItem(itemText, 'description');
    let content = getItem(itemText, 'content:encoded') || getItem(itemText, 'content') || description;
    
    // 解码 HTML 实体
    description = decodeEntities(description);
    content = decodeEntities(content);
    
    // 如果 description 为空或只有 CDATA 标签，从 content 中提取摘要
    const cleanDesc = cleanText(description);
    const summary = cleanDesc ? cleanDesc : cleanText(content).substring(0, 300);
    
    return {
      title,
      link,
      pubDate,
      description: summary.substring(0, 300),
      content: content,
      thumbnail: extractImage(itemText),
      author: getItem(itemText, 'author') || getItem(itemText, 'dc:creator')
    };
  });

  return { feed, items };
}

/**
 * 返回 JSON 响应
 * @param {Object} data - 响应数据
 * @param {number} status - HTTP 状态码
 * @returns {Response}
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders()
    }
  });
}

/**
 * CORS 响应头
 * @returns {Object}
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
