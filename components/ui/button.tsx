import type { ButtonProps, ButtonVariant } from "@/types/component-props";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900",
  outline:
    "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-black dark:text-zinc-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${variants[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
