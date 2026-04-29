/** 같은 문서(노션 페이지)에 띄운 iframe끼리 재생 목록을 맞추기 위한 채널 접두사 */
export const EMBED_BROADCAST_PREFIX = "nep-sync:";

export type EmbedBroadcastPlayerState = {
  type: "nep-player-state";
  currentVideoId: string;
  videoIds: string[];
  title: string;
  /** 현재 영상 업로더(채널) — 대기열 두 번째 줄 */
  author?: string;
  /** 분리 iframe + iOS: 플레이어 카드 바깥 박스(스케일 적용 후) px 크기 */
  iosShellWidth?: number;
  iosShellHeight?: number;
};

export type EmbedBroadcastQueuePlay = {
  type: "nep-queue-play";
  index: number;
};

export type EmbedBroadcastMessage =
  | EmbedBroadcastPlayerState
  | EmbedBroadcastQueuePlay;

export function isValidEmbedSyncKey(raw: string | undefined): raw is string {
  if (raw == null || raw.length < 6 || raw.length > 64) return false;
  return /^[a-zA-Z0-9_-]+$/.test(raw);
}

export function broadcastChannelName(syncKey: string): string {
  return `${EMBED_BROADCAST_PREFIX}${syncKey}`;
}

/** 브라우저에서만 (홈 분리 임베드용) */
export function generateEmbedSyncKey(): string {
  const u = new Uint8Array(10);
  crypto.getRandomValues(u);
  const a = Array.from(u, (b) => b.toString(16).padStart(2, "0")).join("");
  return `s${a}`;
}
