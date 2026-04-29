import type { HomePageShellProps } from "@/types/home-props";

export function HomePageShell({ children }: HomePageShellProps) {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-10 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="w-full max-w-3xl">{children}</main>
    </div>
  );
}
