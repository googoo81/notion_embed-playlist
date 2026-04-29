/** Apple Music 스타일 재생 중 이퀄라이저 */
export function PlaylistPlayingIndicator() {
  return (
    <span
      className="flex h-[18px] w-[18px] shrink-0 items-end justify-center gap-[2.5px] text-[#ff375f]"
      aria-hidden
    >
      <span className="playlist-side-panel__eq-bar h-3 w-[2.5px] rounded-full bg-current opacity-95" />
      <span className="playlist-side-panel__eq-bar h-3 w-[2.5px] rounded-full bg-current opacity-95" />
      <span className="playlist-side-panel__eq-bar h-3 w-[2.5px] rounded-full bg-current opacity-95" />
    </span>
  );
}
