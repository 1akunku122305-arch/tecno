import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/services/notification.service";
import { getCategories, getSubjects } from "@/services/catalog.service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MENTOR_NAV as NAV } from "@/components/dashboard/nav";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { ProfileForm } from "@/components/profile/profile-form";
import { MentorProfileEditor } from "@/components/mentor/mentor-profile-editor";
import { MissingMentorProfile } from "@/components/mentor/missing-mentor-profile";

export const metadata: Metadata = { title: "Profil Mentor" };
export const dynamic = "force-dynamic";

export default async function MentorProfilePage() {
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
    .select("*")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let subjects: Awaited<ReturnType<typeof getSubjects>> = [];
  let currentSubjectIds: string[] = [];
  let currentTopics: string[] = [];
  if (configured && mentor) {
    const [cats, subs, mentorSubs, mentorTopics] = await Promise.all([
      getCategories(supabase),
      getSubjects(supabase),
      supabase.from("mentor_subjects").select("subject_id").eq("mentor_id", mentor.id),
      supabase
        .from("mentor_topics")
        .select("topic:topics(name)")
        .eq("mentor_id", mentor.id),
    ]);
    categories = cats;
    subjects = subs;
    currentSubjectIds = (mentorSubs.data ?? []).map((r) => (r as unknown as { subject_id: string }).subject_id);
    currentTopics = (mentorTopics.data ?? [])
      .map((r) => {
        const t = (r as unknown as { topic: { name: string } | { name: string }[] }).topic;
        return (Array.isArray(t) ? t[0]?.name : t?.name) ?? "";
      })
      .filter(Boolean);
  }

  return (
    <DashboardShell
      items={NAV}
      current="profile"
      role="mentor"
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
      unreadNotifications={configured ? await getUnreadCount(supabase, user?.id ?? "") : 0}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-950">Profil Mentor</h1>
          <p className="mt-1 text-sm text-ink-500">
            Data ini ditampilkan pada profil publik dan digunakan dalam pencocokan.
          </p>
        </div>

        {!configured && <SetupPanel />}
        {configured && mentor && (
          <>
            <section className="rounded-none border border-ink-200/80 bg-white p-5 sm:p-6">
              <h2 className="mb-4 font-bold text-ink-950">Informasi Dasar</h2>
              <ProfileForm
                name={profile?.full_name ?? ""}
                university={profile?.university ?? ""}
                major={profile?.major ?? ""}
                semester={""}
                bio={profile?.bio ?? ""}
                avatarUrl={profile?.avatar_url}
                showSemester={false}
              />
            </section>
            <MentorProfileEditor
              mentor={mentor}
              categories={categories}
              subjects={subjects}
              currentSubjectIds={currentSubjectIds}
              currentTopics={currentTopics}
            />
          </>
        )}
        {configured && !mentor && (
          <SetupPanel />
        )}
      </div>
    </DashboardShell>
  );
}
