import { NextResponse } from "next/server";

const OEMBED = "https://www.youtube.com/oembed";
const MAX_IDS = 40;
const BATCH = 6;

function isVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  const raw = (body as { ids?: unknown }).ids;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "ids 배열이 필요합니다." }, { status: 400 });
  }

  const clean = [
    ...new Set(
      raw
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(isVideoId),
    ),
  ].slice(0, MAX_IDS);

  if (clean.length === 0) {
    return NextResponse.json({ titles: {} as Record<string, string> });
  }

  const titles: Record<string, string> = {};

  for (let i = 0; i < clean.length; i += BATCH) {
    const batch = clean.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (id) => {
        const watchUrl = `https://www.youtube.com/watch?v=${id}`;
        const oembedUrl = `${OEMBED}?url=${encodeURIComponent(watchUrl)}&format=json`;
        try {
          const res = await fetch(oembedUrl, {
            headers: { "User-Agent": "notion-embed-playlist/1.0" },
          });
          if (!res.ok) return [id, ""] as const;
          const j = (await res.json()) as { title?: string };
          const title = typeof j.title === "string" ? j.title.trim() : "";
          return [id, title] as const;
        } catch {
          return [id, ""] as const;
        }
      }),
    );
    for (const [id, title] of results) {
      if (title) titles[id] = title;
    }
  }

  return NextResponse.json({ titles });
}
