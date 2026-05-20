const DEV_FALLBACK_APP_URL = "http://localhost:3000";

/** `.env`의 `NEXT_PUBLIC_APP_URL` (끝 슬래시 제거) */
export function readAppUrlFromEnv(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "");
}

/** 홈 «베이스 URL» 기본값 — env 우선, 개발·빌드 시 env 없으면 localhost */
export function getDefaultAppUrl(): string {
  const fromEnv = readAppUrlFromEnv();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return "";
  return DEV_FALLBACK_APP_URL;
}

/** 입력 필드 placeholder용 */
export function getAppUrlPlaceholder(): string {
  const url = readAppUrlFromEnv();
  return url ? `예: ${url}` : `예: ${DEV_FALLBACK_APP_URL}`;
}
