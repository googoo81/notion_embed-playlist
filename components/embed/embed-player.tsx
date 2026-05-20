"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PlayerLayoutClassic } from "@/components/embed/player-layout-classic";
import { PlayerLayoutIos } from "@/components/embed/player-layout-ios";
import { PlaylistSidePanel } from "@/components/embed/playlist-side-panel";
import { useEmbedPlayerBroadcastSync } from "@/components/embed/use-embed-player-broadcast-sync";
import { loadYouTubeIframeApi } from "@/components/embed/youtube-iframe-api";
import { isValidEmbedSyncKey } from "@/lib/embed-sync";
import { isYoutubeAtomPlaylistFeedSupported } from "@/lib/youtube-playlist-feed";
import type { EmbedPlayerProps } from "@/types/embed-props";
import type { YouTubePlayer, YouTubeVideoData } from "@/types/youtube";

const DEFAULT_VOLUME = 10;
const DESIGN_WIDTH = 760;
const DESIGN_HEIGHT = 360;

import { youtubeVideoThumbnailHqUrl } from "@/lib/youtube-media-urls";

function applyVideoDataToUi(
  vd: YouTubeVideoData | undefined,
  setters: {
    setTitle: (value: string) => void;
    setAuthor: (value: string) => void;
    setThumbnailUrl: (value: string) => void;
  },
): void {
  if (!vd) return;
  if (vd.title) setters.setTitle(vd.title);
  if (vd.author) setters.setAuthor(vd.author);
  if (vd.video_id) setters.setThumbnailUrl(youtubeVideoThumbnailHqUrl(vd.video_id));
}

