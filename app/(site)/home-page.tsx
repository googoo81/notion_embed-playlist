"use client";

import { useState } from "react";
import {
  buildEmbedUrl,
  buildIframeSnippet,
  buildYouTubeOfficialEmbedUrl,
} from "@/lib/embed";
import type { EmbedPlayerUi } from "@/lib/embed-ui";
import {
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
} from "@/lib/youtube";
import { HomeEmbedCard } from "@/components/home/home-embed-card";
import { HomeHeader } from "@/components/home/home-header";
import { HomePageShell } from "@/components/home/home-page-shell";
import { HomePreviews } from "@/components/home/home-previews";

const PRODUCTION_BASE_URL = "https://notion-embed-playlist.vercel.app";
const DEVELOPMENT_BASE_URL = "http://localhost:3000";

function getDefaultBaseUrl(): string {
  return process.env.NODE_ENV === "development"
    ? DEVELOPMENT_BASE_URL
    : PRODUCTION_BASE_URL;
}

export default function HomePage() {
  const [baseUrl, setBaseUrl] = useState(getDefaultBaseUrl);
  const [input, setInput] = useState("");
  const [height, setHeight] = useState(480);
  const [autoplay, setAutoplay] = useState(true);
  const [muted, setMuted] = useState(false);
  const [embedUi, setEmbedUi] = useState<EmbedPlayerUi>("classic");

  const playlistId = extractYouTubePlaylistId(input);
  const videoId = extractYouTubeVideoId(input);

  const embedUrl =
    baseUrl && (playlistId || videoId)
      ? buildEmbedUrl(baseUrl, {
          playlistId: playlistId ?? undefined,
          videoId: videoId ?? undefined,
          autoplay,
          muted,
          embedUi,
        })
      : "";

  const youtubeOfficialEmbedUrl = buildYouTubeOfficialEmbedUrl({
    playlistId,
    videoId,
    autoplay,
  });

  const snippet = embedUrl ? buildIframeSnippet(embedUrl, height) : "";
  const youtubeOfficialSnippet = youtubeOfficialEmbedUrl
    ? buildIframeSnippet(youtubeOfficialEmbedUrl, height)
    : "";

  const embedUiLabel =
    embedUi === "ios" ? "iOS 컨트롤 센터 스타일" : "클래식";

  async function onCopy(): Promise<void> {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
  }

  async function onCopyOfficial(): Promise<void> {
    if (!youtubeOfficialSnippet) return;
    await navigator.clipboard.writeText(youtubeOfficialSnippet);
  }

  return (
    <HomePageShell>
      <HomeHeader />
      <HomeEmbedCard
        baseUrl={baseUrl}
        onBaseUrlChange={setBaseUrl}
        input={input}
        onInputChange={setInput}
        autoplay={autoplay}
        onAutoplayChange={setAutoplay}
        muted={muted}
        onMutedChange={setMuted}
        playlistId={playlistId}
        videoId={videoId}
        height={height}
        onHeightChange={setHeight}
        embedUi={embedUi}
        onEmbedUiChange={setEmbedUi}
        embedUrl={embedUrl}
        snippet={snippet}
        youtubeOfficialSnippet={youtubeOfficialSnippet}
        onCopy={onCopy}
        onCopyOfficial={onCopyOfficial}
      />
      <HomePreviews
        embedUrl={embedUrl}
        embedUiLabel={embedUiLabel}
        youtubeOfficialEmbedUrl={youtubeOfficialEmbedUrl}
      />
    </HomePageShell>
  );
}
