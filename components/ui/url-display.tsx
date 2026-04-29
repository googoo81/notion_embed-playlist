import type { UrlDisplayProps } from "@/types/component-props";

export function UrlDisplay({ children, className = "" }: UrlDisplayProps) {
  return (
    <div
      className={`mt-2 rounded-xl border border-zinc-200 bg-white p-3 text-xs font-mono text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
