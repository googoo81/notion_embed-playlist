/** /embed 페이지 `ui` 쿼리와 홈 생성 URL에 쓰는 플레이어 스킨 */
export type EmbedPlayerUi = "classic" | "ios";

export function embedUiToSearchParam(ui: EmbedPlayerUi): string {
  return ui === "ios" ? "ios" : "v3";
}

export function parseEmbedUiParam(raw: string | undefined): EmbedPlayerUi {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "ios" || s === "v4") return "ios";
  return "classic";
}
