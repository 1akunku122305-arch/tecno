// ---------------------------------------------------------------------------
// withTimeout — race any promise against a timer so a hanging upstream
// (e.g. a paused/unreachable Supabase project) degrades to a friendly error
// instead of blowing past Vercel's serverless execution limit ("Application
// error / Digest"). Used by PUBLIC server-rendered pages; the timer only
// rejects the race — the underlying promise is safely ignored afterwards.
// ---------------------------------------------------------------------------

export class TimeoutError extends Error {
  constructor(message = "Koneksi ke database lambat (timeout).") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function isTimeoutError(e: unknown): boolean {
  if (e instanceof TimeoutError) return true;
  const name =
    e instanceof DOMException || e instanceof Error
      ? e.name
      : typeof e === "object" && e !== null && "name" in e
        ? String((e as { name: unknown }).name)
        : "";
  const message =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e !== null && "message" in e
        ? String((e as { message: unknown }).message)
        : "";
  if (name === "TimeoutError" || name === "AbortError") return true;
  return message.length > 0 && /timed?\s?out|aborted/i.test(message);
}

/**
 * 5s cap for public-page database reads: a healthy Supabase query answers in
 * well under a second, while Vercel Hobby kills functions after 10s — so we
 * always leave headroom for cold starts and rendering.
 */
export const PUBLIC_DB_TIMEOUT_MS = 5000;

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = PUBLIC_DB_TIMEOUT_MS,
  message?: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(message)), ms);
  });
  // Mark the original promise as handled either way so a late rejection
  // after the race settles never surfaces as an unhandled rejection.
  promise.then(
    () => clearTimeout(timer),
    () => clearTimeout(timer)
  );
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
