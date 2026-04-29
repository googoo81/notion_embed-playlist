"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IosUniformScaleShell } from "@/components/embed/ios-uniform-scale-shell";
import { PlaylistPlayingIndicator } from "@/components/embed/playlist-playing-indicator";
import type { EmbedPlayerUi } from "@/lib/embed-ui";
import {
  broadcastChannelName,
  isValidEmbedSyncKey,
  type EmbedBroadcastMessage,
} from "@/lib/embed-sync";
import { isYoutubeAtomPlaylistFeedSupported } from "@/lib/youtube-playlist-feed";
import type { YoutubePlaylistFeedItem } from "@/lib/youtube-playlist-feed";
import { batchFetchYoutubeVideoMeta } from "@/lib/youtube-video-meta-batch";

function thumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

/** iOS 플레이어 카드와 동일 — 재생 중 썸네일 없을 때 */
const IOS_CARD_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

/** 플레이어 로드 전 iOS 분리 대기열: 스케일 기준 디자인 높이(px) */
const IOS_QUEUE_FALLBACK_CARD_HEIGHT_PX = 540;

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
  const [items, setItems] = useState<YoutubePlaylistFeedItem[]>([]);
  const [titleById, setTitleById] = useState<Record<string, string>>({});
  const titleByIdRef = useRef<Record<string, string>>({});
  const [authorById, setAuthorById] = useState<Record<string, string>>({});
  const authorByIdRef = useRef<Record<string, string>>({});

  const [currentVideoId, setCurrentVideoId] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentAuthor, setCurrentAuthor] = useState("");
  const [peerConnected, setPeerConnected] = useState(false);
  const [shellFrame, setShellFrame] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const titleFetchGenRef = useRef(0);
  const atomFeedSupported = isYoutubeAtomPlaylistFeedSupported(playlistId);
  const itemsRef = useRef<YoutubePlaylistFeedItem[]>([]);

  useLayoutEffect(() => {
    titleByIdRef.current = titleById;
    authorByIdRef.current = authorById;
    itemsRef.current = items;
  }, [titleById, authorById, items]);

  const iosCardBgSrc = currentVideoId.trim()
    ? thumbUrl(currentVideoId)
    : IOS_CARD_PLACEHOLDER;
  const iosCardHasThumb = Boolean(currentVideoId.trim());

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
    void Promise.resolve().then(() => {
      setTitleById({});
      setAuthorById({});
      titleFetchGenRef.current += 1;
    });
  }, [playlistId]);

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
    if (atomFeedSupported) {
      void (async () => {
        try {
          const res = await fetch(
            `/api/youtube-playlist?list=${encodeURIComponent(playlistId)}`,
          );
          const data = (await res.json()) as {
            items?: YoutubePlaylistFeedItem[];
          };
          if (cancelled) return;
          if (res.ok && Array.isArray(data.items) && data.items.length > 0) {
            setItems((prev) => (prev.length > 0 ? prev : (data.items ?? [])));
          }
        } catch {
          /* */
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [playlistId, atomFeedSupported]);

  const itemsVideoKey = items.map((x) => x.videoId).join("\n");

  const itemsVideoKeyMix =
    !atomFeedSupported && peerConnected && items.length > 0
      ? itemsVideoKey
      : "";

  useEffect(() => {
    if (!itemsVideoKey) return;
    const uniqueIds = [...new Set(itemsVideoKey.split("\n"))];
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
  }, [itemsVideoKey]);

  /** Mix: 플레이어 목록만 있을 때 채널만 비는 경우 보강 — deps는 항상 길이 1(문자열)만 사용 */
  const mixAuthorEffectKey = [
    atomFeedSupported ? "1" : "0",
    peerConnected ? "1" : "0",
    itemsVideoKeyMix,
  ].join("\u0001");

  useEffect(() => {
    if (atomFeedSupported || !peerConnected || !itemsVideoKeyMix) return;

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

  const frameLockedIos =
    embedUi === "ios" &&
    shellFrame != null &&
    Number.isFinite(shellFrame.width) &&
    Number.isFinite(shellFrame.height) &&
    shellFrame.width > 0 &&
    shellFrame.height > 0;

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
          const resolved = titleById[item.videoId];
          const rowTitle = atomFeedSupported
            ? item.title
            : active && currentTitle.trim()
              ? currentTitle
              : resolved || item.title || `영상 ${index + 1}`;
          const rowAuthor = atomFeedSupported
            ? active && currentAuthor.trim()
              ? currentAuthor
              : item.author?.trim() || authorById[item.videoId] || ""
            : active && currentAuthor.trim()
              ? currentAuthor
              : authorById[item.videoId] || "";
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
        className="flex h-full min-h-0 w-full items-center justify-center bg-transparent"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
        }}
      >
        {frameLockedIos && shellFrame ? (
          <aside
            aria-label="플레이리스트"
            className="relative flex min-h-0 shrink-0 flex-col overflow-hidden rounded-[44px] text-left text-white ring-1 ring-white/10"
            style={{
              width: shellFrame.width,
              height: shellFrame.height,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            {iosCardLayers}
          </aside>
        ) : (
          <IosUniformScaleShell layoutKey={shellLayoutKey}>
            <div
              className="relative flex w-full flex-col overflow-hidden rounded-[44px] ring-1 ring-white/10"
              style={{ height: IOS_QUEUE_FALLBACK_CARD_HEIGHT_PX }}
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