export default function EmbedPlayer({
  playlistId,
  videoId,
  autoplay = true,
  muted = false,
  ui = "classic",
  showPlaylistPanel = false,
  syncKey: syncKeyProp,
}: EmbedPlayerProps) {
  const syncKey =
    syncKeyProp && isValidEmbedSyncKey(syncKeyProp) ? syncKeyProp : undefined;
  const key = playlistId ?? videoId ?? "unknown";
  const hostId = useMemo(
    () => `yt-player-${key.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [key],
  );
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const rafRef = useRef<number | null>(null);

  const [title, setTitle] = useState("YouTube");
  const [author, setAuthor] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [showVolume, setShowVolume] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [scale, setScale] = useState(1);
  const [currentVideoId, setCurrentVideoId] = useState("");
  const scaleHostRef = useRef<HTMLDivElement | null>(null);
  const playerMeasureRef = useRef<HTMLDivElement | null>(null);
  const iosShellOuterRef = useRef<HTMLDivElement | null>(null);
  const [playlistPanelFramePx, setPlaylistPanelFramePx] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const progress =
    duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;

  useEffect(() => {
    let cancelled = false;
    const hostNode = hostRef.current;

    async function init(): Promise<void> {
      await loadYouTubeIframeApi();
      if (cancelled) return;

      const YT = window.YT;
      if (!YT?.Player) return;
      if (!hostNode) return;

      playerRef.current = new YT.Player(hostNode, {
        videoId: videoId || undefined,
        height: "0",
        width: "0",
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          mute: muted ? 1 : 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          ...(playlistId
            ? {
                listType: "playlist",
                list: playlistId,
              }
            : {}),
        },
        events: {
          onReady: () => {
            const player = playerRef.current;
            if (!player) return;
            player.setVolume?.(DEFAULT_VOLUME);
            setVolume(DEFAULT_VOLUME);

            if (muted) {
              player.mute?.();
              setIsMuted(true);
            } else {
              setIsMuted(Boolean(player.isMuted?.()));
            }

            if (autoplay) {
              setTimeout(() => player.playVideo?.(), 0);
            }

            const d = player.getDuration?.();
            if (typeof d === "number" && Number.isFinite(d) && d > 0) {
              setDuration(d);
            }
            applyVideoDataToUi(player.getVideoData?.(), {
              setTitle,
              setAuthor,
              setThumbnailUrl,
            });
            const vid = player.getVideoData?.()?.video_id;
            if (vid) setCurrentVideoId(vid);
          },
          onStateChange: (event) => {
            const state = event?.data;
            setIsPlaying(state === 1);

            const player = playerRef.current;
            if (player?.isMuted) setIsMuted(Boolean(player.isMuted()));
            applyVideoDataToUi(player?.getVideoData?.(), {
              setTitle,
              setAuthor,
              setThumbnailUrl,
            });

            const d = player?.getDuration?.();
            if (typeof d === "number" && Number.isFinite(d) && d > 0) {
              setDuration(d);
            }
            const vid = player?.getVideoData?.()?.video_id;
            if (vid) setCurrentVideoId(vid);
          },
        },
      });
    }

    void init().catch(() => {
      /* YT IFrame API 실패 시 최소 UI만 표시 */
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.pauseVideo?.();
      } catch {
        /* Player disconnect race */
      }
      playerRef.current = null;
    };
  }, [autoplay, muted, playlistId, videoId]);

  useEffect(() => {
    const tick = (): void => {
      const player = playerRef.current;
      if (player) {
        const t = player.getCurrentTime?.();
        if (typeof t === "number" && Number.isFinite(t)) setCurrent(t);
        const d = player.getDuration?.();
        if (typeof d === "number" && Number.isFinite(d) && d > 0) {
          setDuration(d);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ui !== "classic") return;
    const el = scaleHostRef.current;
    if (!el) return;

    const updateScale = (): void => {
      const hostWidth = el.clientWidth;
      const viewportHeight =
        typeof window === "undefined"
          ? DESIGN_HEIGHT
          : Math.max(1, window.visualViewport?.height ?? window.innerHeight);
      if (!hostWidth || !viewportHeight) return;

      const widthScale = hostWidth / DESIGN_WIDTH;
      const heightScale = viewportHeight / DESIGN_HEIGHT;
      setScale(Math.min(1, widthScale, heightScale));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    window.addEventListener("resize", updateScale);
    window.visualViewport?.addEventListener("resize", updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
      window.visualViewport?.removeEventListener("resize", updateScale);
    };
  }, [ui]);

  useLayoutEffect(() => {
    if (!showPlaylistPanel || !playlistId || syncKey) {
      setPlaylistPanelFramePx(null);
      return;
    }

    let ro: ResizeObserver | null = null;
    let rafId = 0;

    const attach = (): void => {
      const el =
        ui === "ios"
          ? iosShellOuterRef.current
          : playerMeasureRef.current;
      if (!el) {
        rafId = requestAnimationFrame(attach);
        return;
      }

      const apply = (): void => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setPlaylistPanelFramePx({ width: r.width, height: r.height });
        }
      };

      apply();
      ro = new ResizeObserver(apply);
      ro.observe(el);
    };

    attach();

    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [
    showPlaylistPanel,
    playlistId,
    syncKey,
    ui,
    title,
    author,
    thumbnailUrl,
  ]);

  function togglePlayback(): void {
    const player = playerRef.current;
    if (!player) return;
    const state = player.getPlayerState?.();
    if (state === 1) {
      player.pauseVideo?.();
      return;
    }
    // 중첩 iframe(노션 웹)에서는 음소거 후 playVideo가 성공하는 경우가 많음
    if (!player.isMuted?.()) {
      player.mute?.();
      setIsMuted(true);
    }
    player.playVideo?.();
  }

  function toggleMute(): void {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted?.()) {
      player.unMute?.();
      setIsMuted(false);
    } else {
      player.mute?.();
      setIsMuted(true);
    }
  }

  function applyVolume(nextVolume: number): void {
    const safe = Math.max(0, Math.min(100, nextVolume));
    setVolume(safe);
    const player = playerRef.current;
    if (!player) return;
    player.setVolume?.(safe);
    if (safe === 0) {
      player.mute?.();
      setIsMuted(true);
    } else if (player.isMuted?.()) {
      player.unMute?.();
      setIsMuted(false);
    }
  }

  function seekToTime(nextSeconds: number): void {
    const player = playerRef.current;
    if (!player || !Number.isFinite(nextSeconds) || duration <= 0) return;
    const safe = Math.max(0, Math.min(duration, nextSeconds));
    player.seekTo?.(safe, true);
    setCurrent(safe);
  }

  const viewProps = {
    hostId,
    hostRef,
    scaleHostRef,
    iosShellOuterRef,
    title,
    author,
    thumbnailUrl,
    isPlaying,
    progress,
    current,
    duration,
    volume,
    isMuted,
    showVolume,
    setShowVolume,
    scale,
    onSeek: seekToTime,
    togglePlayback,
    toggleMute,
    applyVolume,
    onPrev: () => playerRef.current?.previousVideo?.(),
    onNext: () => playerRef.current?.nextVideo?.(),
  };

  const playerUi =
    ui === "ios" ? (
      <PlayerLayoutIos {...viewProps} />
    ) : (
      <PlayerLayoutClassic {...viewProps} />
    );

  useEmbedPlayerBroadcastSync(syncKey, playerRef, {
    title,
    author,
    currentVideoId,
    embedUi: ui,
    iosShellOuterRef,
  });

  if (showPlaylistPanel && playlistId && !syncKey) {
    return (
      <div className="flex h-full min-h-0 w-full flex-row items-center justify-center gap-2">
        <div
          ref={playerMeasureRef}
          className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden"
        >
          {playerUi}
        </div>
        <PlaylistSidePanel
          key={playlistId}
          playlistId={playlistId}
          playerRef={playerRef}
          currentVideoId={currentVideoId}
          atomFeedSupported={isYoutubeAtomPlaylistFeedSupported(playlistId)}
          currentTitle={title}
          currentAuthor={author}
          panelFramePx={playlistPanelFramePx}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center">
      {playerUi}
    </div>
  );
}
