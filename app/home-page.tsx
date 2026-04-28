"use client";

import { useMemo, useState } from "react";
import { extractYouTubePlaylistId, extractYouTubeVideoId } from "./lib/youtube";

function buildEmbedUrl(
  origin: string,
  params: {
    playlistId?: string;
    videoId?: string;
    autoplay?: boolean;
    muted?: boolean;
  },
) {
  const url = new URL("/embed", origin);
  if (params.playlistId) url.searchParams.set("list", params.playlistId);
  if (params.videoId) url.searchParams.set("v", params.videoId);
  if (params.autoplay != null)
    url.searchParams.set("autoplay", params.autoplay ? "1" : "0");
  if (params.muted != null)
    url.searchParams.set("muted", params.muted ? "1" : "0");
  // Bump when UI changes to avoid iframe cache showing stale layout
  url.searchParams.set("ui", "v2");
  return url.toString();
}

function buildIframeSnippet(embedUrl: string) {
  return `<iframe
  src="${embedUrl}"
  width="100%"
  height="480"
  frameborder="0"
  allow="autoplay; encrypted-media; picture-in-picture"
  allowfullscreen
></iframe>`;
}

export default function HomePage() {
  const defaultBaseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://notion-embed-playlist.vercel.app";
  const [baseUrl, setBaseUrl] = useState<string>(defaultBaseUrl);
  const [input, setInput] = useState<string>("");
  const [height, setHeight] = useState<number>(480);
  const [autoplay, setAutoplay] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);
  const playlistId = useMemo(() => extractYouTubePlaylistId(input), [input]);
  const videoId = useMemo(() => extractYouTubeVideoId(input), [input]);

  const embedUrl = useMemo(() => {
    if (!baseUrl) return "";
    if (!playlistId && !videoId) return "";
    return buildEmbedUrl(baseUrl, {
      playlistId: playlistId ?? undefined,
      videoId: videoId ?? undefined,
      autoplay,
      muted,
    });
  }, [autoplay, baseUrl, muted, playlistId, videoId]);

  const youtubeOfficialEmbedUrl = useMemo(() => {
    if (playlistId) {
      return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&rel=0&modestbranding=1&autoplay=${
        autoplay ? "1" : "0"
      }&mute=1`;
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1&autoplay=${
        autoplay ? "1" : "0"
      }&mute=1`;
    }
    return "";
  }, [autoplay, playlistId, videoId]);

  const snippet = useMemo(() => {
    if (!embedUrl) return "";
    return buildIframeSnippet(embedUrl).replace(
      'height="480"',
      `height="${height}"`,
    );
  }, [embedUrl, height]);

  const youtubeOfficialSnippet = useMemo(() => {
    if (!youtubeOfficialEmbedUrl) return "";
    return buildIframeSnippet(youtubeOfficialEmbedUrl).replace(
      'height="480"',
      `height="${height}"`,
    );
  }, [youtubeOfficialEmbedUrl, height]);

  const canCopy = Boolean(snippet);
  const canCopyOfficial = Boolean(youtubeOfficialSnippet);

  async function onCopy() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
  }

  async function onCopyOfficial() {
    if (!youtubeOfficialSnippet) return;
    await navigator.clipboard.writeText(youtubeOfficialSnippet);
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-10 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Notion 임베드 코드 생성기 (YouTube Playlist)
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            유튜브 플레이리스트 URL 또는 ID를 넣으면, 노션에 붙여넣을{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              iframe 코드
            </span>
            를 만들어줘.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            <div className="font-medium text-zinc-900 dark:text-zinc-50">
              노션에 임베드 추가하기
            </div>
            <div className="mt-1">
              노션에서 [/embed]를 입력한 뒤 생성된 커스텀 플레이어 임베드 URL을 붙혀넣기 해주세요.
            </div>
          </div>

          <label className="block text-sm font-medium">
            베이스 URL (노션에서 접근 가능한 주소)
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="예: https://notion-embed-playlist.vercel.app"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-0 focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
            />
          </div>

          <label className="mt-4 block text-sm font-medium">
            유튜브 링크 (플레이리스트/영상)
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: https://www.youtube.com/playlist?list=PLxxxx / https://www.youtube.com/watch?v=xxxx / PLxxxx"
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-0 focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-900">
              <span className="font-medium">자동재생 기능</span>
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-900">
              <span className="font-medium">디폴트 음소거 설정</span>
              <input
                type="checkbox"
                checked={muted}
                onChange={(e) => setMuted(e.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                감지된 playlist id
              </div>
              <div className="mt-1 break-all font-mono">
                {playlistId ?? <span className="text-zinc-400">-</span>}
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                감지된 video id
              </div>
              <div className="mt-1 break-all font-mono">
                {videoId ?? <span className="text-zinc-400">-</span>}
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  높이(px)
                </div>
                <input
                  type="number"
                  min={200}
                  max={1200}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value || 0))}
                  className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                />
              </div>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                노션에서 세로가 짧으면 여기만 키우면 됨.
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium">
              커스텀 플레이어 임베드 URL
            </div>
            <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3 text-xs font-mono text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200">
              {embedUrl || <span className="text-zinc-400">-</span>}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                커스텀 플레이어 iframe 코드
              </div>
              <button
                type="button"
                onClick={onCopy}
                disabled={!canCopy}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
              >
                복사
              </button>
            </div>
            <textarea
              value={snippet}
              readOnly
              rows={7}
              className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-xs font-mono outline-none dark:border-zinc-800 dark:bg-black"
              placeholder="플레이리스트를 입력하면 여기 코드가 생성돼."
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">유튜브 iframe 코드</div>
              <button
                type="button"
                onClick={onCopyOfficial}
                disabled={!canCopyOfficial}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-black dark:text-zinc-50"
              >
                복사
              </button>
            </div>
            <textarea
              value={youtubeOfficialSnippet}
              readOnly
              rows={6}
              className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-xs font-mono outline-none dark:border-zinc-800 dark:bg-black"
              placeholder="유튜브 링크를 입력하면 기본 iframe 코드가 생성돼."
            />
          </div>
        </section>

        {embedUrl ? (
          <section className="mt-6">
            <div className="mb-2 text-sm font-medium">
              미리보기 (커스텀 플레이어)
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
              <iframe
                key={embedUrl}
                src={embedUrl}
                title="Notion Embed Preview"
                className="h-[480px] w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            </div>
          </section>
        ) : null}

        {youtubeOfficialEmbedUrl ? (
          <section className="mt-6">
            <div className="mb-2 text-sm font-medium">
              미리보기 (유튜브 기본 iframe)
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
              <iframe
                key={youtubeOfficialEmbedUrl}
                src={youtubeOfficialEmbedUrl}
                title="YouTube Iframe Preview"
                className="h-[480px] w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
