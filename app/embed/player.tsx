'use client';

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = {
  playlistId?: string;
  videoId?: string;
  autoplay?: boolean;
  muted?: boolean;
};

type YouTubePlayerState = -1 | 0 | 1 | 2 | 3 | 5;

type YouTubeVideoData = {
  title?: string;
  author?: string;
  video_id?: string;
};

type YouTubePlayer = {
  destroy?: () => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  getPlayerState?: () => YouTubePlayerState;
  getVideoData?: () => YouTubeVideoData;
  isMuted?: () => boolean;
  mute?: () => void;
  nextVideo?: () => void;
  pauseVideo?: () => void;
  playVideo?: () => void;
  previousVideo?: () => void;
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
  unMute?: () => void;
};

type YouTubeIframeApi = {
  Player: new (
    elementId: string,
    options: {
      videoId?: string;
      height?: string;
      width?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: YouTubePlayerState }) => void;
      };
    },
  ) => YouTubePlayer;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.YT?.Player) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existing) {
      const check = () => {
        if (window.YT?.Player) resolve();
        else setTimeout(check, 50);
      };
      check();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load YouTube IFrame API"));
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(script);
  });
}

export default function EmbedPlayer({
  playlistId,
  videoId,
  autoplay = true,
  muted = false,
}: Props) {
  const key = playlistId ?? videoId ?? "unknown";
  const hostId = useMemo(
    () => `yt-player-${key.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [key],
  );
  const playerRef = useRef<YouTubePlayer | null>(null);
  const rafRef = useRef<number | null>(null);

  const [title, setTitle] = useState<string>("YouTube");
  const [author, setAuthor] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(0);
  const [current, setCurrent] = useState<number>(0);

  const progress = duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadYouTubeIframeApi();
      if (cancelled) return;

      const YT = window.YT;
      if (!YT?.Player) return;

      const shouldAutoplay = autoplay ?? true;
      const shouldMuted = muted ?? true;

      playerRef.current = new YT.Player(hostId, {
        videoId: videoId || undefined,
        height: "0",
        width: "0",
        playerVars: {
          autoplay: shouldAutoplay ? 1 : 0,
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
            const p = playerRef.current;
            if (!p) return;

            if (shouldMuted) {
              p.mute?.();
              setIsMuted(true);
            } else {
              setIsMuted(Boolean(p.isMuted?.()));
            }

            // Highest success rate: try autoplay while muted.
            if (shouldAutoplay) {
              setTimeout(() => p.playVideo?.(), 0);
            }

            const d = p.getDuration?.();
            if (typeof d === "number" && Number.isFinite(d) && d > 0) setDuration(d);
            const vd = p.getVideoData?.();
            if (vd?.title) setTitle(vd.title);
            if (vd?.author) setAuthor(vd.author);
            if (vd?.video_id) {
              setThumbnailUrl(`https://i.ytimg.com/vi/${vd.video_id}/hqdefault.jpg`);
            }
          },
          onStateChange: (e) => {
            // https://developers.google.com/youtube/iframe_api_reference#Events
            const state = e?.data;
            // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            setIsPlaying(state === 1);

            const p = playerRef.current;
            if (p?.isMuted) setIsMuted(Boolean(p.isMuted()));
            const vd = p?.getVideoData?.();
            if (vd?.title) setTitle(vd.title);
            if (vd?.author) setAuthor(vd.author);
            if (vd?.video_id) {
              setThumbnailUrl(`https://i.ytimg.com/vi/${vd.video_id}/hqdefault.jpg`);
            }

            const d = p?.getDuration?.();
            if (typeof d === "number" && Number.isFinite(d) && d > 0) setDuration(d);
          },
        },
      });
    }

    init().catch(() => {
      // ignore; we'll show minimal UI without crashing
    });

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        playerRef.current?.destroy?.();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [autoplay, hostId, muted, playlistId, videoId]);

  useEffect(() => {
    const tick = () => {
      const p = playerRef.current;
      if (p) {
        const t = p.getCurrentTime?.();
        if (typeof t === "number" && Number.isFinite(t)) setCurrent(t);
        const d = p.getDuration?.();
        if (typeof d === "number" && Number.isFinite(d) && d > 0) setDuration(d);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState?.();
    if (state === 1) p.pauseVideo?.();
    else p.playVideo?.();
  }

  function toggleMute() {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted?.()) {
      p.unMute?.();
      setIsMuted(false);
    } else {
      p.mute?.();
      setIsMuted(true);
    }
  }

  function prev() {
    const p = playerRef.current;
    p?.previousVideo?.();
  }

  function next() {
    const p = playerRef.current;
    p?.nextVideo?.();
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#ffeff5]">
      {/* Hidden YouTube player host */}
      <div id={hostId} className="h-0 w-0 overflow-hidden" />

      {/* Background blur artwork */}
      <div
        className="pointer-events-none absolute -inset-8 bg-cover bg-center blur-2xl"
        style={{
          backgroundImage: thumbnailUrl ? `url("${thumbnailUrl}")` : undefined,
          backgroundColor: thumbnailUrl ? undefined : "#ffeff5",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-white/50" />

      {/* Player */}
      <div className="absolute left-0 right-0 top-1/2 mx-auto w-[760px] max-w-[92vw] -translate-y-1/2">
        <div className="relative">
          {/* Top info bar */}
          <div className="relative z-[1] mx-auto w-[95%] rounded-[22px] bg-[#f7f2e7] px-6 py-6 pl-[248px] shadow-[0_24px_70px_rgba(0,0,0,0.20)]">
            <div className="text-[34px] font-semibold tracking-tight text-[#2a2a2a]">
              {author || "YouTube"}
            </div>
            <div className="mt-1 text-[18px] font-medium text-[#b7b7b7]">
              {title}
            </div>

            {/* time + thin progress */}
            <div className="mt-4 flex items-center justify-between text-[14px] text-[#d4b35b]">
              <span className="font-mono">{formatTime(current)}</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>
            <div className="mt-2 h-[6px] w-full rounded-full bg-[#ead9a6]">
              <div
                className="h-[6px] rounded-full bg-[#f2b84b]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Disc artwork (outside top box, above all) */}
          <div className="absolute left-10 top-1/2 z-[3] -translate-y-1/2">
            <div className="relative h-[220px] w-[220px] rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.85)]">
              <div className="absolute inset-[4px] overflow-hidden rounded-full bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    thumbnailUrl ||
                    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                  }
                  alt=""
                  referrerPolicy="no-referrer"
                  className={[
                    "h-full w-full object-cover",
                    isPlaying ? "animate-[spin_3s_linear_infinite]" : "",
                  ].join(" ")}
                />
              </div>
              <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-sm" />
            </div>
          </div>

          {/* Big control bar */}
          <div className="relative z-[2] mt-[-18px] rounded-[26px] bg-white/85 px-8 py-8 backdrop-blur">
            <div className="mt-2 flex items-center justify-between pl-[248px] pr-10 text-black/30">
              <button type="button" onClick={prev} aria-label="이전" className="p-2">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6V6zm3.5 6 10.5 6V6L9.5 12z" />
                </svg>
              </button>
              <button type="button" onClick={toggle} aria-label="재생/일시정지" className="p-2">
                {isPlaying ? (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                  </svg>
                ) : (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                )}
              </button>
              <button type="button" onClick={next} aria-label="다음" className="p-2">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6h2v12h-2V6zM4 18V6l10.5 6L4 18z" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={toggleMute}
              className="absolute bottom-4 right-5 text-xs font-medium text-black/35"
              title="노션 자동재생 성공률을 위해 기본 음소거"
            >
              {isMuted ? "Muted" : "Sound"}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-black/35">
          노션 임베드용. 실제 재생은 YouTube 플레이어로 수행됨.
        </div>
      </div>
    </div>
  );
}

