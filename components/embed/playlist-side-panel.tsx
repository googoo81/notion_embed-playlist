"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { YouTubePlayer } from "@/types/youtube";
import type { YoutubePlaylistFeedItem } from "@/lib/youtube-playlist-feed";
import {
  batchFetchYoutubeVideoMeta,
  runAfterCommit,
} from "@/lib/youtube-video-meta-batch";
import { PlaylistPlayingIndicator } from "@/components/embed/playlist-playing-indicator";

type PlaylistSidePanelProps = {
  playlistId: string;
  playerRef: RefObject<YouTubePlayer | null>;
  currentVideoId: string;
  /** Mix(RD) 등 Atom 피드 미지원 목록은 플레이어 API로 채움 */
  atomFeedSupported: boolean;
  /** 현재 곡 제목 — 재생 중인 행에만 표시 */
  currentTitle: string;
  /** 현재 곡 채널(업로더) — 재생 중인 행에 우선 표시 */
  currentAuthor: string;
  /** 플레이어 블록과 같은 표시 크기(px) — iOS는 스케일 박스와 동일 */
  panelFramePx?: { width: number; height: number } | null;
};

function thumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

/** iOS 플레이어 카드와 동일 — 재생 중 썸네일 없을 때 */
const IOS_CARD_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function playlistRowCopy(
  item: YoutubePlaylistFeedItem,
  index: number,
  active: boolean,
  atomFeedSupported: boolean,
  currentTitle: string,
  currentAuthor: string,
  titleById: Record<string, string>,
  authorById: Record<string, string>,
): { title: string; author: string } {
  const title = atomFeedSupported
    ? item.title
    : active && currentTitle.trim()
      ? currentTitle
      : titleById[item.videoId] || `영상 ${index + 1}`;
  const author = atomFeedSupported
    ? active && currentAuthor.trim()
      ? currentAuthor
      : item.author?.trim() || authorById[item.videoId] || ""
    : active && currentAuthor.trim()
      ? currentAuthor
      : authorById[item.videoId] || "";
  return { title, author };
}

