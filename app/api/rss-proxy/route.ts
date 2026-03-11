import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAINS = [
  "jiqizhixin.com",
  "openai.com",
  "blog.google",
  "google.com",
  "infoq.cn",
];

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(request: NextRequest) {
  const rssUrl = request.nextUrl.searchParams.get("url");
  const countParam = request.nextUrl.searchParams.get("count") ?? "20";

  if (!rssUrl) {
    return NextResponse.json({ status: "error", message: "Missing url parameter" }, { status: 400 });
  }

  try {
    const rssDomain = new URL(rssUrl).hostname;
    const isAllowed = ALLOWED_DOMAINS.some((domain) => rssDomain === domain || rssDomain.endsWith(`.${domain}`));

    if (!isAllowed) {
      return NextResponse.json({ status: "error", message: "Domain not allowed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const result = parseRSS(text, parseInt(countParam, 10), rssUrl);

    return NextResponse.json(
      {
        status: "ok",
        feed: result.feed,
        items: result.items,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "RSS proxy error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

function parseRSS(xmlText: string, maxItems: number, feedUrl: string) {
  const decodeEntities = (text: string) =>
    text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");

  const getItem = (text: string, tag: string) => {
    const match = text.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? (match[1] || match[2] || "").trim() : "";
  };

  const cleanText = (text: string) =>
    text
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
      .replace(/<img[^>]+>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const extractImage = (item: string) => {
    const decoded = decodeEntities(item);

    let match = decoded.match(/<media:content[^>]*url="([^"]+)"[^>]*>/i);
    if (match) return match[1];

    match = decoded.match(/<media:thumbnail[^>]*url="([^"]+)"[^>]*\/?>/i);
    if (match) return match[1];

    match = decoded.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image[^"]*"/i);
    if (match) return match[1];

    match = decoded.match(/<img[^>]+src="([^"]+)"/i);
    if (match) return match[1];

    return null;
  };

  const channelMatch = xmlText.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i);
  const channelText = channelMatch ? channelMatch[1] : "";

  const feed = {
    title: getItem(channelText, "title"),
    description: getItem(channelText, "description"),
    link: getItem(channelText, "link"),
    url: feedUrl,
  };

  const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
  const items = itemMatches.slice(0, maxItems).map((itemText) => {
    const title = getItem(itemText, "title");
    const link = getItem(itemText, "link");
    const pubDate = getItem(itemText, "pubDate") || getItem(itemText, "published");
    let description = getItem(itemText, "description");
    let content = getItem(itemText, "content:encoded") || getItem(itemText, "content") || description;

    description = decodeEntities(description);
    content = decodeEntities(content);

    const cleanDesc = cleanText(description);
    const summary = cleanDesc ? cleanDesc : cleanText(content).slice(0, 300);

    return {
      title,
      link,
      pubDate,
      description: summary.slice(0, 300),
      content,
      thumbnail: extractImage(itemText),
      author: getItem(itemText, "author") || getItem(itemText, "dc:creator"),
    };
  });

  return { feed, items };
}