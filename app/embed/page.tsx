import type { Metadata } from "next";
import EmbedPlayer from "@/components/embed/embed-player";
import { EmbedQueueFrame } from "@/components/embed/embed-queue-frame";
import { isValidEmbedSyncKey } from "@/lib/embed-sync";
import { parseEmbedUiParam } from "@/lib/embed-ui";
import {
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
} from "@/lib/youtube";
import {
  getSearchParam,
  parseBoolParam,
  resolveSearchParams,
  type AppSearchParams,
} from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notion Embed",
  description: "Embed-only view for Notion",
};

type EmbedPageProps = {
  searchParams?: AppSearchParams;
};

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const sp = await resolveSearchParams(searchParams);
  const listInput = getSearchParam(sp, "list") ?? "";
  const vInput = getSearchParam(sp, "v") ?? "";
  const autoplay = parseBoolParam(getSearchParam(sp, "autoplay"), true);
  const muted = parseBoolParam(getSearchParam(sp, "muted"), true);
  const embedUi = parseEmbedUiParam(getSearchParam(sp, "ui"));
  const showPlaylistPanelParam = parseBoolParam(
    getSearchParam(sp, "plist"),
    false,
  );
  const part = (getSearchParam(sp, "part") ?? "").trim().toLowerCase();
  const syncRaw = (getSearchParam(sp, "sync") ?? "").trim();

  const playlistId = extractYouTubePlaylistId(listInput);
  const videoId = extractYouTubeVideoId(vInput);

  const syncKeyParsed = isValidEmbedSyncKey(syncRaw) ? syncRaw : undefined;

  if (!playlistId && !videoId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-zinc-50">
        <div className="max-w-md text-center">
          <div className="text-lg font-semibold">링크가 필요해</div>
          <div className="mt-2 text-sm text-zinc-300">
            URL에{" "}
            <span className="font-mono">?list=PLxxxx</span> 또는{" "}
            <span className="font-mono">?v=VIDEO_ID</span> 형태로 전달해줘.
          </div>
        </div>
      </div>
    );
  }

  if (part === "queue") {
    if (!playlistId) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-6 text-zinc-50">
          <div className="max-w-md text-center">
            <div className="text-lg font-semibold">플레이리스트가 필요해</div>
            <div className="mt-2 text-sm text-zinc-300">
              대기열 iframe에는{" "}
              <span className="font-mono">?list=</span> 가 필요합니다.
            </div>
          </div>
        </div>
      );
    }
    if (!syncKeyParsed) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-6 text-zinc-50">
          <div className="max-w-md text-center">
            <div className="text-lg font-semibold">동기화 키가 필요해</div>
            <div className="mt-2 text-sm text-zinc-300">
              플레이어 iframe과 같은{" "}
              <span className="font-mono">?sync=…</span> 값을 넣어줘. (영문·숫자
              6자 이상)
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <style>{`
        html, body {
          background: transparent !important;
          margin: 0;
          overflow: hidden;
          height: 100%;
        }
      `}</style>
        <div className="box-border flex h-dvh max-h-dvh min-h-0 w-full max-w-[100vw] items-stretch justify-stretch overflow-hidden p-2 sm:p-3">
          <div className="h-full min-h-0 min-w-0 flex-1">
            <EmbedQueueFrame
              playlistId={playlistId}
              syncKey={syncKeyParsed}
              embedUi={embedUi}
            />
          </div>
        </div>
      </>
    );
  }

  const showPlaylistPanelEmbed =
    showPlaylistPanelParam && Boolean(playlistId) && !syncKeyParsed;

  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          margin: 0;
          overflow: hidden;
          height: 100%;
        }
      `}</style>
      <div className="box-border flex h-dvh max-h-dvh min-h-0 w-full max-w-[100vw] items-center justify-center overflow-hidden p-2 sm:p-3">
      <div className="h-full min-h-0 w-full">
        <EmbedPlayer
          playlistId={playlistId ?? undefined}
          videoId={videoId ?? undefined}
          autoplay={autoplay}
          muted={muted}
          ui={embedUi}
          showPlaylistPanel={showPlaylistPanelEmbed}
          syncKey={syncKeyParsed}
        />
      </div>
      </div>
    </>
  );
}
