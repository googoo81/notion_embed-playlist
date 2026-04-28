import { extractYouTubePlaylistId, extractYouTubeVideoId } from "../lib/youtube";
import EmbedPlayer from "@/app/embed/player";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notion Embed",
  description: "Embed-only view for Notion",
};

type Props = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

function isPromiseLike<T>(v: unknown): v is Promise<T> {
  if (typeof v !== "object" || v === null) return false;
  const then = (v as { then?: unknown }).then;
  return typeof then === "function";
}

function getParam(searchParams: Props["searchParams"], key: string) {
  if (!searchParams || isPromiseLike(searchParams)) return undefined;
  const v = (searchParams as Record<string, string | string[] | undefined>)[key];
  return Array.isArray(v) ? v[0] : v;
}

async function resolveSearchParams(
  searchParams: Props["searchParams"],
): Promise<Record<string, string | string[] | undefined> | undefined> {
  if (!searchParams) return undefined;
  if (isPromiseLike<Record<string, string | string[] | undefined>>(searchParams)) {
    return (await searchParams) as Record<string, string | string[] | undefined>;
  }
  return searchParams as Record<string, string | string[] | undefined>;
}

export default async function EmbedPage({ searchParams }: Props) {
  const sp = await resolveSearchParams(searchParams);
  const listInput = getParam(sp, "list") ?? "";
  const vInput = getParam(sp, "v") ?? "";

  const playlistId = extractYouTubePlaylistId(listInput);
  const videoId = extractYouTubeVideoId(vInput);

  if (!playlistId && !videoId) {
    return (
      <div className="min-h-screen bg-black text-zinc-50 flex items-center justify-center px-6">
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

  return <EmbedPlayer playlistId={playlistId ?? undefined} videoId={videoId ?? undefined} />;
}

