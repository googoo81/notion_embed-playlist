import type { YouTubeIframeApi } from "@/types/youtube";

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export {};
