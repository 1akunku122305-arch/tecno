import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getSubjects } from "@/services/catalog.service";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { SubjectManager } from "@/components/admin/subject-manager";

export const metadata: Metadata = { title: "Kelola Mata Kuliah" };
export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
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

  const [categories, subjects] = configured
    ? await Promise.all([
        getCategories(supabase, { includeInactive: true }),
        getSubjects(supabase, undefined, { includeInactive: true }),
      ])
    : [[], []];

  return (
    <DashboardShell
      items={NAV}
      current="subjects"
      role="admin"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={configured ? await getUnreadCount(supabase, user?.id ?? "") : 0}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Mata Kuliah</h1>
        <p className="mt-1 text-sm text-ink-500">
          Mata kuliah selalu terhubung ke kategori — tambah tanpa mengubah kode.
        </p>
      </div>
      {configured ? <SubjectManager categories={categories} subjects={subjects} /> : <SetupPanel />}
    </DashboardShell>
  );
}
