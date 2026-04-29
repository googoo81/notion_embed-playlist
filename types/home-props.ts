import type { ReactNode } from "react";

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
  youtubeOfficialEmbedUrl: string;
};
