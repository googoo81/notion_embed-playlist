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
  nextVideo?: () => void;
  pauseVideo?: () => void;
  playVideo?: () => void;
  previousVideo?: () => void;
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
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

export default function EmbedPlayer({ playlistId, videoId }: Props) {
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
  const [duration, setDuration] = useState<number>(0);
  const [current, setCurrent] = useState<number>(0);
  const [seeking, setSeeking] = useState<boolean>(false);

  const progress = duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadYouTubeIframeApi();
      if (cancelled) return;

      const YT = window.YT;
      if (!YT?.Player) return;

      playerRef.current = new YT.Player(hostId, {
        videoId: videoId || undefined,
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 0,
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
  }, [hostId, playlistId, videoId]);

  useEffect(() => {
    const tick = () => {
      const p = playerRef.current;
      if (p && !seeking) {
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
  }, [seeking]);

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState?.();
    if (state === 1) p.pauseVideo?.();
    else p.playVideo?.();
  }

  function prev() {
    const p = playerRef.current;
    p?.previousVideo?.();
  }

  function next() {
    const p = playerRef.current;
    p?.nextVideo?.();
  }

  function seekTo(nextTime: number) {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo?.(Math.max(0, Math.min(duration || 0, nextTime)), true);
  }

  return (
    <div className="min-h-screen w-screen bg-zinc-100 px-4 py-6 text-zinc-900 dark:bg-black dark:text-zinc-50">
      {/* Hidden YouTube player host */}
      <div id={hostId} className="h-0 w-0 overflow-hidden" />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {/* Top info bar */}
          <div className="flex items-center gap-4 px-5 pb-4 pt-5">
            <div className="relative h-16 w-16 shrink-0">
              <div className="absolute inset-0 rounded-full bg-zinc-200 shadow-sm dark:bg-zinc-800" />
              {thumbnailUrl ? (
                <div className="absolute inset-0 rounded-full p-1">
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 rounded-full ring-1 ring-black/10 dark:ring-white/10" />
                    <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-sm backdrop-blur dark:bg-black/60" />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-semibold leading-6">{title}</div>
              <div className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                {author || " "}
              </div>

              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-amber-400"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="font-mono">{formatTime(current)}</div>
                  <div className="font-mono">{formatTime(duration)}</div>
                </div>

                <input
                  className="mt-2 w-full accent-amber-400"
                  type="range"
                  min={0}
                  max={Math.max(1, Math.floor(duration || 1))}
                  value={Math.min(Math.floor(current), Math.floor(duration || 1))}
                  onMouseDown={() => setSeeking(true)}
                  onMouseUp={() => setSeeking(false)}
                  onTouchStart={() => setSeeking(true)}
                  onTouchEnd={() => setSeeking(false)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setCurrent(v);
                  }}
                  onPointerUp={(e) => {
                    const el = e.currentTarget as HTMLInputElement;
                    const v = Number(el.value);
                    seekTo(v);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-10 px-6 pb-6">
            <button
              type="button"
              onClick={prev}
              className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              이전
            </button>

            <button
              type="button"
              onClick={toggle}
              className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPlaying ? "일시정지" : "재생"}
            </button>

            <button
              type="button"
              onClick={next}
              className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              다음
            </button>
          </div>
        </div>

        <div className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          노션 임베드용. 실제 재생은 YouTube 플레이어로 수행됨.
        </div>
      </div>
    </div>
  );
}

