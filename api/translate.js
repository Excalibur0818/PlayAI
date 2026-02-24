/**
 * 百度翻译 API 代理服务
 * 部署到 Vercel Serverless Functions 使用
 *
 * 使用方式: https://your-project.vercel.app/api/translate?q=hello&from=auto&to=en&appid=xxx&salt=xxx&sign=xxx
 */

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const { q, from = 'auto', to = 'en', appid, salt, sign } = req.body;

  if (!q) {
    return res.status(400).json({
      error: 'Missing required parameter: q'
    });
  }

  if (!appid || !salt || !sign) {
    return res.status(400).json({
      error: 'Missing required parameters: appid, salt, sign'
    });
  }

  try {
    const response = await fetch('https://api.fanyi.baidu.com/api/trans/vip/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      // 客户端已经对 q 进行了 URL 编码，直接使用 q
      body: `q=${q}&from=${from}&to=${to}&appid=${appid}&salt=${salt}&sign=${sign}`
    });

    const data = await response.json();

    if (data.error_code) {
      return res.status(400).json({
        error: data.error_msg || 'Translation failed',
        error_code: data.error_code
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Translation service error'
    });
  }
}
