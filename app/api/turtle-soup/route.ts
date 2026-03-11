import { NextRequest, NextResponse } from "next/server";

type ProviderKey = "minimax" | "deepseek" | "glm";

const PROVIDER_CONFIG: Record<ProviderKey, { url: string; model: string; body: (prompt: string) => object }> = {
  minimax: {
    url: "https://api.minimaxi.com/v1/text/chatcompletion_v2",
    model: "abab6.5s-chat",
    body: (prompt) => ({
      model: "abab6.5s-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  },
  deepseek: {
    url: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
    body: (prompt) => ({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  },
  glm: {
    url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    model: "glm-4-flash",
    body: (prompt) => ({
      model: "glm-4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  },
};

export async function POST(request: NextRequest) {
  let payload: { provider?: ProviderKey; apiKey?: string; prompt?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider, apiKey, prompt } = payload;

  if (!provider || !PROVIDER_CONFIG[provider]) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "Missing API key" }, { status: 400 });
  }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const config = PROVIDER_CONFIG[provider];

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config.body(prompt.trim())),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error?.message || data.msg || `API 调用失败: ${response.status}`,
        },
        { status: response.status },
      );
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "模型未返回有效内容" }, { status: 502 });
    }

    return NextResponse.json({ provider, model: config.model, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Turtle soup proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
