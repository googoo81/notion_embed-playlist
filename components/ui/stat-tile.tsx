import type { StatTileProps } from "@/types/component-props";

export function StatTile({ caption, children, footer, className = "" }: StatTileProps) {
  return (
    <div
      className={`rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900 ${className}`.trim()}
    >
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{caption}</div>
      <div className="mt-1 break-all font-mono">{children}</div>
      {footer ? <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{footer}</div> : null}
    </div>
  );
}
