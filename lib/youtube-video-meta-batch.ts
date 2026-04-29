import type { Dispatch, SetStateAction } from "react";

export const YOUTUBE_VIDEO_META_BATCH = 40;

export function mergeStringRecord(
  prev: Record<string, string>,
  patch: Record<string, string>,
): Record<string, string> {
  const next = { ...prev };
  for (const [k, v] of Object.entries(patch)) {
    if (v) next[k] = v;
  }
  return next;
}

/** 린트: effect 본문에서 동기 setState 대신 한 틱 미룸 */
export function runAfterCommit(fn: () => void): void {
  void Promise.resolve().then(fn);
}

type VideoMetaBatchContext = {
  cancelled: () => boolean;
  gen: number;
  genRef: { current: number };
  /** false면 `authors`만 병합 (Atom 피드 채널 보강) */
  includeTitles: boolean;
  setTitleById: Dispatch<SetStateAction<Record<string, string>>> | null;
  setAuthorById: Dispatch<SetStateAction<Record<string, string>>>;
};

export async function batchFetchYoutubeVideoMeta(
  ids: string[],
  ctx: VideoMetaBatchContext,
): Promise<void> {
  const n = YOUTUBE_VIDEO_META_BATCH;
  for (let i = 0; i < ids.length; i += n) {
    if (ctx.cancelled() || ctx.gen !== ctx.genRef.current) return;
    const chunk = ids.slice(i, i + n);
    try {
      const res = await fetch("/api/youtube-video-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: chunk }),
      });
      if (!res.ok || ctx.cancelled() || ctx.gen !== ctx.genRef.current) continue;
      const data = (await res.json()) as {
        titles?: Record<string, string>;
        authors?: Record<string, string>;
      };
      if (ctx.cancelled() || ctx.gen !== ctx.genRef.current) return;
      if (ctx.includeTitles && ctx.setTitleById) {
        ctx.setTitleById((prev) => mergeStringRecord(prev, data.titles ?? {}));
      }
      ctx.setAuthorById((prev) =>
        mergeStringRecord(prev, data.authors ?? {}),
      );
    } catch {
      /* */
    }
  }
}
