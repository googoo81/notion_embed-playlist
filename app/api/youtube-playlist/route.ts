import {
  isLikelyYoutubePlaylistId,
  isYoutubeAtomPlaylistFeedSupported,
  parseYoutubePlaylistFeedXml,
} from "@/lib/youtube-playlist-feed";

export const revalidate = 120;

const FEED_URL = "https://www.youtube.com/feeds/videos.xml";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const list = searchParams.get("list")?.trim() ?? "";

  if (!list || !isLikelyYoutubePlaylistId(list)) {
    return Response.json({ error: "유효한 list(플레이리스트 ID)가 필요합니다." }, {
      status: 400,
    });
  }

  if (!isYoutubeAtomPlaylistFeedSupported(list)) {
    return Response.json(
      {
        error:
          "이 목록 유형(Mix·나중에 보기 등)은 공개 피드로 가져올 수 없습니다. 임베드 플레이어가 목록을 채웁니다.",
        items: [] as { videoId: string; title: string }[],
      },
      { status: 400 },
    );
  }

  const feedUrl = `${FEED_URL}?playlist_id=${encodeURIComponent(list)}`;

  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "notion-embed-playlist/1.0" },
    });

    if (!res.ok) {
      return Response.json(
        { error: "플레이리스트를 불러오지 못했습니다.", items: [] },
        { status: 502 },
      );
    }

    const xml = await res.text();
    const items = parseYoutubePlaylistFeedXml(xml);
    return Response.json({ items });
  } catch {
    return Response.json(
      { error: "네트워크 오류", items: [] },
      { status: 502 },
    );
  }
}
