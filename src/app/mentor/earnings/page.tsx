import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MENTOR_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Alert } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Pendapatan" };
export const dynamic = "force-dynamic";

export default async function MentorEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <DashboardShell
      items={NAV}
      current="earnings"
      role="mentor"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={configured ? await getUnreadCount(supabase, user?.id ?? "") : 0}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Pendapatan</h1>
      </div>
      <Alert tone="info" title="Pendapatan belum tersedia pada MVP.">
        Struktur tabel <code className="rounded bg-brand-100 px-1">payments</code> sudah siap —
        pendapatan mentor akan dihitung dari pembayaran yang tercatat setelah integrasi
        payment gateway (Midtrans/Xendit) dan skema komisi platform diaktifkan.
      </Alert>
    </DashboardShell>
  );
}
