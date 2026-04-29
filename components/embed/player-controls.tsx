import { TransportIcon } from "@/components/embed/transport-icon";
import type { PlayerControlsProps } from "@/types/embed-props";

/** public/assets/svg 가 흰색 fill이라 클래식 패널(밝은 배경)에서는 어둡게 보이게 처리 */
const CLASSIC_TRANSPORT = "h-14 w-auto brightness-0 opacity-30";
const CLASSIC_TRANSPORT_PLAY = "h-16 w-auto brightness-0 opacity-30";

export function PlayerControls({
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  showVolume,
  onToggleVolumePanel,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
}: PlayerControlsProps) {
  return (
    <div className="relative z-[2] mt-[-18px] rounded-[26px] bg-white/85 px-8 py-8 backdrop-blur">
      <div className="mt-2 flex items-center justify-between pl-[248px] pr-10 text-black/30">
        <button type="button" onClick={onPrev} aria-label="이전" className="p-2">
          <TransportIcon name="before" className={CLASSIC_TRANSPORT} />
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label="재생/일시정지"
          className="p-2"
        >
          {isPlaying ? (
            <TransportIcon name="stop" className={CLASSIC_TRANSPORT_PLAY} />
          ) : (
            <TransportIcon name="play" className={CLASSIC_TRANSPORT_PLAY} />
          )}
        </button>
        <button type="button" onClick={onNext} aria-label="다음" className="p-2">
          <TransportIcon name="next" className={CLASSIC_TRANSPORT} />
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleVolumePanel}
        className="absolute bottom-2 right-4 rounded-md px-2 py-1 text-lg font-medium text-black/40 hover:bg-black/5"
        title="노션 자동재생 성공률을 위해 기본 음소거"
      >
        {isMuted ? "Muted" : "Sound"} / Volume
      </button>
      {showVolume ? (
        <div className="absolute bottom-10 right-5 w-36 rounded-xl bg-white/90 px-3 py-2 shadow-sm">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full accent-[#f2b84b]"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-black/45">
            <span>{volume}%</span>
            <button
              type="button"
              onClick={onToggleMute}
              className="rounded-md px-1 py-0.5 hover:bg-black/5"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
