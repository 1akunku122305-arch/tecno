import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/services/notification.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MENTOR_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { AvailabilityManager } from "@/components/mentor/availability-manager";
import type { MentorAvailability } from "@/types";

export const metadata: Metadata = { title: "Jadwal" };
export const dynamic = "force-dynamic";

export default async function MentorSchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let slots: MentorAvailability[] = [];
  if (configured && mentor) {
    const { data } = await supabase
      .from("mentor_availability")
      .select("*")
      .eq("mentor_id", mentor.id)
      .order("day_of_week")
      .order("start_time");
    slots = data ?? [];
  }

  return (
    <DashboardShell
      items={NAV}
      current="schedule"
      role="mentor"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={configured ? await getUnreadCount(supabase, user?.id ?? "") : 0}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Jadwal</h1>
        <p className="mt-1 text-sm text-ink-500">
          Slot jadwal ini menjadi acuan sistem saat mencocokkan dan memvalidasi booking.
        </p>
      </div>
      {configured ? <AvailabilityManager slots={slots} /> : <SetupPanel />}
    </DashboardShell>
  );
}
