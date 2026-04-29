export type EmbedPlayerProps = {
  playlistId?: string;
  videoId?: string;
  autoplay?: boolean;
  muted?: boolean;
};

export type PlayerTopBarProps = {
  title: string;
  author: string;
  current: number;
  duration: number;
  progress: number;
  onSeek: (seconds: number) => void;
};

export type PlayerDiscProps = {
  thumbnailUrl: string;
  isPlaying: boolean;
};

export type PlayerControlsProps = {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  showVolume: boolean;
  onToggleVolumePanel: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
};
