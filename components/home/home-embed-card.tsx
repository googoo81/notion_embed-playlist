import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/checkbox-row";
import { CodeTextarea } from "@/components/ui/code-textarea";
import { FieldLabel } from "@/components/ui/field-label";
import { StatTile } from "@/components/ui/stat-tile";
import { TextInput } from "@/components/ui/text-input";
import { UrlDisplay } from "@/components/ui/url-display";
import type { HomeEmbedCardProps } from "@/types/home-props";
import { NotionHintBanner } from "@/components/home/notion-hint-banner";

export function HomeEmbedCard({
  baseUrl,
  onBaseUrlChange,
  input,
  onInputChange,
  autoplay,
  onAutoplayChange,
  muted,
  onMutedChange,
  playlistId,
  videoId,
  height,
  onHeightChange,
  embedUrl,
  snippet,
  youtubeOfficialSnippet,
  onCopy,
  onCopyOfficial,
}: HomeEmbedCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <NotionHintBanner />

      <FieldLabel>베이스 URL (노션에서 접근 가능한 주소)</FieldLabel>
      <div className="mt-2 flex gap-2">
        <TextInput
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="예: https://notion-embed-playlist.vercel.app"
        />
      </div>

      <FieldLabel className="mt-4">
        유튜브 링크 (플레이리스트/영상)
      </FieldLabel>
      <TextInput
        className="mt-2"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="예: https://www.youtube.com/playlist?list=PLxxxx / https://www.youtube.com/watch?v=xxxx / PLxxxx"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <CheckboxRow
          label="자동재생 기능"
          checked={autoplay}
          onChange={(e) => onAutoplayChange(e.target.checked)}
        />
        <CheckboxRow
          label="디폴트 음소거 설정"
          checked={muted}
          onChange={(e) => onMutedChange(e.target.checked)}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatTile caption="감지된 playlist id">
          {playlistId ?? <span className="text-zinc-400">-</span>}
        </StatTile>
        <StatTile caption="감지된 video id">
          {videoId ?? <span className="text-zinc-400">-</span>}
        </StatTile>
        <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              높이(px)
            </div>
            <input
              type="number"
              min={200}
              max={1200}
              value={height}
              onChange={(e) => onHeightChange(Number(e.target.value || 0))}
              className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
            />
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            노션에서 세로가 짧으면 이 값을 조절해주세요.
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium">커스텀 플레이어 임베드 URL</div>
        <UrlDisplay>
          {embedUrl || <span className="text-zinc-400">-</span>}
        </UrlDisplay>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">커스텀 플레이어 iframe 코드</div>
          <Button disabled={!snippet} onClick={onCopy}>
            복사
          </Button>
        </div>
        <CodeTextarea
          value={snippet}
          readOnly
          rows={7}
          placeholder="플레이리스트를 입력하면 여기 코드가 생성됩니다."
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">유튜브 iframe 코드</div>
          <Button variant="outline" disabled={!youtubeOfficialSnippet} onClick={onCopyOfficial}>
            복사
          </Button>
        </div>
        <CodeTextarea
          value={youtubeOfficialSnippet}
          readOnly
          rows={6}
          placeholder="유튜브 링크를 입력하면 기본 iframe 코드가 생성됩니다."
        />
      </div>
    </section>
  );
}
