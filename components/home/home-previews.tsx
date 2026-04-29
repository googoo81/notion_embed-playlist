import type { HomePreviewsProps } from "@/types/home-props";

export function HomePreviews({
  embedUrl,
  embedUiLabel,
  youtubeOfficialEmbedUrl,
  embedQueueUrl,
}: HomePreviewsProps) {
  const split = Boolean(embedUrl && embedQueueUrl);

  return (
    <>
      {embedUrl ? (
        <section className="mt-6">
          <div className="mb-2 text-sm font-medium">
            미리보기 (커스텀 · {embedUiLabel}
            {split ? " · 플레이어+대기열" : ""})
          </div>
          <div
            className={
              split
                ? "grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch"
                : ""
            }
          >
            <div className="min-h-0 overflow-hidden rounded-2xl border border-zinc-200 bg-black dark:border-zinc-800 dark:bg-blue-900">
              <iframe
                key={embedUrl}
                src={embedUrl}
                title="Notion Embed Preview — Player"
                className="h-[min(85vh,720px)] min-h-[360px] w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            </div>
            {embedQueueUrl ? (
              <div className="min-h-0 overflow-hidden rounded-2xl border border-zinc-200 bg-black dark:border-zinc-800 dark:bg-blue-900">
                <iframe
                  key={embedQueueUrl}
                  src={embedQueueUrl}
                  title="Notion Embed Preview — Queue"
                  className="h-[min(85vh,720px)] min-h-[360px] w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {youtubeOfficialEmbedUrl ? (
        <section className="mt-6">
          <div className="mb-2 text-sm font-medium">
            미리보기 (유튜브 기본 iframe)
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-blue-500 dark:border-zinc-800 dark:bg-blue-900">
            <iframe
              key={youtubeOfficialEmbedUrl}
              src={youtubeOfficialEmbedUrl}
              title="YouTube Iframe Preview"
              className="h-[min(85vh,720px)] min-h-[560px] w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>
      ) : null}
    </>
  );
}
