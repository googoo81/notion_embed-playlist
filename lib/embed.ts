import type { EmbedPlayerUi } from "@/lib/embed-ui";
import { embedUiToSearchParam } from "@/lib/embed-ui";

const DEV_DEFAULT_ORIGIN = "http://localhost:3000";

/** trailing slash 제거, 유효한 origin만 반환 */
export function normalizeAppOrigin(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withScheme).origin;
  } catch {
    return undefined;
  }
}

/** `NEXT_PUBLIC_APP_URL` (next.config에서 VERCEL_URL로 채울 수 있음) */
export function getConfiguredAppOrigin(): string | undefined {
  return normalizeAppOrigin(process.env.NEXT_PUBLIC_APP_URL ?? "");
}

/** 요청 헤더에서 origin 추출 (App Router 서버 컴포넌트) */
export function originFromRequestHeaders(
  host: string | null,
  proto: string | null,
): string | undefined {
  if (!host?.trim()) return undefined;
  const scheme = proto?.trim().toLowerCase() === "http" ? "http" : "https";
  return normalizeAppOrigin(`${scheme}://${host.trim()}`);
}

/** 홈 베이스 URL 초기값: env > 현재 요청 origin > 로컬 dev */
export function resolveInitialAppOrigin(requestOrigin?: string): string {
  const configured = getConfiguredAppOrigin();
  if (configured) return configured;
  if (requestOrigin) return requestOrigin;
  if (process.env.NODE_ENV === "development") return DEV_DEFAULT_ORIGIN;
  return "";
}

export type BuildEmbedUrlParams = {
  playlistId?: string;
  videoId?: string;
  autoplay?: boolean;
  muted?: boolean;
  /** 플레이어 UI: 클래식(기본) / iOS 컨트롤 센터 스타일 */
  embedUi?: EmbedPlayerUi;
  /** 우측 재생 목록 패널 (`plist=1`), 플레이리스트 임베드에서만 동작 */
  playlistPanel?: boolean;
  /** 분리 임베드: `player` | `queue` */
  embedPart?: "player" | "queue";
  /** 분리 임베드 시 같은 페이지 iframe끼리 맞출 키 (`sync=`) */
  syncKey?: string;
};

/** 기본 iframe 스니펫 높이(px). 스니펫 문자열과 맞춰야 함. */
const IFRAME_SNIPPET_DEFAULT_HEIGHT = 480;

export function buildEmbedUrl(
  origin: string,
  params: BuildEmbedUrlParams,
): string {
  const url = new URL("/embed", origin);
  if (params.playlistId) url.searchParams.set("list", params.playlistId);
  if (params.videoId) url.searchParams.set("v", params.videoId);
  if (params.autoplay != null) {
    url.searchParams.set("autoplay", params.autoplay ? "1" : "0");
  }
  if (params.muted != null) {
    url.searchParams.set("muted", params.muted ? "1" : "0");
  }
  const ui = params.embedUi ?? "classic";
  url.searchParams.set("ui", embedUiToSearchParam(ui));
  if (params.playlistPanel) {
    url.searchParams.set("plist", "1");
  }
  if (params.embedPart) {
    url.searchParams.set("part", params.embedPart);
  }
  if (params.syncKey) {
    url.searchParams.set("sync", params.syncKey);
  }
  return url.toString();
}

export function buildIframeSnippet(
  embedUrl: string,
  heightPx: number = IFRAME_SNIPPET_DEFAULT_HEIGHT,
): string {
  return `<iframe
  src="${embedUrl}"
  width="100%"
  height="${heightPx}"
  frameborder="0"
  allow="autoplay; encrypted-media; picture-in-picture"
  allowfullscreen
></iframe>`;
}

export function buildYouTubeOfficialEmbedUrl(options: {
  playlistId: string | null;
  videoId: string | null;
  autoplay: boolean;
}): string {
  const { playlistId, videoId, autoplay } = options;
  const autoplayFlag = autoplay ? "1" : "0";
  if (playlistId) {
    return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&rel=0&modestbranding=1&autoplay=${autoplayFlag}&mute=1`;
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1&autoplay=${autoplayFlag}&mute=1`;
  }
  return "";
}
