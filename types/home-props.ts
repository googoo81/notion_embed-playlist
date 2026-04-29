import type { ReactNode } from "react";
import type { EmbedPlayerUi } from "@/lib/embed-ui";

export type HomeEmbedCardProps = {
  baseUrl: string;
  onBaseUrlChange: (v: string) => void;
  input: string;
  onInputChange: (v: string) => void;
  autoplay: boolean;
  onAutoplayChange: (v: boolean) => void;
  muted: boolean;
  onMutedChange: (v: boolean) => void;
  playlistId: string | null;
  videoId: string | null;
  height: number;
  onHeightChange: (v: number) => void;
  embedUi: EmbedPlayerUi;
  onEmbedUiChange: (v: EmbedPlayerUi) => void;
  playlistPanel: boolean;
  onPlaylistPanelChange: (v: boolean) => void;
  /** 플레이어 / 대기열 iframe 분리 */
  playlistSplitIframe: boolean;
  onPlaylistSplitIframeChange: (v: boolean) => void;
  embedUrl: string;
  /** 분리 임베드 시 재생 대기열 전용 URL */
  embedQueueUrl: string;
  snippet: string;
  queueSnippet: string;
  youtubeOfficialSnippet: string;
  onCopy: () => void;
  onCopyQueue: () => void;
  onCopyOfficial: () => void;
};

export type HomePageShellProps = {
  children: ReactNode;
};

export type HomePreviewsProps = {
  embedUrl: string;
  embedUiLabel: string;
  youtubeOfficialEmbedUrl: string;
  /** 분리 임베드 대기열 (있으면 나란히 미리보기) */
  embedQueueUrl?: string;
};
