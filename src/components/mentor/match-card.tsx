import Link from "next/link";
import type { MatchResult } from "@/types";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Stars } from "./stars";
import { dayName, formatPrice } from "@/lib/utils";
import { BookCheck, Clock, ShieldCheck } from "lucide-react";

export function MatchCard({ match }: { match: MatchResult }) {
  const m = match.mentor;
  const nextSlots = m.availability.slice(0, 2);

  return (
    <article className="flex flex-col rounded-2xl border border-ink-200/80 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={m.avatar_url} name={m.full_name} size={52} />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-ink-950">{m.full_name ?? "Mentor"}</h3>
              {m.status === "approved" && (
                <span title="Verified Mentor">
                  <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden />
                </span>
              )}
            </div>
            <p className="text-xs text-ink-500">{m.headline ?? (m.major ? `Mentor ${m.major}` : "Mentor Akademik")}</p>
          </div>
        </div>
        <div className="rounded-xl bg-brand-50 px-2.5 py-1.5 text-center">
          <p className="text-lg font-extrabold leading-none text-brand-700">{match.score}%</p>
          <p className="mt-0.5 text-[10px] font-medium text-brand-600">cocok</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {m.category_name && <Badge tone="brand">{m.category_name}</Badge>}
        {m.subjects.slice(0, 2).map((s) => (
          <Badge key={s.id} tone="gray">{s.name}</Badge>
        ))}
        {m.subjects.length > 2 && <Badge tone="gray">+{m.subjects.length - 2} lagi</Badge>}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-ink-600">
        <span className="inline-flex items-center gap-1">
          <Stars rating={m.avg_rating} />
          {m.avg_rating ? <b>{m.avg_rating.toFixed(1)}</b> : <span className="text-ink-400">Belum ada rating</span>}
          {m.review_count > 0 && <span className="text-ink-400">({m.review_count})</span>}
        </span>
        <span className="text-ink-300">•</span>
        <span>{m.completed_sessions} sesi</span>
        <span className="text-ink-300">•</span>
        <span>{m.years_experience} thn pengalaman</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
        <div>
          <p className="text-sm font-bold text-ink-950">{formatPrice(m.price_per_session)}</p>
          <p className="text-[11px] text-ink-400">per sesi</p>
        </div>
        {nextSlots.length > 0 ? (
          <div className="text-right text-[11px] text-ink-500">
            {nextSlots.map((s) => (
              <p key={s.id} className="inline-flex items-center gap-1 after:mx-1.5">
                <Clock className="h-3 w-3" aria-hidden />
                {dayName(s.day_of_week)} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-ink-400">Jadwal belum diatur</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/mentors/${m.mentor_id}`}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-ink-200 text-sm font-semibold text-ink-800 hover:bg-ink-50"
        >
          Lihat Profil
        </Link>
        <Link
          href={`/book/${m.mentor_id}?subject_id=${m.subjects[0]?.id ?? ""}&topic=${encodeURIComponent("")}`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <BookCheck className="h-4 w-4" aria-hidden /> Booking
        </Link>
      </div>
    </article>
  );
}
