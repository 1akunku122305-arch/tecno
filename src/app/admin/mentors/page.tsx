import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listMentorsForAdmin } from "@/services/admin.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/ui/badge";
import { MentorStatusButtons } from "@/components/admin/mentor-status-buttons";
import { formatPrice } from "@/lib/utils";
import type { MentorStatus } from "@/types";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = { title: "Verifikasi Mentor" };
export const dynamic = "force-dynamic";

export default async function AdminMentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const validStatus = ["pending", "approved", "rejected"].includes(status ?? "");
  const mentors = configured
    ? await listMentorsForAdmin(supabase, validStatus ? (status as MentorStatus) : undefined)
    : [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-950">Verifikasi Mentor</h1>
          <p className="mt-1 text-sm text-ink-500">{mentors.length} profil mentor.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            { label: "Semua", value: "" },
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Ditolak", value: "rejected" },
          ].map((f) => (
            <a
              key={f.value}
              href={f.value ? `/admin/mentors?status=${f.value}` : "/admin/mentors"}
              className={
                "rounded-none px-3 py-2 font-semibold " +
                ((status ?? "") === f.value ? "bg-ink-900 text-white" : "border border-ink-200 bg-white text-ink-600")
              }
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {!configured && <SetupPanel />}
      {configured && mentors.length === 0 && (
        <EmptyState
          icon={<GraduationCap className="h-10 w-10" aria-hidden />}
          title="Belum ada mentor."
          description="Profil mentor yang mendaftar akan muncul di sini."
        />
      )}
      {configured && mentors.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {mentors.map((m: any) => (
            <li key={m.id} className="rounded-none border border-ink-200/80 bg-white p-5">
              <div className="flex items-start gap-3">
                <Avatar src={m.profile?.avatar_url} name={m.profile?.full_name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-950">{m.profile?.full_name ?? "-"}</p>
                  <p className="truncate text-xs text-ink-500">
                    {m.headline ?? "Belum ada headline"} · {m.university ?? "-"}
                  </p>
                  <p className="mt-1 text-xs text-ink-600">
                    {formatPrice(m.price_per_session)}/sesi · {m.years_experience} thn pengalaman
                  </p>
                </div>
                <span
                  className={
                    "rounded-none px-2.5 py-0.5 text-xs font-semibold " +
                    (m.status === "approved"
                      ? "bg-ink-100 text-ink-800"
                      : m.status === "rejected"
                        ? "bg-ink-100 text-ink-700"
                        : "bg-ink-100 text-ink-800")
                  }
                >
                  {m.status === "approved" ? "Approved" : m.status === "rejected" ? "Ditolak" : "Pending"}
                </span>
              </div>
              {m.bio && <p className="mt-3 line-clamp-2 text-sm text-ink-600">{m.bio}</p>}
              {m.status !== "approved" && <MentorStatusButtons mentorId={m.id} status={m.status} />}
            </li>
          ))}
        </ul>
      )}

    </>
  );
}
