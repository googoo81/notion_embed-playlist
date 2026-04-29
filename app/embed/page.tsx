import type { Metadata } from "next";
import EmbedPlayer from "@/components/embed/embed-player";
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
  const muted = parseBoolParam(getSearchParam(sp, "muted"), false);
  const embedUi = parseEmbedUiParam(getSearchParam(sp, "ui"));

  const playlistId = extractYouTubePlaylistId(listInput);
  const videoId = extractYouTubeVideoId(vInput);

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
        <EmbedPlayer
          playlistId={playlistId ?? undefined}
          videoId={videoId ?? undefined}
          autoplay={autoplay}
          muted={muted}
          ui={embedUi}
        />
      </div>
    </>
  );
}
