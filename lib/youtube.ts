export function extractYouTubePlaylistId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw) && !raw.includes("/") && !raw.includes("?")) {
    return raw;
  }

  try {
    const url = new URL(raw);
    const list = url.searchParams.get("list");
    if (list && /^[a-zA-Z0-9_-]{10,}$/.test(list)) return list;
  } catch {
    // ignore
  }

  const m = raw.match(/[?&]list=([a-zA-Z0-9_-]{10,})/);
  if (m?.[1]) return m[1];

  return null;
}

export function extractYouTubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw) && !raw.includes("/") && !raw.includes("?")) {
    return raw;
  }

  try {
    const url = new URL(raw);

    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace("/", "");
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    const m = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m?.[1]) return m[1];

    const s = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (s?.[1]) return s[1];
  } catch {
    // ignore
  }

  const m = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m?.[1]) return m[1];

  return null;
}
