"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { YouTubePlayer } from "@/types/youtube";
import type { YoutubePlaylistFeedItem } from "@/lib/youtube-playlist-feed";

type PlaylistSidePanelProps = {
  playlistId: string;
  playerRef: RefObject<YouTubePlayer | null>;
  currentVideoId: string;
  /** Mix(RD) 등 Atom 피드 미지원 목록은 플레이어 API로 채움 */
  atomFeedSupported: boolean;
  /** 현재 곡 제목 — 재생 중인 행에만 표시 */
  currentTitle: string;
  /** 좌측 플레이어 블록과 맞출 높이(px) */
  panelHeightPx?: number | null;
};

function thumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

function PlayingIndicator() {
  return (
    <span
      className="flex h-[18px] w-[18px] shrink-0 items-end justify-center gap-[2.5px] text-[#ff375f]"
      aria-hidden
    >
      <span className="playlist-side-panel__eq-bar h-3 w-[2.5px] rounded-full bg-current opacity-95" />
      <span className="playlist-side-panel__eq-bar h-3 w-[2.5px] rounded-full bg-current opacity-95" />
      <span className="playlist-side-panel__eq-bar h-3 w-[2.5px] rounded-full bg-current opacity-95" />
    </span>
  );
}

export function PlaylistSidePanel({
  playlistId,
  playerRef,
  currentVideoId,
  atomFeedSupported,
  currentTitle,
  panelHeightPx,
}: PlaylistSidePanelProps) {
  const [items, setItems] = useState<YoutubePlaylistFeedItem[]>([]);
  const [titleById, setTitleById] = useState<Record<string, string>>({});
  const titleByIdRef = useRef<Record<string, string>>({});
  titleByIdRef.current = titleById;
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const titleFetchGenRef = useRef(0);

  useEffect(() => {
    setTitleById({});
    titleFetchGenRef.current += 1;
  }, [playlistId]);

  useEffect(() => {
    if (!atomFeedSupported) return;
    let cancelled = false;
    setStatus("loading");
    setMessage("");

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

  useEffect(() => {
    if (atomFeedSupported) return;
    let cancelled = false;
    setStatus("loading");
    setMessage("");
    setItems([]);

    function scheduleTitleResolve(ids: string[]): void {
      const need = [...new Set(ids)].filter(
        (id) => !titleByIdRef.current[id],
      );
      if (need.length === 0) return;

      const gen = ++titleFetchGenRef.current;

      void (async () => {
        const PAGE = 40;
        for (let i = 0; i < need.length; i += PAGE) {
          if (cancelled || gen !== titleFetchGenRef.current) return;
          const chunk = need.slice(i, i + PAGE);
          try {
            const res = await fetch("/api/youtube-video-titles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: chunk }),
            });
            if (!res.ok || cancelled || gen !== titleFetchGenRef.current) {
              continue;
            }
            const data = (await res.json()) as {
              titles?: Record<string, string>;
            };
            if (cancelled || gen !== titleFetchGenRef.current) return;
            const t = data.titles ?? {};
            setTitleById((prev) => {
              const next = { ...prev };
              for (const [k, v] of Object.entries(t)) {
                if (v) next[k] = v;
              }
              return next;
            });
          } catch {
            /* 건너뜀 */
          }
        }
      })();
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

    tick();
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

  function playAt(index: number): void {
    const p = playerRef.current;
    if (!p?.playVideoAt) return;
    try {
      p.playVideoAt(index);
    } catch {
      /* API 미지원 브라우저 등 */
    }
  }

  const heightLocked =
    typeof panelHeightPx === "number" &&
    Number.isFinite(panelHeightPx) &&
    panelHeightPx > 0;

  return (
    <aside
      aria-label="플레이리스트"
      className={`playlist-side-panel flex min-h-0 w-[min(44vw,18rem)] shrink-0 flex-col overflow-hidden rounded-[22px] bg-black/32 text-left text-white shadow-[0_8px_32px_rgb(0_0_0/0.4)] ring-1 ring-white/[0.12] backdrop-blur-2xl backdrop-saturate-150 sm:w-[19rem] ${heightLocked ? "" : "h-full"}`}
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
        ...(heightLocked
          ? {
              height: panelHeightPx,
              maxHeight: "100%",
            }
          : {}),
      }}
    >
      {/* iOS Music 스타일 헤더 — 소형 섹션 타이틀 */}
      <header className="shrink-0 px-4 pb-1.5 pt-4">
        <h2 className="text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-white/45">
          재생 대기열
        </h2>
        <p
          className="mt-1.5 truncate font-mono text-[10px] leading-none tracking-wide text-white/32"
          title={playlistId}
        >
          {playlistId}
        </p>
      </header>

      <div
        className="playlist-side-panel__scroll scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-3 pt-1"
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
              const resolved = titleById[item.videoId];
              const rowTitle = atomFeedSupported
                ? item.title
                : active && currentTitle.trim()
                  ? currentTitle
                  : resolved || `영상 ${index + 1}`;
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
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-[7px] bg-zinc-900 shadow-inner shadow-black/30 ring-1 ring-white/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbUrl(item.videoId)}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </span>
                    <span className="min-w-0 flex-1 py-0.5 pr-1">
                      <span
                        className={`line-clamp-2 text-[15px] leading-[1.25] tracking-[-0.01em] ${
                          active
                            ? "font-semibold text-white"
                            : "font-medium text-white/88"
                        }`}
                      >
                        {rowTitle}
                      </span>
                    </span>
                    <span className="flex w-7 shrink-0 justify-center">
                      {active ? (
                        <PlayingIndicator />
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
    </aside>
  );
}
