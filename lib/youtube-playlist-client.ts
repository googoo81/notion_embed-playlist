import type { YoutubePlaylistFeedItem } from "@/lib/youtube-playlist-feed";

export type YoutubePlaylistClientJson = {
  items?: YoutubePlaylistFeedItem[];
  error?: string;
};

export function youtubePlaylistApiPath(playlistId: string): string {
  const q = new URLSearchParams({ list: playlistId }).toString();
  return `/api/youtube-playlist?${q}`;
}

export async function fetchYoutubePlaylistClientJson(
  playlistId: string,
): Promise<{ ok: boolean; data: YoutubePlaylistClientJson }> {
  const res = await fetch(youtubePlaylistApiPath(playlistId));
  const data = (await res.json()) as YoutubePlaylistClientJson;
  return { ok: res.ok, data };
}
