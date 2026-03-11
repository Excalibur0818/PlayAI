import { NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: NextRequest) {
  let payload: {
    q?: string;
    from?: string;
    to?: string;
    appid?: string;
    salt?: string;
    sign?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { q, from = "auto", to = "en", appid, salt, sign } = payload;

  if (!q) {
    return NextResponse.json({ error: "Missing required parameter: q" }, { status: 400 });
  }

  if (!appid || !salt || !sign) {
    return NextResponse.json({ error: "Missing required parameters: appid, salt, sign" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.fanyi.baidu.com/api/trans/vip/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `q=${q}&from=${from}&to=${to}&appid=${appid}&salt=${salt}&sign=${sign}`,
    });

    const data = await response.json();

    if (data.error_code) {
      return NextResponse.json(
        {
          error: data.error_msg || "Translation failed",
          error_code: data.error_code,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation service error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}