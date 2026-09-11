import type { Metadata } from "next";
import { Alert } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Pendapatan" };
export const dynamic = "force-dynamic";

export default async function MentorEarningsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Pendapatan</h1>
      </div>
      <Alert tone="info" title="Pendapatan belum tersedia pada MVP.">
        Struktur tabel <code className="rounded bg-brand-100 px-1">payments</code> sudah siap —
        pendapatan mentor akan dihitung dari pembayaran yang tercatat setelah integrasi
        payment gateway (Midtrans/Xendit) dan skema komisi platform diaktifkan.
      </Alert>
    </>
  );
}
