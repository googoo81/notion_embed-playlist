import { formatTime } from "@/components/embed/format-time";
import type { PlayerTopBarProps } from "@/types/embed-props";

export function PlayerTopBar({
  title,
  author,
  current,
  duration,
  progress,
  onSeek,
}: PlayerTopBarProps) {
  return (
    <div className="relative z-[1] mx-auto w-[95%] rounded-[22px] bg-[#f7f2e7] px-6 py-6 pl-[248px]">
      <div className="truncate whitespace-nowrap text-[34px] font-semibold tracking-tight text-[#2a2a2a]">
        {title || "YouTube"}
      </div>
      <div className="mt-1 truncate whitespace-nowrap text-[18px] font-medium text-[#b7b7b7]">
        {author || "YouTube"}
      </div>

      <div className="mt-4 flex items-center justify-between text-[14px] text-[#d4b35b]">
        <span className="font-mono">{formatTime(current)}</span>
        <span className="font-mono">{formatTime(duration)}</span>
      </div>
      <div className="relative mt-2 h-[6px] w-full rounded-full bg-[#ead9a6]">
        <div
          className="h-[6px] rounded-full bg-[#f2b84b]"
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
          aria-label="재생 시간 조절"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
