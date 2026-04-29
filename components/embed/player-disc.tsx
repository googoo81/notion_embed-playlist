import type { PlayerDiscProps } from "@/types/embed-props";

export function PlayerDisc({ thumbnailUrl, isPlaying }: PlayerDiscProps) {
  return (
    <div className="absolute left-10 top-1/2 z-[3] -translate-y-1/2">
      <div className="relative h-[220px] w-[220px] rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.85)]">
        <div className="absolute inset-[4px] overflow-hidden rounded-full bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              thumbnailUrl ||
              "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
            }
            alt=""
            referrerPolicy="no-referrer"
            className={[
              "h-full w-full scale-135 object-cover object-center",
              isPlaying ? "animate-[spin_3s_linear_infinite]" : "",
            ].join(" ")}
          />
        </div>
        <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-sm" />
      </div>
    </div>
  );
}
