import type { RefObject } from "react";

/**
 * YT IFrame API 마운트용. `h-0 w-0` / `display:none` 이면 노션 웹 등 중첩 iframe에서
 * playVideo()가 동작하지 않는 경우가 있어, 화면 밖 200×200 + 투명으로 둡니다.
 * (YouTube 권장 최소 뷰포트 200px — controls=0 이라도 임베드 환경에서 필요)
 */
export const YOUTUBE_PLAYER_HOST_CLASS =
  "pointer-events-none absolute top-0 -left-[9999px] z-0 h-[200px] w-[200px] overflow-hidden opacity-0";

type YoutubePlayerHostProps = {
  id: string;
  hostRef: RefObject<HTMLDivElement | null>;
};

export function YoutubePlayerHost({ id, hostRef }: YoutubePlayerHostProps) {
  return (
    <div
      id={id}
      ref={hostRef}
      className={YOUTUBE_PLAYER_HOST_CLASS}
      aria-hidden
    />
  );
}