export function PlaylistSidePanel({
  playlistId,
  playerRef,
  currentVideoId,
  atomFeedSupported,
  currentTitle,
  currentAuthor,
  panelFramePx,
}: PlaylistSidePanelProps) {
  const [items, setItems] = useState<YoutubePlaylistFeedItem[]>([]);
  const [titleById, setTitleById] = useState<Record<string, string>>({});
  const titleByIdRef = useRef<Record<string, string>>({});
  const [authorById, setAuthorById] = useState<Record<string, string>>({});
  const authorByIdRef = useRef<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const titleFetchGenRef = useRef(0);
  const itemsRef = useRef<YoutubePlaylistFeedItem[]>([]);

  useLayoutEffect(() => {
    titleByIdRef.current = titleById;
    authorByIdRef.current = authorById;
    itemsRef.current = items;
  }, [titleById, authorById, items]);

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
        const res = await fetch(
          `/api/youtube-playlist?list=${encodeURIComponent(playlistId)}`,
        );
        const data = (await res.json()) as {
          items?: YoutubePlaylistFeedItem[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
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

  const itemsVideoKeyAtom = atomFeedSupported
    ? items.map((x) => x.videoId).join("\n")
    : "";

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
  }, [atomFeedSupported, playlistId]);

  /** Mix(RD) 등: 제목만 있고 oEmbed의 채널이 비는 경우 재요청 */
  const itemsVideoKeyMix =
    !atomFeedSupported && status === "ok" && items.length > 0
      ? items.map((x) => x.videoId).join("\n")
      : "";

  const mixAuthorEffectKeyPanel = [
    atomFeedSupported ? "1" : "0",
    status === "ok" ? "1" : "0",
    itemsVideoKeyMix,
  ].join("\u0001");

  useEffect(() => {
    if (atomFeedSupported || status !== "ok" || !itemsVideoKeyMix) return;

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
  }, [mixAuthorEffectKeyPanel]);

  function playAt(index: number): void {
    const p = playerRef.current;
    if (!p?.playVideoAt) return;
    try {
      p.playVideoAt(index);
    } catch {
      /* API 미지원 브라우저 등 */
    }
  }

  const frameLocked =
    panelFramePx != null &&
    Number.isFinite(panelFramePx.width) &&
    Number.isFinite(panelFramePx.height) &&
    panelFramePx.width > 0 &&
    panelFramePx.height > 0;

  const iosCardBgSrc = currentVideoId.trim()
    ? thumbUrl(currentVideoId)
    : IOS_CARD_PLACEHOLDER;
  const iosCardHasThumb = Boolean(currentVideoId.trim());

  const headerEl = (
    <header
      className={
        frameLocked ? "shrink-0 pb-2 pt-0" : "shrink-0 px-4 pb-1.5 pt-4"
      }
    >
      <h2 className="ml-1 text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-white/45">
        재생 대기열
      </h2>
    </header>
  );

  const scrollEl = (
    <div
      className={
        frameLocked
          ? "playlist-side-panel__scroll scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain px-0 pb-2 pt-1"
          : "playlist-side-panel__scroll scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-3 pt-1"
      }
      style={{ scrollbarWidth: "none" }}
    >
      {status === "loading" ? (
        <div className="space-y-2 px-0.5 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="flex items-center gap-3 rounded-[11px] px-2 py-2"
            >
              <div className="size-11 shrink-0 animate-pulse rounded-[7px] bg-white/10" />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-0.5">
                <div className="h-3.5 w-full animate-pulse rounded-md bg-white/10" />
                <div className="h-3 w-4/5 animate-pulse rounded-md bg-white/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mx-0.5 rounded-[14px] bg-white/[0.07] px-3 py-3 text-[13px] leading-snug text-white/65">
          {message}
        </div>
      ) : null}

      {status === "ok" && items.length === 0 ? (
        <div className="px-3 py-4 text-center text-[13px] text-white/45">
          항목이 없습니다.
        </div>
      ) : null}

      {status === "ok" && items.length > 0 ? (
        <ul className="flex flex-col gap-0.5" role="list">
          {items.map((item, index) => {
            const active = item.videoId === currentVideoId;
            const { title: rowTitle, author: rowAuthor } = playlistRowCopy(
              item,
              index,
              active,
              atomFeedSupported,
              currentTitle,
              currentAuthor,
              titleById,
              authorById,
            );
            return (
              <li key={`${item.videoId}-${index}`}>
                <button
                  type="button"
                  onClick={() => playAt(index)}
                  className={`flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left transition-[background-color,transform] duration-150 ease-out active:scale-[0.985] ${
                    active
                      ? "bg-white/[0.14] ring-1 ring-white/10"
                      : "hover:bg-white/[0.07] active:bg-white/[0.1]"
                  }`}
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-[7px] bg-zinc-900 ring-1 ring-white/[0.08]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(item.videoId)}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col justify-center py-0.5 pr-1">
                    <span
                      className={`block truncate text-[15px] leading-tight tracking-[-0.01em] ${
                        active
                          ? "font-semibold text-white"
                          : "font-medium text-white/88"
                      }`}
                      title={rowTitle}
                    >
                      {rowTitle}
                    </span>
                    {rowAuthor ? (
                      <span
                        className="mt-0.5 block truncate text-[12px] font-medium leading-tight text-white/50"
                        title={rowAuthor}
                      >
                        {rowAuthor}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex w-7 shrink-0 justify-center">
                    {active ? (
                      <PlaylistPlayingIndicator />
                    ) : (
                      <span className="text-[12px] font-medium tabular-nums text-white/28">
                        {index + 1}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );

  return (
    <aside
      aria-label="플레이리스트"
      className={
        frameLocked
          ? "relative flex min-h-0 shrink-0 flex-col overflow-hidden rounded-[44px] text-left text-white ring-1 ring-white/10"
          : "playlist-side-panel flex h-full min-h-0 w-[min(44vw,18rem)] shrink-0 flex-col overflow-hidden rounded-[22px] bg-black/32 text-left text-white ring-1 ring-white/[0.12] backdrop-blur-2xl backdrop-saturate-150 sm:w-[19rem]"
      }
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
        ...(frameLocked && panelFramePx
          ? {
              width: panelFramePx.width,
              height: panelFramePx.height,
              maxWidth: "100%",
              maxHeight: "100%",
            }
          : {}),
      }}
    >
      {frameLocked ? (
        <>
          <div
            aria-hidden
            className="absolute inset-0 scale-125 bg-cover bg-center blur-3xl saturate-125"
            style={{ backgroundImage: `url(${iosCardBgSrc})` }}
          />
          <div
            aria-hidden
            className={
              iosCardHasThumb
                ? "absolute inset-0 bg-black/45"
                : "absolute inset-0 bg-[#6d6d70]"
            }
          />
          <div className="player-layout-ios__inner relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
            {headerEl}
            {scrollEl}
          </div>
        </>
      ) : (
        <>
          {headerEl}
          {scrollEl}
        </>
      )}
    </aside>
  );
}
