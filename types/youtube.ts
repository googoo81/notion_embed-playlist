export type YouTubePlayerState = -1 | 0 | 1 | 2 | 3 | 5;

export type YouTubeVideoData = {
  title?: string;
  author?: string;
  video_id?: string;
};

export type YouTubePlayer = {
  destroy?: () => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  getPlaylist?: () => string[];
  getPlaylistIndex?: () => number;
  getPlayerState?: () => YouTubePlayerState;
  getVideoData?: () => YouTubeVideoData;
  getVolume?: () => number;
  isMuted?: () => boolean;
  mute?: () => void;
  nextVideo?: () => void;
  pauseVideo?: () => void;
  playVideo?: () => void;
  playVideoAt?: (index: number) => void;
  previousVideo?: () => void;
  setVolume?: (volume: number) => void;
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
  unMute?: () => void;
};

export type YouTubeIframeApi = {
  Player: new (
    elementId: string | HTMLElement,
    options: {
      videoId?: string;
      height?: string;
      width?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: YouTubePlayerState }) => void;
      };
    },
  ) => YouTubePlayer;
};
