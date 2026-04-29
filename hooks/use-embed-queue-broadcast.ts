"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  broadcastChannelName,
  isValidEmbedSyncKey,
  type EmbedBroadcastMessage,
} from "@/lib/embed-sync";
import { isYoutubeAtomPlaylistFeedSupported } from "@/lib/youtube-playlist-feed";
import type { YoutubePlaylistFeedItem } from "@/lib/youtube-playlist-feed";
import { fetchYoutubePlaylistClientJson } from "@/lib/youtube-playlist-client";
import { usePlaylistVideoMeta } from "@/hooks/use-playlist-video-meta";

export function useEmbedQueueBroadcast(playlistId: string, syncKey: string) {
  const [items, setItems] = useState<YoutubePlaylistFeedItem[]>([]);

  const [currentVideoId, setCurrentVideoId] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentAuthor, setCurrentAuthor] = useState("");
  const [peerConnected, setPeerConnected] = useState(false);
  const [shellFrame, setShellFrame] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const atomFeedSupported = isYoutubeAtomPlaylistFeedSupported(playlistId);

  const iosQueueBoundsRef = useRef<HTMLDivElement | null>(null);

  const itemsVideoKey = useMemo(
    () => items.map((x) => x.videoId).join("\n"),
    [items],
  );

  const mixItemsVideoKey =
    !atomFeedSupported && peerConnected && items.length > 0
      ? itemsVideoKey
      : "";

  const { titleById, authorById } = usePlaylistVideoMeta({
    playlistId,
    resetMetaOnPlaylistChange: true,
    items,
    atomFeedSupported,
    mixItemsVideoKey,
    mixSupplementReady: peerConnected,
    bulkMetaVideoKey:
      itemsVideoKey.trim().length > 0 ? itemsVideoKey : null,
  });

  const shellLayoutKey = useMemo(
    () =>
      [
        currentVideoId,
        playlistId,
        String(items.length),
        peerConnected ? "1" : "0",
      ].join("\u0000"),
    [currentVideoId, playlistId, items.length, peerConnected],
  );

  useEffect(() => {
    if (!isValidEmbedSyncKey(syncKey)) return;
    const ch = new BroadcastChannel(broadcastChannelName(syncKey));

    ch.onmessage = (ev: MessageEvent<unknown>) => {
      const data = ev.data as EmbedBroadcastMessage | null;
      if (!data || typeof data !== "object") return;
      if (data.type !== "nep-player-state") return;

      const st = data;
      if (
        typeof st.iosShellWidth === "number" &&
        typeof st.iosShellHeight === "number" &&
        Number.isFinite(st.iosShellWidth) &&
        Number.isFinite(st.iosShellHeight) &&
        st.iosShellWidth > 1 &&
        st.iosShellHeight > 1
      ) {
        setShellFrame({
          width: st.iosShellWidth,
          height: st.iosShellHeight,
        });
      }
      setPeerConnected(true);
      setCurrentVideoId(st.currentVideoId ?? "");
      setCurrentTitle(st.title ?? "");
      setCurrentAuthor(typeof st.author === "string" ? st.author.trim() : "");
      const ids = Array.isArray(st.videoIds) ? st.videoIds : [];
      if (ids.length > 0) {
        setItems((prev) => {
          const same =
            prev.length === ids.length &&
            prev.every((x, i) => x.videoId === ids[i]);
          if (same) return prev;
          return ids.map((videoId) => ({ videoId, title: videoId }));
        });
      }
    };

    return () => {
      ch.close();
    };
  }, [syncKey]);

  useEffect(() => {
    let cancelled = false;
    if (!atomFeedSupported) {
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      try {
        const { ok, data } = await fetchYoutubePlaylistClientJson(playlistId);
        if (cancelled) return;
        if (ok && Array.isArray(data.items) && data.items.length > 0) {
          setItems((prev) => (prev.length > 0 ? prev : data.items ?? []));
        }
      } catch {
        /* */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playlistId, atomFeedSupported]);

  const postPlayAt = useCallback(
    (index: number) => {
      if (!isValidEmbedSyncKey(syncKey)) return;
      const ch = new BroadcastChannel(broadcastChannelName(syncKey));
      ch.postMessage({
        type: "nep-queue-play",
        index,
      } satisfies EmbedBroadcastMessage);
      ch.close();
    },
    [syncKey],
  );

  return {
    atomFeedSupported,
    items,
    titleById,
    authorById,
    currentVideoId,
    currentTitle,
    currentAuthor,
    peerConnected,
    shellFrame,
    iosQueueBoundsRef,
    shellLayoutKey,
    postPlayAt,
  };
}
