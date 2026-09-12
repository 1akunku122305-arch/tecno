import Link from "next/link";

/** Friendly 404 in the newspaper style. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-ink-500">
        Arsip tidak ditemukan
      </p>
      <h1 className="font-masthead mt-3 text-6xl font-black uppercase text-ink-950">
        404
      </h1>
      <div className="rule-double mx-auto mt-6 w-full max-w-md" />
      <p className="mt-6 max-w-md text-ink-700">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan. Coba kembali
        ke beranda atau cari mentor langsung.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center bg-ink-950 px-6 text-base font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ink-800"
        >
          Ke beranda
        </Link>
        <Link
          href="/find-mentor"
          className="inline-flex h-12 items-center justify-center border border-ink-900 bg-white px-6 text-base font-semibold uppercase tracking-wide text-ink-900 transition-colors hover:bg-ink-950 hover:text-white"
        >
          Cari mentor
        </Link>
      </div>
    </main>
  );
}
