"use client";

import {
  IOS_UNIFORM_DESIGN_WIDTH_PX,
  IosUniformScaleShell,
} from "@/components/embed/ios-uniform-scale-shell";
import { PlaylistPlayingIndicator } from "@/components/embed/playlist-playing-indicator";
import type { EmbedPlayerUi } from "@/lib/embed-ui";
import { resolvePlaylistQueueRowLabels } from "@/lib/playlist-queue-row-labels";
import {
  YOUTUBE_EMBED_PLACEHOLDER_PIXEL,
  youtubeVideoThumbnailMqUrl,
} from "@/lib/youtube-media-urls";
import { useEmbedQueueBroadcast } from "@/hooks/use-embed-queue-broadcast";
import { useIosQueuePanelMetrics } from "@/hooks/use-ios-queue-panel-metrics";

/** 분리 대기열 폴백 카드: 플레이어 쉘 동기화 전까지 디자인 최대 높이 */
const IOS_QUEUE_FALLBACK_MAX_HEIGHT_PX = 540;

type EmbedQueueFrameProps = {
  playlistId: string;
  syncKey: string;
  embedUi?: EmbedPlayerUi;
};

export function EmbedQueueFrame({
  playlistId,
  syncKey,
  embedUi = "classic",
}: EmbedQueueFrameProps) {
  const {
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
  } = useEmbedQueueBroadcast(playlistId, syncKey);

  const iosCardBgSrc = currentVideoId.trim()
    ? youtubeVideoThumbnailMqUrl(currentVideoId)
    : YOUTUBE_EMBED_PLACEHOLDER_PIXEL;
  const iosCardHasThumb = Boolean(currentVideoId.trim());

  const frameLockedIos =
    embedUi === "ios" &&
    shellFrame != null &&
    Number.isFinite(shellFrame.width) &&
    Number.isFinite(shellFrame.height) &&
    shellFrame.width > 0 &&
    shellFrame.height > 0;

  const { scale: iosQueueLockedScale, designViewportHeightPx: iosQueueLockedDesignHeightPx } =
    useIosQueuePanelMetrics(frameLockedIos, shellFrame);
  const iosPaddingHeader = frameLockedIos || embedUi === "ios";
  const iosScrollPadding = embedUi === "ios";

  const headerEl = (
    <header
      className={
        iosPaddingHeader ? "shrink-0 pb-2 pt-0" : "shrink-0 px-4 pb-1.5 pt-4"
      }
    >
      <h2 className="ml-1 text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-white/45">
        재생 대기열
      </h2>
    </header>
  );

  const listBody =
    !peerConnected && items.length === 0 ? (
      <div className="px-3 py-8 text-center text-[13px] leading-relaxed text-white/50">
        같은 페이지에 둔{" "}
        <span className="font-mono text-white/70">플레이어 iframe</span>과
        연결되는 중입니다…
        <p className="mt-2 text-[11px] text-white/35">
          두 iframe의 <span className="font-mono">sync</span> 값이 같아야
          합니다.
        </p>
      </div>
    ) : null;

  const listItems =
    items.length > 0 ? (
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
              "queue",
            );
          return (
            <li key={`${item.videoId}-${index}`}>
              <button
                type="button"
                onClick={() => postPlayAt(index)}
                className={`flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left transition-[background-color,transform] duration-150 ease-out active:scale-[0.985] ${
                  active
                    ? "bg-white/14 ring-1 ring-white/10"
                    : "hover:bg-white/7 active:bg-white/10"
                }`}
              >
                <span className="relative size-11 shrink-0 overflow-hidden rounded-[7px] bg-zinc-900 ring-1 ring-white/8">
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
    ) : null;

  const listEmptyConnected =
    peerConnected && items.length === 0 ? (
      <div className="px-3 py-4 text-center text-[13px] text-white/45">
        재생 목록이 비었습니다.
      </div>
    ) : null;

  const scrollEl = (
    <div
      className={
        iosScrollPadding
          ? "playlist-side-panel__scroll scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain px-0 pb-2 pt-1"
          : "playlist-side-panel__scroll scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-3 pt-1"
      }
      style={{ scrollbarWidth: "none" }}
    >
      {listBody}
      {listItems}
      {listEmptyConnected}
    </div>
  );

  const iosCardLayers = (
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
  );

  if (embedUi === "ios") {
    return (
      <div
        ref={iosQueueBoundsRef}
        className="flex h-full min-h-0 w-full min-w-0 items-center justify-center bg-transparent"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
        }}
      >
        {frameLockedIos && shellFrame ? (
          <aside
            aria-label="플레이리스트"
            className="relative flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden text-left text-white ring-1 ring-white/10"
            style={{
              width: shellFrame.width,
              height: shellFrame.height,
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: 44 * iosQueueLockedScale,
            }}
          >
            <div
              className="origin-top-left will-change-transform"
              style={{
                width: IOS_UNIFORM_DESIGN_WIDTH_PX,
                height: iosQueueLockedDesignHeightPx,
                transform: `scale(${iosQueueLockedScale})`,
              }}
            >
              <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
                {iosCardLayers}
              </div>
            </div>
          </aside>
        ) : (
          <IosUniformScaleShell
            layoutKey={shellLayoutKey}
            boundsRef={iosQueueBoundsRef}
          >
            <div
              className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-[44px] ring-1 ring-white/10"
              style={{
                height: `min(100%, ${IOS_QUEUE_FALLBACK_MAX_HEIGHT_PX}px, calc(100dvh - 2rem))`,
                maxHeight: `min(100%, ${IOS_QUEUE_FALLBACK_MAX_HEIGHT_PX}px, calc(100dvh - 2rem))`,
              }}
            >
              {iosCardLayers}
            </div>
          </IosUniformScaleShell>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 w-full items-stretch justify-stretch bg-transparent"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      }}
    >
      <aside
        aria-label="플레이리스트"
        className="playlist-side-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[22px] bg-black/32 text-left text-white ring-1 ring-white/12 backdrop-blur-2xl backdrop-saturate-150"
      >
        {headerEl}
        {scrollEl}
      </aside>
    </div>
  );
}
