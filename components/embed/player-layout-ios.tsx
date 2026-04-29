import type { EmbedPlayerViewProps } from "@/types/embed-props";
import { IosMarqueeText } from "@/components/embed/ios-marquee-text";
import { TransportIcon, VolumeIcon } from "@/components/embed/transport-icon";

const PLACEHOLDER_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export function PlayerLayoutIos({
  hostId,
  hostRef,
  title,
  author,
  thumbnailUrl,
  isPlaying,
  progress,
  current,
  duration,
  volume,
  isMuted,
  applyVolume,
  togglePlayback,
  onPrev,
  onNext,
  onSeek,
}: EmbedPlayerViewProps) {
  const artSrc = thumbnailUrl || PLACEHOLDER_PIXEL;
  const subtitle = author || title || "YouTube";
  const hasRealThumbnail = Boolean(thumbnailUrl?.trim());

  return (
    <div className="relative flex w-full flex-col items-center px-3 py-4">
      <div id={hostId} ref={hostRef} className="h-0 w-0 overflow-hidden" />

      <div className="relative w-full max-w-[320px] overflow-hidden rounded-[44px] shadow-2xl ring-1 ring-white/10">
        {/* 유튜브 썸네일 확대 + 블러 = 잠금화면/컨트롤센터 배경 느낌 */}
        <div
          aria-hidden
          className="absolute inset-0 scale-125 bg-cover bg-center blur-3xl saturate-125"
          style={{ backgroundImage: `url(${artSrc})` }}
        />
        <div
          aria-hidden
          className={`absolute inset-0 ${hasRealThumbnail ? "bg-black/45" : "bg-[#6d6d70]"}`}
        />
        <div className="relative z-10 px-5 pt-5 pb-10">
          <div className="aspect-square w-full overflow-hidden rounded-[22px] bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artSrc}
              alt=""
              referrerPolicy="no-referrer"
              className="h-full w-full origin-center object-cover object-center scale-[1.35]"
            />
          </div>

          {title && title !== subtitle ? (
            <>
              <div className="mt-5">
                <IosMarqueeText
                  text={title}
                  className="text-lg font-bold tracking-wide text-white/95"
                />
              </div>
              <div className="mt-0.5">
                <IosMarqueeText
                  text={subtitle}
                  className="text-sm font-medium text-white/70"
                />
              </div>
            </>
          ) : (
            <div className="mt-5">
              <IosMarqueeText
                text={subtitle}
                className="text-lg font-bold tracking-wide text-white/95"
              />
            </div>
          )}

          <div className="mt-4">
            <div className="relative h-2 w-full rounded-full bg-white/25">
              <div
                className="h-2 rounded-full bg-white"
                style={{ width: `${progress * 100}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 0}
                step={0.1}
                value={duration > 0 ? current : 0}
                onChange={(e) => onSeek(Number(e.target.value))}
                disabled={duration <= 0}
                aria-label="재생 시간"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-8 text-white">
            <button
              type="button"
              onClick={onPrev}
              aria-label="이전"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
            >
              <TransportIcon name="before" className="h-[22px] w-auto" />
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "일시정지" : "재생"}
              className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/10"
            >
              {isPlaying ? (
                <TransportIcon name="stop" className="h-7 w-auto" />
              ) : (
                <TransportIcon name="play" className="h-7 w-auto" />
              )}
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="다음"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
            >
              <TransportIcon name="next" className="h-[22px] w-auto" />
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3 text-white/95">
            <span className="shrink-0 opacity-90">
              <VolumeIcon name="mute" className="h-[13px] w-auto" />
            </span>
            <div className="relative flex-1 min-w-0 py-3 -my-3">
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 top-1/2 h-1 max-w-full -translate-y-1/2 rounded-full bg-white"
                style={{ width: `${isMuted ? 0 : volume}%` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={isMuted ? 0 : volume}
                onInput={(e) => applyVolume(Number(e.currentTarget.value))}
                onChange={(e) => applyVolume(Number(e.currentTarget.value))}
                aria-label="볼륨"
                className="absolute inset-0 w-full cursor-pointer appearance-none opacity-0"
              />
            </div>
            <span className="shrink-0 opacity-90">
              <VolumeIcon name="full" className="h-[17px] w-auto" />
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
