export function HomeHeader() {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Notion 임베드 코드 생성기 (YouTube Playlist)
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        유튜브 플레이리스트 URL을 입력하여 노션에 붙여넣을{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          iframe 코드
        </span>
        를 만들어주세요.
      </p>
    </header>
  );
}
