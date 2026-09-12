"use client";

/**
 * Last-resort error boundary (replaces the whole document, so it must render
 * its own <html>/<body>). Only reached when the root layout itself throws.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f5ef",
          color: "#1a1916",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 480 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              opacity: 0.6,
            }}
          >
            Mentora — gangguan teknis
          </p>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              textTransform: "uppercase",
              margin: "12px 0 0",
            }}
          >
            Halaman gagal dimuat
          </h1>
          <p style={{ marginTop: 16, lineHeight: 1.6 }}>
            Terjadi kesalahan tak terduga. Silakan muat ulang halaman atau
            kembali lagi nanti.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              height: 48,
              padding: "0 24px",
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: "#0c0c0a",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
