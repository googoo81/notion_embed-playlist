import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/checkbox-row";
import { CodeTextarea } from "@/components/ui/code-textarea";
import { FieldLabel } from "@/components/ui/field-label";
import { StatTile } from "@/components/ui/stat-tile";
import { TextInput } from "@/components/ui/text-input";
import { UrlDisplay } from "@/components/ui/url-display";
import { NotionHintBanner } from "@/components/home/notion-hint-banner";
import type { HomeEmbedCardProps } from "@/types/home-props";

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
  embedUi,
  onEmbedUiChange,
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

      <FieldLabel className="mt-4">유튜브 링크 (플레이리스트/영상)</FieldLabel>
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

      <FieldLabel className="mt-4">커스텀 플레이어 디자인</FieldLabel>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        임베드 URL의 <span className="font-mono">ui</span> 파라미터로 구분됩니다
        (클래식: <span className="font-mono">v3</span>, iOS 스타일:{" "}
        <span className="font-mono">ios</span>).
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <EmbedUiOption
          id="embed-ui-classic"
          name="embed-ui"
          label="클래식"
          description="노말 아트워크"
          checked={embedUi === "classic"}
          onSelect={() => onEmbedUiChange("classic")}
        />
        <EmbedUiOption
          id="embed-ui-ios"
          name="embed-ui"
          label="iOS"
          description="iOS 스타일 플레이어"
          checked={embedUi === "ios"}
          onSelect={() => onEmbedUiChange("ios")}
        />
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
          <Button
            variant="outline"
            disabled={!youtubeOfficialSnippet}
            onClick={onCopyOfficial}
          >
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

function EmbedUiOption({
  id,
  name,
  label,
  description,
  checked,
  onSelect,
}: {
  id: string;
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 text-sm transition-colors dark:bg-zinc-900 ${
        checked
          ? "border-amber-400/80 bg-amber-50/80 dark:border-amber-500/50 dark:bg-amber-950/30"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800"
      }`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
      />
      <span>
        <span className="font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
          {description}
        </span>
      </span>
    </label>
  );
}
