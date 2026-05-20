"use client";

import { useState } from "react";
import {
  buildEmbedUrl,
  buildIframeSnippet,
  buildYouTubeOfficialEmbedUrl,
  resolveInitialAppOrigin,
} from "@/lib/embed";
import { generateEmbedSyncKey } from "@/lib/embed-sync";
import type { EmbedPlayerUi } from "@/lib/embed-ui";
import {
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
} from "@/lib/youtube";
import { HomeEmbedCard } from "@/components/home/home-embed-card";
import { HomeHeader } from "@/components/home/home-header";
import { HomePageShell } from "@/components/home/home-page-shell";
import { HomePreviews } from "@/components/home/home-previews";
type HomePageProps = {
  /** 서버에서 추출한 현재 요청 origin (`NEXT_PUBLIC_APP_URL` 없을 때) */
  requestOrigin?: string;
};

export default function HomePage({ requestOrigin }: HomePageProps) {
  const [baseUrl, setBaseUrl] = useState(() =>
    resolveInitialAppOrigin(requestOrigin),
  );
  const [input, setInput] = useState("");
  const [height, setHeight] = useState(480);
  const [autoplay, setAutoplay] = useState(true);
  const [muted, setMuted] = useState(false);
  const [embedUi, setEmbedUi] = useState<EmbedPlayerUi>("classic");
  const [playlistPanel, setPlaylistPanel] = useState(false);
  const [playlistSplitIframe, setPlaylistSplitIframe] = useState(false);
  const [splitSyncKey, setSplitSyncKey] = useState<string | null>(null);

  const playlistId = extractYouTubePlaylistId(input);
  const videoId = extractYouTubeVideoId(input);

  const playlistPanelActive = Boolean(playlistId) && playlistPanel;
  const playlistSplitActive =
    playlistPanelActive && playlistSplitIframe;
  const activeSplitSyncKey = playlistSplitActive ? splitSyncKey : null;

  function handlePlaylistSplitChange(checked: boolean): void {
    setPlaylistSplitIframe(checked);
    if (checked && playlistId) {
      setSplitSyncKey((k) => k ?? generateEmbedSyncKey());
    } else if (!checked) {
      setSplitSyncKey(null);
    }
  }

  const splitActive =
    Boolean(playlistId) &&
    playlistSplitActive &&
    Boolean(activeSplitSyncKey);

  const embedUrl =
    baseUrl && (playlistId || videoId)
      ? buildEmbedUrl(baseUrl, {
          playlistId: playlistId ?? undefined,
          videoId: videoId ?? undefined,
          autoplay,
          muted,
          embedUi,
          playlistPanel: playlistPanelActive && !playlistSplitActive,
          ...(splitActive
            ? {
                embedPart: "player" as const,
                syncKey: activeSplitSyncKey!,
              }
            : {}),
        })
      : "";

  const embedQueueUrl =
    baseUrl && splitActive
      ? buildEmbedUrl(baseUrl, {
          playlistId: playlistId!,
          videoId: videoId ?? undefined,
          autoplay,
          muted,
          embedUi,
          playlistPanel: false,
          embedPart: "queue",
          syncKey: activeSplitSyncKey!,
        })
      : "";

  const youtubeOfficialEmbedUrl = buildYouTubeOfficialEmbedUrl({
    playlistId,
    videoId,
    autoplay,
  });

  const snippet = embedUrl ? buildIframeSnippet(embedUrl, height) : "";
  const queueSnippet = embedQueueUrl
    ? buildIframeSnippet(embedQueueUrl, height)
    : "";
  const youtubeOfficialSnippet = youtubeOfficialEmbedUrl
    ? buildIframeSnippet(youtubeOfficialEmbedUrl, height)
    : "";

  const embedUiLabel =
    embedUi === "ios" ? "iOS 컨트롤 센터 스타일" : "클래식";

  async function onCopy(): Promise<void> {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
  }

  async function onCopyQueue(): Promise<void> {
    if (!queueSnippet) return;
    await navigator.clipboard.writeText(queueSnippet);
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
        playlistPanel={playlistPanelActive}
        onPlaylistPanelChange={setPlaylistPanel}
        playlistSplitIframe={playlistSplitActive}
        onPlaylistSplitIframeChange={handlePlaylistSplitChange}
        embedUrl={embedUrl}
        embedQueueUrl={embedQueueUrl}
        snippet={snippet}
        queueSnippet={queueSnippet}
        youtubeOfficialSnippet={youtubeOfficialSnippet}
        onCopy={onCopy}
        onCopyQueue={onCopyQueue}
        onCopyOfficial={onCopyOfficial}
      />
      <HomePreviews
        embedUrl={embedUrl}
        embedUiLabel={embedUiLabel}
        youtubeOfficialEmbedUrl={youtubeOfficialEmbedUrl}
        embedQueueUrl={embedQueueUrl || undefined}
      />
    </HomePageShell>
  );
}
