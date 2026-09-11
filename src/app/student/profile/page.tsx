import type { Metadata } from "next";
import { getAuthContext } from "@/lib/auth/session";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
  const { supabase, user, profile } = await getAuthContext();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <>
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

    </>
  );
}
