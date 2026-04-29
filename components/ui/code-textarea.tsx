import type { CodeTextareaProps } from "@/types/component-props";

const areaClass =
  "mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-xs font-mono outline-none dark:border-zinc-800 dark:bg-black";

export function CodeTextarea({ className = "", ...props }: CodeTextareaProps) {
  return <textarea className={`${areaClass} ${className}`.trim()} {...props} />;
}
