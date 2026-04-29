import "@/types/window-youtube";

export type {
  YouTubeIframeApi,
  YouTubePlayer,
  YouTubePlayerState,
  YouTubeVideoData,
} from "@/types/youtube";

export async function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.YT?.Player) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existing) {
      const check = () => {
        if (window.YT?.Player) resolve();
        else setTimeout(check, 50);
      };
      check();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () =>
      reject(new Error("Failed to load YouTube IFrame API"));
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(script);
  });
}
