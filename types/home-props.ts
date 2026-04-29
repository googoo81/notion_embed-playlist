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
  embedUrl: string;
  snippet: string;
  youtubeOfficialSnippet: string;
  onCopy: () => void;
  onCopyOfficial: () => void;
};

export type HomePageShellProps = {
  children: ReactNode;
};

export type HomePreviewsProps = {
  embedUrl: string;
  embedUiLabel: string;
  youtubeOfficialEmbedUrl: string;
};
