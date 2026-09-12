import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Deployment diagnostics — visit /api/health on Vercel to verify the
 * deployment without exposing any secrets. Never returns key material.
 */
export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const looksPlaceholder = (v: string) =>
    v.length === 0 ||
    /YOUR_PROJECT_REF|YOUR_SUPABASE|XXXX|PASTE-|REPLACE/i.test(v);

  const supabase =
    !url || !key || !url.startsWith("https://")
      ? "missing"
      : looksPlaceholder(url) || looksPlaceholder(key)
        ? "placeholder"
        : "configured";

  let host: string | null = null;
  try {
    host = supabase === "configured" ? new URL(url).host : null;
  } catch {
    host = null;
  }

  return NextResponse.json({
    status: "ok",
    app: "mentora",
    time: new Date().toISOString(),
    supabase,
    // Host only (e.g. xyzcompany.supabase.co) — safe to share in screenshots.
    supabaseHost: host,
  });
}
