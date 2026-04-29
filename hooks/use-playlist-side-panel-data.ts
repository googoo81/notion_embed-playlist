"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import type { YouTubePlayer } from "@/types/youtube";
import type { YoutubePlaylistFeedItem } from "@/lib/youtube-playlist-feed";
import {
  batchFetchYoutubeVideoMeta,
  runAfterCommit,
} from "@/lib/youtube-video-meta-batch";
import { fetchYoutubePlaylistClientJson } from "@/lib/youtube-playlist-client";
import { usePlaylistVideoMeta } from "@/hooks/use-playlist-video-meta";

export function usePlaylistSidePanelData(
  playlistId: string,
  atomFeedSupported: boolean,
  playerRef: RefObject<YouTubePlayer | null>,
) {
  const [items, setItems] = useState<YoutubePlaylistFeedItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const itemsVideoKey = useMemo(
    () => items.map((x) => x.videoId).join("\n"),
    [items],
  );

  const mixItemsVideoKey =
    !atomFeedSupported && status === "ok" && items.length > 0
      ? itemsVideoKey
      : "";

  const {
    titleById,
    authorById,
    setTitleById,
    setAuthorById,
    titleFetchGenRef,
    titleByIdRef,
    authorByIdRef,
  } = usePlaylistVideoMeta({
    playlistId,
    resetMetaOnPlaylistChange: false,
    items,
    atomFeedSupported,
    mixItemsVideoKey,
    mixSupplementReady: status === "ok",
    bulkMetaVideoKey: null,
  });

  useEffect(() => {
    if (!atomFeedSupported) return;
    let cancelled = false;
    runAfterCommit(() => {
      if (cancelled) return;
      setStatus("loading");
      setMessage("");
    });

    void (async () => {
      try {
        const { ok, data } = await fetchYoutubePlaylistClientJson(playlistId);
        if (cancelled) return;
        if (!ok) {
          setStatus("error");
          setMessage(data.error ?? "목록을 불러오지 못했습니다.");
          setItems([]);
          return;
        }
        setItems(Array.isArray(data.items) ? data.items : []);
        setStatus("ok");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage("네트워크 오류");
        setItems([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playlistId, atomFeedSupported]);

  const itemsVideoKeyAtom = atomFeedSupported ? itemsVideoKey : "";

  useEffect(() => {
    if (!atomFeedSupported || !itemsVideoKeyAtom || status !== "ok") return;

    const needIds = [
      ...new Set(
        items
          .filter((i) => !i.author?.trim())
          .map((i) => i.videoId)
          .filter((id) => !authorByIdRef.current[id]),
      ),
    ];
    if (needIds.length === 0) return;

    let cancelled = false;
    const gen = titleFetchGenRef.current;

    void batchFetchYoutubeVideoMeta(needIds, {
      cancelled: () => cancelled,
      gen,
      genRef: titleFetchGenRef,
      includeTitles: false,
      setTitleById: null,
      setAuthorById,
    });

    return () => {
      cancelled = true;
    };
  }, [atomFeedSupported, itemsVideoKeyAtom, status]);

  useEffect(() => {
    if (atomFeedSupported) return;
    let cancelled = false;

    function scheduleTitleResolve(ids: string[]): void {
      const need = [...new Set(ids)].filter((id) => {
        const hasTitle = Boolean(titleByIdRef.current[id]?.trim());
        const hasAuthor = Boolean(authorByIdRef.current[id]?.trim());
        return !hasTitle || !hasAuthor;
      });
      if (need.length === 0) return;

      const gen = ++titleFetchGenRef.current;

      void batchFetchYoutubeVideoMeta(need, {
        cancelled: () => cancelled,
        gen,
        genRef: titleFetchGenRef,
        includeTitles: true,
        setTitleById,
        setAuthorById,
      });
    }

    const applyIds = (ids: string[]): void => {
      if (cancelled) return;
      let listChanged = false;
      setItems((prev) => {
        const same =
          prev.length === ids.length &&
          prev.every((x, i) => x.videoId === ids[i]);
        if (same) return prev;
        listChanged = true;
        return ids.map((videoId) => ({ videoId, title: videoId }));
      });
      setStatus("ok");
      if (listChanged) scheduleTitleResolve(ids);
    };

    const tick = (): void => {
      const ids = playerRef.current?.getPlaylist?.();
      if (Array.isArray(ids) && ids.length > 0) applyIds(ids);
    };

    runAfterCommit(() => {
      if (cancelled) return;
      setStatus("loading");
      setMessage("");
      setItems([]);
      tick();
    });

    const intervalId = window.setInterval(tick, 700);

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setStatus((s) => {
        if (s !== "ok") {
          setMessage(
            "재생 목록을 플레이어에서 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
          return "error";
        }
        return s;
      });
    }, 20000);

    return () => {
      cancelled = true;
      titleFetchGenRef.current += 1;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [atomFeedSupported, playlistId, playerRef]);

  return {
    items,
    status,
    message,
    titleById,
    authorById,
  };
}
