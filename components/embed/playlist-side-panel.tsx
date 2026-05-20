"use client";

import type { RefObject } from "react";
import type { YouTubePlayer } from "@/types/youtube";
import { IOS_UNIFORM_DESIGN_WIDTH_PX } from "@/components/embed/ios-uniform-scale-shell";
import { PlaylistPlayingIndicator } from "@/components/embed/playlist-playing-indicator";
import { resolvePlaylistQueueRowLabels } from "@/lib/playlist-queue-row-labels";
import {
  YOUTUBE_EMBED_PLACEHOLDER_PIXEL,
  youtubeVideoThumbnailMqUrl,
} from "@/lib/youtube-media-urls";
import { useIosQueuePanelMetrics } from "@/hooks/use-ios-queue-panel-metrics";
import { usePlaylistSidePanelData } from "@/hooks/use-playlist-side-panel-data";

type PlaylistSidePanelProps = {
  playlistId: string;
  playerRef: RefObject<YouTubePlayer | null>;
  currentVideoId: string;
  atomFeedSupported: boolean;
  currentTitle: string;
  currentAuthor: string;
  panelFramePx?: { width: number; height: number } | null;
};

export function PlaylistSidePanel({
  playlistId,
  playerRef,
  currentVideoId,
  atomFeedSupported,
  currentTitle,
  currentAuthor,
  panelFramePx,
}: PlaylistSidePanelProps) {
  const { items, status, message, titleById, authorById } =
    usePlaylistSidePanelData(playlistId, atomFeedSupported, playerRef);

  const frameLocked =
    panelFramePx != null &&
    Number.isFinite(panelFramePx.width) &&
    Number.isFinite(panelFramePx.height) &&
    panelFramePx.width > 0 &&
    panelFramePx.height > 0;

  const {
    scale: iosQueueScale,
    designViewportHeightPx: iosQueueDesignViewportHeightPx,
  } = useIosQueuePanelMetrics(frameLocked, panelFramePx ?? null);

  const iosCardBgSrc = currentVideoId.trim()
    ? youtubeVideoThumbnailMqUrl(currentVideoId)
    : YOUTUBE_EMBED_PLACEHOLDER_PIXEL;
  const iosCardHasThumb = Boolean(currentVideoId.trim());

  function playAt(index: number): void {
    const p = playerRef.current;
    if (!p?.playVideoAt) return;
    try {
      p.playVideoAt(index);
    } catch {
      /* API 미지원 브라우저 등 */
    }
  }

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
            const { title: rowTitle, author: rowAuthor } =
              resolvePlaylistQueueRowLabels(
                item,
                index,
                active,
                atomFeedSupported,
                currentTitle,
                currentAuthor,
                titleById,
                authorById,
                "panel",
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
                      src={youtubeVideoThumbnailMqUrl(item.videoId)}
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
          ? "relative flex min-h-0 shrink-0 flex-col overflow-hidden text-left text-white ring-1 ring-white/10"
          : "playlist-side-panel flex h-full min-h-0 w-[clamp(12rem,42vw,22rem)] shrink-0 flex-col overflow-hidden rounded-[22px] bg-black/32 text-left text-white ring-1 ring-white/[0.12] backdrop-blur-2xl backdrop-saturate-150 sm:w-[clamp(13rem,36vw,22rem)]"
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
              borderRadius: 44 * iosQueueScale,
            }
          : {}),
      }}
    >
      {frameLocked ? (
        <div
          className="origin-top-left will-change-transform"
          style={{
            width: IOS_UNIFORM_DESIGN_WIDTH_PX,
            height: iosQueueDesignViewportHeightPx,
            transform: `scale(${iosQueueScale})`,
          }}
        >
          <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
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
          </div>
        </div>
      ) : (
        <>
          {headerEl}
          {scrollEl}
        </>
      )}
    </aside>
  );
}
