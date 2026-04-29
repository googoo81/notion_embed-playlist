import type { YoutubePlaylistFeedItem } from "@/lib/youtube-playlist-feed";

/** 통합 패널: `item.title` 없이 `titleById`만 보강 / 분리 대기열: Mix 시 `item.title` 폴백 */
export type PlaylistQueueRowLabelMode = "panel" | "queue";

export function resolvePlaylistQueueRowLabels(
  item: YoutubePlaylistFeedItem,
  index: number,
  active: boolean,
  atomFeedSupported: boolean,
  currentTitle: string,
  currentAuthor: string,
  titleById: Record<string, string>,
  authorById: Record<string, string>,
  mode: PlaylistQueueRowLabelMode,
): { title: string; author: string } {
  const resolved = titleById[item.videoId];
  const title = atomFeedSupported
    ? item.title
    : active && currentTitle.trim()
      ? currentTitle
      : mode === "queue"
        ? resolved || item.title || `영상 ${index + 1}`
        : resolved || `영상 ${index + 1}`;

  const author = atomFeedSupported
    ? active && currentAuthor.trim()
      ? currentAuthor
      : item.author?.trim() || authorById[item.videoId] || ""
    : active && currentAuthor.trim()
      ? currentAuthor
      : authorById[item.videoId] || "";

  return { title, author };
}
