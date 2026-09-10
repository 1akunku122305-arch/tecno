import { Alert } from "@/components/ui/badge";

/**
 * Shown instead of crashing when the app runs without Supabase credentials.
 * Keeps the demo/preview environment usable and makes setup obvious.
 */
export function SetupPanel() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Alert tone="info" title="Supabase belum dikonfigurasi">
        Dashboard membutuhkan koneksi ke Supabase. Isi environment variables lalu jalankan migration SQL.
      </Alert>

      <div className="rounded-2xl border border-ink-200/80 bg-white p-6">
        <h2 className="font-bold text-ink-950">Langkah setup</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-ink-600">
          <li>
            Buat project di{" "}
            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">
              supabase.com
            </a>
          </li>
          <li>
            Jalankan <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">supabase/migrations/20240101000000_init.sql</code>{" "}
            di SQL Editor
          </li>
          <li>
            Salin Project URL & anon key ke{" "}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">.env.local</code>
          </li>
          <li>
            Buat storage bucket <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">avatars</code> (public)
          </li>
          <li>Restart <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">npm run dev</code></li>
        </ol>
        <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          Untuk pengujian cepat: nonaktifkan email confirmation di Authentication → Providers → Email,
          dan set role admin pada akun pertama lewat SQL Editor:
          <code className="mt-2 block rounded bg-ink-800 px-3 py-2 text-[11px] text-white">
            update public.profiles set role = &apos;admin&apos;
            <br />
            where id = (select id from auth.users where email = &apos;admin@mentora.id&apos;);
          </code>
        </p>
      </div>
    </div>
  );
}
