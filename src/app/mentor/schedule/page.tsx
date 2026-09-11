import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getRequestUserId } from "@/lib/auth/session";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { AvailabilityManager } from "@/components/mentor/availability-manager";
import type { MentorAvailability } from "@/types";

export const metadata: Metadata = { title: "Jadwal" };
export const dynamic = "force-dynamic";

export default async function MentorSchedulePage() {
  const supabase = await createClient();
  const userId = await getRequestUserId();
  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", userId ?? "")
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
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Jadwal</h1>
        <p className="mt-1 text-sm text-ink-500">
          Slot jadwal ini menjadi acuan sistem saat mencocokkan dan memvalidasi booking.
        </p>
      </div>
      {configured ? <AvailabilityManager slots={slots} /> : <SetupPanel />}

    </>
  );
}
