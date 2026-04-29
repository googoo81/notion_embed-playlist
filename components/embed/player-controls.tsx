import type { PlayerControlsProps } from "@/types/embed-props";

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
          <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6V6zm3.5 6 10.5 6V6L9.5 12z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label="재생/일시정지"
          className="p-2"
        >
          {isPlaying ? (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
            </svg>
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </button>
        <button type="button" onClick={onNext} aria-label="다음" className="p-2">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 6h2v12h-2V6zM4 18V6l10.5 6L4 18z" />
          </svg>
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
