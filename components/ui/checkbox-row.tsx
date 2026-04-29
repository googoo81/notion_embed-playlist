import type { CheckboxRowProps } from "@/types/component-props";

export function CheckboxRow({ label, className = "", ...props }: CheckboxRowProps) {
  return (
    <label
      className={`flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-900 ${className}`.trim()}
    >
      <span className="font-medium">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-amber-400"
        {...props}
      />
    </label>
  );
}
