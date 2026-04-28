export function extractYouTubePlaylistId(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  // If it's already a playlist id (usually starts with "PL", but not always)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw) && !raw.includes("/") && !raw.includes("?")) {
    return raw;
  }

  // Try parse as URL and read list param
  try {
    const url = new URL(raw);
    const list = url.searchParams.get("list");
    if (list && /^[a-zA-Z0-9_-]{10,}$/.test(list)) return list;
  } catch {
    // ignore
  }

  // Fallback: find list=... anywhere
  const m = raw.match(/[?&]list=([a-zA-Z0-9_-]{10,})/);
  if (m?.[1]) return m[1];

  return null;
}

export function extractYouTubeVideoId(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  // If it's already a likely video id (11 chars, but keep it a bit lenient)
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw) && !raw.includes("/") && !raw.includes("?")) {
    return raw;
  }

  try {
    const url = new URL(raw);

    // https://www.youtube.com/watch?v=VIDEO_ID
    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

    // https://youtu.be/VIDEO_ID
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace("/", "");
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // https://www.youtube.com/embed/VIDEO_ID
    const m = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m?.[1]) return m[1];

    // https://www.youtube.com/shorts/VIDEO_ID
    const s = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (s?.[1]) return s[1];
  } catch {
    // ignore
  }

  // Fallback: find v=... anywhere
  const m = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m?.[1]) return m[1];

  return null;
}

