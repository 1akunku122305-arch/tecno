"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary: any uncaught exception below the root layout
 * renders this friendly newspaper-styled page (with a retry button) instead
 * of the raw "Application error / Digest" screen.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[mentora] route error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-ink-500">
        Edisi sela — gangguan teknis
      </p>
      <h1 className="font-masthead mt-3 text-3xl font-black uppercase text-ink-950 sm:text-4xl">
        Halaman gagal dimuat
      </h1>
      <div className="rule-double mx-auto mt-6 w-full max-w-md" />
      <p className="mt-6 max-w-md text-ink-700">
        Terjadi kesalahan saat memuat halaman ini. Biasanya ini sementara —
        coba muat ulang, atau kembali lagi dalam beberapa saat.
      </p>
      {error?.digest && (
        <p className="mt-3 text-xs uppercase tracking-wide text-ink-400">
          Kode: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex h-12 items-center justify-center bg-ink-950 px-6 text-base font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ink-800"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center border border-ink-900 bg-white px-6 text-base font-semibold uppercase tracking-wide text-ink-900 transition-colors hover:bg-ink-950 hover:text-white"
        >
          Ke beranda
        </Link>
      </div>
    </main>
  );
}
