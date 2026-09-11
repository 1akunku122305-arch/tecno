import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getRequestUserId } from "@/lib/auth/session";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { EmptyState } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { Stars } from "@/components/mentor/stars";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";

export const metadata: Metadata = { title: "Review" };
export const dynamic = "force-dynamic";

export default async function MentorReviewsPage() {
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

  let reviews: {
    id: string;
    rating: number;
    review: string | null;
    created_at: string;
    reviewer: { full_name: string | null; avatar_url: string | null } | null;
  }[] = [];
  if (configured && mentor) {
    const { data } = await supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)")
      .eq("mentor_id", mentor.id)
      .order("created_at", { ascending: false });
    reviews = (data ?? []) as typeof reviews;
  }

  const avg = reviews.length
    ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
    : null;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-950">Review</h1>
        <p className="mt-1 text-sm text-ink-500">
          Rating rata-rata:{" "}
          <b className="text-ink-900">{avg !== null ? `${avg} ⭐` : "Belum ada"}</b> dari {reviews.length} ulasan —
          dihitung langsung dari database.
        </p>
      </div>

      {!configured && <SetupPanel />}
      {configured && reviews.length === 0 && (
        <EmptyState
          icon={<Star className="h-10 w-10" aria-hidden />}
          title="Belum ada review."
          description="Mahasiswa dapat memberi review setelah sesi selesai."
        />
      )}
      {configured && reviews.length > 0 && (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-none border border-ink-200/80 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={r.reviewer?.avatar_url} name={r.reviewer?.full_name} size={36} />
                  <div>
                    <p className="text-sm font-bold text-ink-950">{r.reviewer?.full_name ?? "Mahasiswa"}</p>
                    <p className="text-xs text-ink-400">{formatDate(r.created_at)}</p>
                  </div>
                </div>
                <Stars rating={r.rating} />
              </div>
              {r.review && <p className="mt-3 text-sm leading-relaxed text-ink-600">{r.review}</p>}
            </li>
          ))}
        </ul>
      )}

    </>
  );
}
