const TRANSPORT_SVG_SRC = {
  before: "/assets/svg/before.svg",
  next: "/assets/svg/next.svg",
  play: "/assets/svg/play.svg",
  stop: "/assets/svg/stop.svg",
} as const;

export type TransportIconName = keyof typeof TRANSPORT_SVG_SRC;

export function TransportIcon({
  name,
  className = "",
}: {
  name: TransportIconName;
  className?: string;
}) {
  return (
    <img
      src={TRANSPORT_SVG_SRC[name]}
      alt=""
      aria-hidden
      draggable={false}
      className={`pointer-events-none select-none ${className}`.trim()}
    />
  );
}

const VOLUME_SVG_SRC = {
  mute: "/assets/svg/mute.svg",
  full: "/assets/svg/full.svg",
} as const;

export type VolumeIconName = keyof typeof VOLUME_SVG_SRC;

export function VolumeIcon({
  name,
  className = "",
}: {
  name: VolumeIconName;
  className?: string;
}) {
  return (
    <img
      src={VOLUME_SVG_SRC[name]}
      alt=""
      aria-hidden
      draggable={false}
      className={`pointer-events-none select-none ${className}`.trim()}
    />
  );
}
