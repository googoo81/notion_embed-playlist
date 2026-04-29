export type SearchParamsRecord =
  | Record<string, string | string[] | undefined>
  | undefined;

export type AppSearchParams =
  | SearchParamsRecord
  | Promise<NonNullable<SearchParamsRecord>>
  | undefined;

const TRUTHY_STRINGS = new Set([
  "1",
  "true",
  "yes",
  "y",
  "on",
]);

const FALSY_STRINGS = new Set([
  "0",
  "false",
  "no",
  "n",
  "off",
]);

export function isPromiseLike<T>(value: unknown): value is Promise<T> {
  if (typeof value !== "object" || value === null) return false;
  const then = (value as { then?: unknown }).then;
  return typeof then === "function";
}

export async function resolveSearchParams(
  searchParams: AppSearchParams,
): Promise<SearchParamsRecord> {
  if (!searchParams) return undefined;
  if (isPromiseLike<NonNullable<SearchParamsRecord>>(searchParams)) {
    return await searchParams;
  }
  return searchParams;
}

export function getSearchParam(
  searchParams: SearchParamsRecord,
  key: string,
): string | undefined {
  if (!searchParams) return undefined;
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseBoolParam(
  raw: string | undefined,
  defaultValue: boolean,
): boolean {
  if (raw == null) return defaultValue;
  const normalized = String(raw).trim().toLowerCase();
  if (TRUTHY_STRINGS.has(normalized)) return true;
  if (FALSY_STRINGS.has(normalized)) return false;
  return defaultValue;
}
