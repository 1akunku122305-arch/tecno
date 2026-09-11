"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MentorListItem } from "@/types";
import { createBookingAction } from "@/services/booking-actions";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/badge";
import { FieldError, FormMessage, Input, Label, Select, Textarea } from "@/components/ui/form";
import { dayName, formatPrice } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DURATIONS = [30, 60, 90] as const;

export function BookingForm({
  mentor,
  subjects,
  initialSubjectId,
}: {
  mentor: MentorListItem;
  /** Subjects taught by this mentor (from the mentor profile, not the whole catalog). */
  subjects: { id: string; name: string }[];
  initialSubjectId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? "");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState<30 | 60 | 90>(60);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function validate(): string {
    if (!subjectId) return "Pilih mata kuliah.";
    if (topic.trim().length < 3) return "Topik/materi minimal 3 karakter.";
    if (!date) return "Pilih tanggal.";
    if (!time) return "Pilih waktu mulai.";
    return "";
  }

  function goReview(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (!err) setStep(2);
  }

  function confirm() {
    setError("");
    startTransition(async () => {
      const res = await createBookingAction({
        mentorId: mentor.mentor_id,
        subjectId,
        topic,
        date,
        startTime: time,
        durationMinutes: duration,
        price: mentor.price_per_session,
        notes,
      });
      if (!res.ok) {
        setError(res.error ?? "Gagal membuat booking.");
        return;
      }
      router.push(`/student/bookings/${res.bookingId}?created=1`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Review panel */}
      <div className="flex items-center gap-3 rounded-none border border-ink-200 bg-ink-50/60 p-4">
        <Avatar src={mentor.avatar_url} name={mentor.full_name} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-bold text-ink-950">
            {mentor.full_name ?? "Mentor"}
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
          </p>
          <p className="truncate text-xs text-ink-500">{mentor.headline ?? mentor.major}</p>
          {mentor.avg_rating !== null && (
            <p className="text-xs text-ink-600">
              ⭐ {mentor.avg_rating.toFixed(1)} · {mentor.review_count} ulasan
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-extrabold text-ink-950">{formatPrice(mentor.price_per_session)}</p>
          <p className="text-[11px] text-ink-400">per sesi</p>
        </div>
      </div>

      {error && <FormMessage variant="error">{error}</FormMessage>}

      {step === 1 ? (
        <form onSubmit={goReview} className="space-y-5 rounded-none border border-ink-200/80 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="subject">Mata Kuliah</Label>
              <Select id="subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                <option value="">Pilih mata kuliah</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Durasi</Label>
              <div id="duration" className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Durasi sesi">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={duration === d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "h-11 rounded-none border text-sm font-semibold transition-colors",
                      duration === d
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-600 hover:border-ink-300"
                    )}
                  >
                    {d} mnt
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Tanggal Sesi</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="time">Waktu Mulai</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label htmlFor="topic">Topik / Materi</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: UTS Struktur Data bab linked list"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Catatan untuk Mentor (opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ceritakan singkat kendala akademikmu…"
            />
          </div>

          <FieldError message={error} />
          <div className="flex justify-end">
            <Button type="submit">Lanjut ke Review</Button>
          </div>
        </form>
      ) : (
        <div className="rounded-none border border-ink-200/80 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink-950">Ringkasan Booking</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-ink-100 pb-2">
              <dt className="text-ink-500">Mata kuliah</dt>
              <dd className="font-semibold text-ink-900">{subjects.find((s) => s.id === subjectId)?.name ?? "-"}</dd>
            </div>
            <div className="flex justify-between border-b border-ink-100 pb-2">
              <dt className="text-ink-500">Topik</dt>
              <dd className="max-w-[60%] text-right font-semibold text-ink-900">{topic}</dd>
            </div>
            <div className="flex justify-between border-b border-ink-100 pb-2">
              <dt className="text-ink-500">Jadwal</dt>
              <dd className="font-semibold text-ink-900">
                {date} · {time}–{timeEnd(time, duration)}
              </dd>
            </div>
            <div className="flex justify-between border-b border-ink-100 pb-2">
              <dt className="text-ink-500">Durasi</dt>
              <dd className="font-semibold text-ink-900">{duration} menit</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Biaya sesi</dt>
              <dd className="font-extrabold text-ink-950">{formatPrice(mentor.price_per_session)}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <Badge tone="amber">Payment integration coming soon</Badge>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              Pembayaran belum tersedia pada MVP. Biaya sesi dicatat untuk integrasi
              payment gateway (Midtrans/Xendit) di masa depan — tidak ada transaksi yang diproses.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={pending}>
              Kembali
            </Button>
            <Button type="button" size="lg" onClick={confirm} loading={pending}>
              {pending ? "Membuat Booking…" : "Konfirmasi Booking"}
            </Button>
          </div>
        </div>
      )}

      {/* Mentor availability hint */}
      <details className="rounded-none border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-600">
        <summary className="cursor-pointer font-semibold text-ink-800">Jadwal rutin mentor</summary>
        {mentor.availability.length > 0 ? (
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {mentor.availability.map((a) => (
              <li key={a.id} className="inline-flex items-center gap-2">
                <Badge tone="gray">{dayName(a.day_of_week)}</Badge>
                {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ink-500">Mentor belum mengatur jadwal rutin.</p>
        )}
      </details>
    </div>
  );
}

function timeEnd(start: string, duration: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + duration;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
