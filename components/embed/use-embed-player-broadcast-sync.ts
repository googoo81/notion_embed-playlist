"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { EmbedPlayerUi } from "@/lib/embed-ui";
import type { YouTubePlayer } from "@/types/youtube";
import {
  broadcastChannelName,
  isValidEmbedSyncKey,
  type EmbedBroadcastMessage,
  type EmbedBroadcastQueuePlay,
} from "@/lib/embed-sync";

/**
 * 분리 임베드(재생 대기열 iframe)와 동기화: 주기적으로 재생 상태 브로드캐스트,
 * 대기열에서 보낸 `playVideoAt` 반영.
 */
export function useEmbedPlayerBroadcastSync(
  syncKey: string | undefined,
  playerRef: RefObject<YouTubePlayer | null>,
  meta: {
    title: string;
    author: string;
    currentVideoId: string;
    embedUi?: EmbedPlayerUi;
    iosShellOuterRef?: RefObject<HTMLDivElement | null>;
  },
): void {
  const metaRef = useRef(meta);
  metaRef.current = meta;

  useEffect(() => {
    if (!syncKey || !isValidEmbedSyncKey(syncKey)) return;

    const ch = new BroadcastChannel(broadcastChannelName(syncKey));

    const publish = (): void => {
      const player = playerRef.current;
      const ids = player?.getPlaylist?.() ?? [];
      const m = metaRef.current;
      let iosShellWidth: number | undefined;
      let iosShellHeight: number | undefined;
      if (
        m.embedUi === "ios" &&
        m.iosShellOuterRef?.current &&
        typeof m.iosShellOuterRef.current.getBoundingClientRect === "function"
      ) {
        const r = m.iosShellOuterRef.current.getBoundingClientRect();
        if (r.width > 1 && r.height > 1) {
          iosShellWidth = r.width;
          iosShellHeight = r.height;
        }
      }
      const msg: EmbedBroadcastMessage = {
        type: "nep-player-state",
        currentVideoId: m.currentVideoId,
        videoIds: Array.isArray(ids) ? ids : [],
        title: m.title,
        ...(m.author.trim() ? { author: m.author.trim() } : {}),
        ...(iosShellWidth != null && iosShellHeight != null
          ? { iosShellWidth, iosShellHeight }
          : {}),
      };
      ch.postMessage(msg);
    };

    publish();
    const intervalId = window.setInterval(publish, 450);

    ch.onmessage = (ev: MessageEvent<unknown>) => {
      const d = ev.data as EmbedBroadcastQueuePlay | null;
      if (d?.type === "nep-queue-play" && typeof d.index === "number") {
        try {
          playerRef.current?.playVideoAt?.(d.index);
        } catch {
          /* */
        }
      }
    };

    return () => {
      window.clearInterval(intervalId);
      ch.close();
    };
  }, [syncKey, playerRef]);
}
