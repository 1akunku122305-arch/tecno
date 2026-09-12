import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

/**
 * How long the landing page waits for Supabase before giving up and
 * rendering with an empty list. Vercel's serverless functions have a hard
 * execution limit (10s on Hobby) — a hanging database connection used to
 * blow past it and produce "Application error / Digest" instead of a page.
 */
const PUBLIC_CATALOG_TIMEOUT_MS = 5000;

function looksLikePlaceholder(value: string): boolean {
  const v = value.trim().toUpperCase();
  return (
    v.length === 0 ||
    v.includes("YOUR_PROJECT_REF") ||
    v.includes("YOUR_SUPABASE") ||
    v.includes("XXXX") ||
    v.includes("PASTE-") ||
    v.includes("REPLACE")
  );
}

const TIMEOUT_MESSAGE =
  "Koneksi ke database lambat (timeout). Muat ulang halaman untuk mencoba lagi.";

function isTimeoutOrAbort(e: unknown): boolean {
  // supabase-js may surface an abort either as a thrown DOMException OR as a
  // plain { message } error object on the query result — handle both shapes.
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
 * Landing-page catalog read that NEVER crashes the page and NEVER hangs it:
 * missing/placeholder env vars, query failures, and slow/hanging database
 * connections all degrade to an empty list with a friendly message.
 */
export async function getPublicCategoriesSafe(): Promise<{
  categories: Category[];
  error: string | null;
}> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !key || !url.startsWith("https://")) {
    return { categories: [], error: "Supabase belum dikonfigurasi." };
  }
  if (looksLikePlaceholder(url) || looksLikePlaceholder(key)) {
    return {
      categories: [],
      error: "Supabase belum dikonfigurasi (masih memakai nilai contoh).",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .abortSignal(AbortSignal.timeout(PUBLIC_CATALOG_TIMEOUT_MS));

    if (error) {
      if (isTimeoutOrAbort(error)) return { categories: [], error: TIMEOUT_MESSAGE };
      return { categories: [], error: error.message };
    }
    return { categories: (data ?? []) as Category[], error: null };
  } catch (e) {
    if (isTimeoutOrAbort(e)) {
      return { categories: [], error: TIMEOUT_MESSAGE };
    }
    return {
      categories: [],
      error: e instanceof Error ? e.message : "Gagal memuat data.",
    };
  }
}
