export function NotionHintBanner() {
  return (
    <div className="mb-4 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
      <div className="font-medium text-zinc-900 dark:text-zinc-50">
        노션에 임베드 추가하기
      </div>
      <div className="mt-1">
        노션에서 [/embed]를 입력한 뒤 생성된 커스텀 플레이어 임베드 URL을
        붙혀넣기 해주세요.
      </div>
    </div>
  );
}
