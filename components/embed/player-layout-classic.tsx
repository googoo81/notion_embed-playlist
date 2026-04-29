import { PlayerControls } from "@/components/embed/player-controls";
import { PlayerDisc } from "@/components/embed/player-disc";
import { PlayerTopBar } from "@/components/embed/player-top-bar";
import type { EmbedPlayerViewProps } from "@/types/embed-props";

const DESIGN_WIDTH = 760;
const DESIGN_HEIGHT = 360;

export function PlayerLayoutClassic({
  hostId,
  hostRef,
  scaleHostRef,
  title,
  author,
  thumbnailUrl,
  isPlaying,
  progress,
  current,
  duration,
  volume,
  isMuted,
  showVolume,
  setShowVolume,
  scale,
  onSeek,
  togglePlayback,
  toggleMute,
  applyVolume,
  onPrev,
  onNext,
}: EmbedPlayerViewProps) {
  return (
    <div className="relative w-full overflow-hidden bg-transparent">
      <div id={hostId} ref={hostRef} className="h-0 w-0 overflow-hidden" />

      <div ref={scaleHostRef} className="relative mx-auto w-full max-w-[760px]">
        <div
          className="relative"
          style={{ height: `${DESIGN_HEIGHT * scale}px` }}
        >
          <div
            className="absolute left-1/2 top-0"
            style={{
              width: `${DESIGN_WIDTH}px`,
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <PlayerTopBar
              title={title}
              author={author}
              current={current}
              duration={duration}
              progress={progress}
              onSeek={onSeek}
            />
            <PlayerDisc thumbnailUrl={thumbnailUrl} isPlaying={isPlaying} />
            <PlayerControls
              isPlaying={isPlaying}
              onTogglePlay={togglePlayback}
              onPrev={onPrev}
              onNext={onNext}
              showVolume={showVolume}
              onToggleVolumePanel={() => setShowVolume((v) => !v)}
              volume={volume}
              onVolumeChange={applyVolume}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
