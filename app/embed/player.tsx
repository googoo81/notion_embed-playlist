"use client";

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
  getVolume?: () => number;
  isMuted?: () => boolean;
  mute?: () => void;
  nextVideo?: () => void;
  pauseVideo?: () => void;
  playVideo?: () => void;
  previousVideo?: () => void;
  setVolume?: (volume: number) => void;
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
    script.onerror = () =>
      reject(new Error("Failed to load YouTube IFrame API"));
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
  const DEFAULT_VOLUME = 10;
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
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);
  const [showVolume, setShowVolume] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [current, setCurrent] = useState<number>(0);

  const progress =
    duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;

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
            p.setVolume?.(DEFAULT_VOLUME);
            setVolume(DEFAULT_VOLUME);

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
            if (typeof d === "number" && Number.isFinite(d) && d > 0)
              setDuration(d);
            const vd = p.getVideoData?.();
            if (vd?.title) setTitle(vd.title);
            if (vd?.author) setAuthor(vd.author);
            if (vd?.video_id) {
              setThumbnailUrl(
                `https://i.ytimg.com/vi/${vd.video_id}/hqdefault.jpg`,
              );
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
              setThumbnailUrl(
                `https://i.ytimg.com/vi/${vd.video_id}/hqdefault.jpg`,
              );
            }

            const d = p?.getDuration?.();
            if (typeof d === "number" && Number.isFinite(d) && d > 0)
              setDuration(d);
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
        if (typeof d === "number" && Number.isFinite(d) && d > 0)
          setDuration(d);
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

  function applyVolume(nextVolume: number) {
    const safe = Math.max(0, Math.min(100, nextVolume));
    setVolume(safe);
    const p = playerRef.current;
    if (!p) return;
    p.setVolume?.(safe);
    if (safe === 0) {
      p.mute?.();
      setIsMuted(true);
    } else if (p.isMuted?.()) {
      p.unMute?.();
      setIsMuted(false);
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
    <div className="relative min-h-[320px] w-full overflow-hidden bg-transparent">
      {/* Hidden YouTube player host */}
      <div id={hostId} className="h-0 w-0 overflow-hidden" />

      {/* Background blur artwork */}
      <div
        className="pointer-events-none absolute -inset-8 bg-cover bg-center blur-2xl"
        style={{
          backgroundImage: thumbnailUrl ? `url("${thumbnailUrl}")` : undefined,
          backgroundColor: "transparent",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-transparent" />

      {/* Player */}
      <div className="relative mx-auto w-full max-w-[760px] px-3 py-6 sm:px-0">
        <div className="relative">
          {/* Top info bar */}
          <div className="relative z-[1] mx-auto w-[95%] rounded-[22px] bg-[#f7f2e7] px-4 py-4 pl-[160px] shadow-[0_24px_70px_rgba(0,0,0,0.20)] sm:px-6 sm:py-6 sm:pl-[248px]">
            <div className="text-[26px] font-semibold tracking-tight text-[#2a2a2a] sm:text-[34px]">
              {author || "YouTube"}
            </div>
            <div className="mt-1 text-[14px] font-medium text-[#b7b7b7] sm:text-[18px]">
              {title}
            </div>

            {/* time + thin progress */}
            <div className="mt-3 flex items-center justify-between text-[12px] text-[#d4b35b] sm:mt-4 sm:text-[14px]">
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
          <div className="absolute left-4 top-1/2 z-[3] -translate-y-1/2 sm:left-10">
            <div className="relative h-[140px] w-[140px] rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.85)] sm:h-[220px] sm:w-[220px]">
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
              <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-sm sm:h-9 sm:w-9" />
            </div>
          </div>

          {/* Big control bar */}
          <div className="relative z-[2] mt-[-12px] rounded-[26px] bg-white/85 px-4 py-5 backdrop-blur sm:mt-[-18px] sm:px-8 sm:py-8">
            <div className="mt-1 flex items-center justify-between pl-[150px] pr-2 text-black/30 sm:mt-2 sm:pl-[248px] sm:pr-10">
              <button
                type="button"
                onClick={prev}
                aria-label="이전"
                className="p-2"
              >
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="sm:h-14 sm:w-14"
                >
                  <path d="M6 6h2v12H6V6zm3.5 6 10.5 6V6L9.5 12z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={toggle}
                aria-label="재생/일시정지"
                className="p-2"
              >
                {isPlaying ? (
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="sm:h-16 sm:w-16"
                  >
                    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                  </svg>
                ) : (
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="sm:h-16 sm:w-16"
                  >
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="다음"
                className="p-2"
              >
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="sm:h-14 sm:w-14"
                >
                  <path d="M16 6h2v12h-2V6zM4 18V6l10.5 6L4 18z" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowVolume((prev) => !prev)}
              className="absolute bottom-3 right-3 text-xs font-medium text-black/35 sm:bottom-4 sm:right-5"
              title="노션 자동재생 성공률을 위해 기본 음소거"
            >
              {isMuted ? "Muted" : "Sound"} / Vol
            </button>
            {showVolume ? (
              <div className="absolute bottom-8 right-3 w-32 rounded-xl bg-white/90 px-3 py-2 shadow-sm sm:bottom-10 sm:right-5 sm:w-36">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={volume}
                  onChange={(e) => applyVolume(Number(e.target.value))}
                  className="w-full accent-[#f2b84b]"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-black/45">
                  <span>{volume}%</span>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="rounded-md px-1 py-0.5 hover:bg-black/5"
                  >
                    {isMuted ? "Unmute" : "Mute"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
