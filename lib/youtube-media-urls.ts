/** 1×1 투명 GIF — 임베드 카드·썸네일 자리표시 */
export const YOUTUBE_EMBED_PLACEHOLDER_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export function youtubeVideoThumbnailMqUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export function youtubeVideoThumbnailHqUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
