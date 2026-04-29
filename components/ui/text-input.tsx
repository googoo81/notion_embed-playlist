import type { TextInputProps } from "@/types/component-props";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-0 focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600";

export function TextInput({ className = "", ...props }: TextInputProps) {
  return <input className={`${inputClass} ${className}`.trim()} {...props} />;
}
