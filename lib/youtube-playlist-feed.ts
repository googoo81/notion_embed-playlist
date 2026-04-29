/** 유튜브 Atom 피드 XML에서 항목 파싱 (Data API 키 불필요) */

export type YoutubePlaylistFeedItem = {
  videoId: string;
  title: string;
};

export function parseYoutubePlaylistFeedXml(xml: string): YoutubePlaylistFeedItem[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const items: YoutubePlaylistFeedItem[] = [];

  for (const entry of entries) {
    const videoId =
      entry.match(/<yt:videoId>([^<]*)<\/yt:videoId>/)?.[1]?.trim() ?? "";
    if (!videoId) continue;

    const titleMatch = entry.match(/<title(?:[^>]*)>([^<]*)<\/title>/);
    const title = titleMatch?.[1]?.trim().replace(/&amp;/g, "&") ?? videoId;

    items.push({ videoId, title });
  }

  return items;
}

export function isLikelyYoutubePlaylistId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{10,}$/.test(id);
}

/**
 * `feeds/videos.xml?playlist_id=` 로 목록을 가져올 수 있는지.
 * Mix·라디오(RD), 나중에 보기(WL) 등은 공개 Atom 피드가 없음.
 */
export function isYoutubeAtomPlaylistFeedSupported(listId: string): boolean {
  if (!isLikelyYoutubePlaylistId(listId)) return false;
  const u = listId.toUpperCase();
  if (u.startsWith("RD")) return false;
  if (u.startsWith("WL")) return false;
  if (u.startsWith("LL")) return false;
  return true;
}
