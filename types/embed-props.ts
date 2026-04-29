import type { Dispatch, RefObject, SetStateAction } from "react";
import type { EmbedPlayerUi } from "@/lib/embed-ui";

export type EmbedPlayerProps = {
  playlistId?: string;
  videoId?: string;
  autoplay?: boolean;
  muted?: boolean;
  ui?: EmbedPlayerUi;
  /** `?plist=1` — 플레이리스트가 있을 때 우측 목록 패널 */
  showPlaylistPanel?: boolean;
};

export type EmbedPlayerViewProps = {
  hostId: string;
  hostRef: RefObject<HTMLDivElement | null>;
  scaleHostRef: RefObject<HTMLDivElement | null>;
  title: string;
  author: string;
  thumbnailUrl: string;
  isPlaying: boolean;
  progress: number;
  current: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  showVolume: boolean;
  setShowVolume: Dispatch<SetStateAction<boolean>>;
  scale: number;
  onSeek: (seconds: number) => void;
  togglePlayback: () => void;
  toggleMute: () => void;
  applyVolume: (value: number) => void;
  onPrev: () => void;
  onNext: () => void;
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
