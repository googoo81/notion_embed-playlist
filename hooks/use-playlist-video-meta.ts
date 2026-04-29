"use client";

import { useEffect, useRef, useState } from "react";
import type { YoutubePlaylistFeedItem } from "@/lib/youtube-playlist-feed";
import { batchFetchYoutubeVideoMeta } from "@/lib/youtube-video-meta-batch";
import { useLatestRef } from "@/hooks/use-latest-ref";

type UsePlaylistVideoMetaOptions = {
  playlistId: string;
  /** `playlistId` 변경 시 title/author 맵 초기화 + fetch 세대 무효화 (분리 대기열) */
  resetMetaOnPlaylistChange: boolean;
  items: YoutubePlaylistFeedItem[];
  atomFeedSupported: boolean;
  /**
   * Mix 구간: 이미 게이트를 반영한 id 키 (`join("\\n")`) 또는 `""`.
   * 대기열: `!atom && peerConnected && items.length` 일 때만 채움.
   */
  mixItemsVideoKey: string;
  /** Mix 채널 보강 허용 (대기열: `peerConnected`, 패널: `status === "ok"`) */
  mixSupplementReady: boolean;
  /**
   * 전체 id에 대해 빠진 title·author 배치 요청 (`++gen`).
   * `null`이면 비활성 (통합 패널 — Atom/Mix는 별도 경로).
   */
  bulkMetaVideoKey: string | null;
};

/**
 * 플레이리스트 행에 대한 YouTube 비디오별 제목·채널 맵 + 배치 API 이펙트.
 * 분리 대기열(`useEmbedQueueBroadcast`)과 통합 패널(`usePlaylistSidePanelData`)이 동일 로직 공유.
 */
export function usePlaylistVideoMeta({
  playlistId,
  resetMetaOnPlaylistChange,
  items,
  atomFeedSupported,
  mixItemsVideoKey,
  mixSupplementReady,
  bulkMetaVideoKey,
}: UsePlaylistVideoMetaOptions) {
  const [titleById, setTitleById] = useState<Record<string, string>>({});
  const [authorById, setAuthorById] = useState<Record<string, string>>({});
  const titleFetchGenRef = useRef(0);

  const itemsRef = useLatestRef(items);
  const titleByIdRef = useLatestRef(titleById);
  const authorByIdRef = useLatestRef(authorById);

  useEffect(() => {
    if (!resetMetaOnPlaylistChange) return;
    void Promise.resolve().then(() => {
      setTitleById({});
      setAuthorById({});
      titleFetchGenRef.current += 1;
    });
  }, [playlistId, resetMetaOnPlaylistChange]);

  useEffect(() => {
    if (bulkMetaVideoKey == null || !bulkMetaVideoKey.trim()) return;
    const uniqueIds = [...new Set(bulkMetaVideoKey.split("\n"))];
    const need = uniqueIds.filter((id) => {
      const hasTitle = Boolean(titleByIdRef.current[id]?.trim());
      const hasAuthor = Boolean(authorByIdRef.current[id]?.trim());
      return !hasTitle || !hasAuthor;
    });
    if (need.length === 0) return;

    let cancelled = false;
    const gen = ++titleFetchGenRef.current;
    void batchFetchYoutubeVideoMeta(need, {
      cancelled: () => cancelled,
      gen,
      genRef: titleFetchGenRef,
      includeTitles: true,
      setTitleById,
      setAuthorById,
    });
    return () => {
      cancelled = true;
    };
  }, [bulkMetaVideoKey]);

  const mixAuthorEffectKey = [
    atomFeedSupported ? "1" : "0",
    mixSupplementReady ? "1" : "0",
    mixItemsVideoKey,
  ].join("\u0001");

  useEffect(() => {
    if (atomFeedSupported || !mixSupplementReady || !mixItemsVideoKey) return;

    const needIds = [
      ...new Set(
        itemsRef.current
          .map((i) => i.videoId)
          .filter((id) => !authorByIdRef.current[id]?.trim()),
      ),
    ];
    if (needIds.length === 0) return;

    let cancelled = false;
    const gen = titleFetchGenRef.current;

    void batchFetchYoutubeVideoMeta(needIds, {
      cancelled: () => cancelled,
      gen,
      genRef: titleFetchGenRef,
      includeTitles: true,
      setTitleById,
      setAuthorById,
    });

    return () => {
      cancelled = true;
    };
  }, [mixAuthorEffectKey]);

  return {
    titleById,
    authorById,
    setTitleById,
    setAuthorById,
    titleFetchGenRef,
    itemsRef,
    titleByIdRef,
    authorByIdRef,
  };
}
