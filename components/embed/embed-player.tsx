"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlayerControls } from "@/components/embed/player-controls";
import { PlayerDisc } from "@/components/embed/player-disc";
import { PlayerTopBar } from "@/components/embed/player-top-bar";
import { loadYouTubeIframeApi } from "@/components/embed/youtube-iframe-api";
import type { EmbedPlayerProps } from "@/types/embed-props";
import type { YouTubePlayer, YouTubeVideoData } from "@/types/youtube";

const DEFAULT_VOLUME = 10;
const DESIGN_WIDTH = 760;
const DESIGN_HEIGHT = 360;

function hqThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

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
  if (vd.video_id) setters.setThumbnailUrl(hqThumbnailUrl(vd.video_id));
}

export default function EmbedPlayer({
  playlistId,
  videoId,
  autoplay = true,
  muted = false,
}: EmbedPlayerProps) {
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
  const scaleHostRef = useRef<HTMLDivElement | null>(null);

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
    const el = scaleHostRef.current;
    if (!el) return;

    const updateScale = (): void => {
      const hostWidth = el.clientWidth;
      const viewportHeight =
        typeof window === "undefined" ? DESIGN_HEIGHT : window.innerHeight;
      if (!hostWidth || !viewportHeight) return;

      const widthScale = hostWidth / DESIGN_WIDTH;
      const heightScale = viewportHeight / DESIGN_HEIGHT;
      setScale(Math.min(1, widthScale, heightScale));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    window.addEventListener("resize", updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  function togglePlayback(): void {
    const player = playerRef.current;
    if (!player) return;
    const state = player.getPlayerState?.();
    if (state === 1) player.pauseVideo?.();
    else player.playVideo?.();
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

  return (
    <div className="relative w-full overflow-hidden bg-transparent">
      <div id={hostId} ref={hostRef} className="h-0 w-0 overflow-hidden" />

      <div ref={scaleHostRef} className="relative mx-auto w-full max-w-[760px]">
        <div
          className="relative"
          style={{ height: `${DESIGN_HEIGHT * scale}px` }}
        >
          <div
            className="absolute left-1/2 top-0"
            style={{
              width: `${DESIGN_WIDTH}px`,
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <PlayerTopBar
              title={title}
              author={author}
              current={current}
              duration={duration}
              progress={progress}
              onSeek={seekToTime}
            />
            <PlayerDisc thumbnailUrl={thumbnailUrl} isPlaying={isPlaying} />
            <PlayerControls
              isPlaying={isPlaying}
              onTogglePlay={togglePlayback}
              onPrev={() => playerRef.current?.previousVideo?.()}
              onNext={() => playerRef.current?.nextVideo?.()}
              showVolume={showVolume}
              onToggleVolumePanel={() => setShowVolume((v) => !v)}
              volume={volume}
              onVolumeChange={applyVolume}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
