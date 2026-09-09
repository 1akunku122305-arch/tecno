import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { STUDENT_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
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
      current="profile"
      role="student"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={configured ? await getUnreadCount(supabase, user?.id ?? "") : 0}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-ink-950">Profil Saya</h1>
          <p className="mt-1 text-sm text-ink-500">Data ini membantu mentor dan pencarianmu.</p>
        </div>
        {configured ? (
          <ProfileForm
            name={profile?.full_name ?? ""}
            university={profile?.university ?? ""}
            major={profile?.major ?? ""}
            semester={profile?.semester ? String(profile.semester) : ""}
            bio={profile?.bio ?? ""}
            avatarUrl={profile?.avatar_url}
          />
        ) : (
          <SetupPanel />
        )}
      </div>
    </DashboardShell>
  );
}
