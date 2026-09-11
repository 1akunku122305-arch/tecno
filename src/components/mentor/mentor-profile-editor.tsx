"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category, MentorProfile, Subject } from "@/types";
import {
  saveMentorProfile,
  saveMentorSubjects,
  saveMentorTopics,
  submitMentorForReview,
} from "@/services/mentor-onboarding.service";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function MentorProfileEditor({
  mentor,
  categories,
  subjects,
  currentSubjectIds,
  currentTopics,
}: {
  mentor: MentorProfile;
  categories: Category[];
  subjects: Subject[];
  currentSubjectIds: string[];
  currentTopics: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    headline: mentor.headline ?? "",
    bio: mentor.bio ?? "",
    university: mentor.university ?? "",
    major: mentor.major ?? "",
    yearsExperience: String(mentor.years_experience ?? 0),
    pricePerSession: String(mentor.price_per_session ?? 0),
    categoryId: mentor.category_id ?? "",
    meetingUrl: mentor.meeting_url ?? "",
  });
  const [selected, setSelected] = useState<string[]>(currentSubjectIds);
  const [topicsText, setTopicsText] = useState(currentTopics.join("\n"));
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleSubject(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function saveAll(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatusMsg("");
    startTransition(async () => {
      const res = await saveMentorProfile({
        headline: form.headline,
        bio: form.bio,
        university: form.university,
        major: form.major,
        yearsExperience: Number(form.yearsExperience),
        pricePerSession: Number(form.pricePerSession),
        categoryId: form.categoryId || null,
        meetingUrl: form.meetingUrl,
      });
      if (!res.ok) return setError(res.error ?? "Gagal menyimpan profil mentor.");

      const subRes = await saveMentorSubjects(selected);
      if (!subRes.ok) return setError(subRes.error ?? "Gagal menyimpan mata kuliah.");

      const topics = topicsText
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);
      if (topics.length > 0 && selected.length > 0) {
        const topicRes = await saveMentorTopics(topics, selected[0]);
        if (!topicRes.ok) return setError(topicRes.error ?? "Gagal menyimpan topik.");
      }

      setStatusMsg("Profil mentor berhasil disimpan.");
      router.refresh();
    });
  }

  function applyReview() {
    setError("");
    setStatusMsg("");
    startTransition(async () => {
      const res = await submitMentorForReview();
      if (!res.ok) setError(res.error ?? "Gagal mengajukan verifikasi.");
      else {
        setStatusMsg("Profil dikirim untuk diverifikasi admin.");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={saveAll} className="space-y-6">
      {/* Status */}
      <section className="rounded-none border border-ink-200/80 bg-white p-5" id="verifikasi">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-ink-950">Status Verifikasi</h2>
            <p className="mt-0.5 text-sm text-ink-500">
              {mentor.status === "approved"
                ? "✓ Mentor kamu sudah terverifikasi dan tampil di pencarian."
                : mentor.status === "rejected"
                  ? "Pengajuan ditolak admin. Perbarui profil lalu ajukan lagi."
                  : "Menunggu verifikasi admin. Lengkapi profil untuk mempercepat proses."}
            </p>
          </div>
          {mentor.status !== "approved" && (
            <Button type="button" variant="secondary" onClick={applyReview} loading={pending}>
              Ajukan Verifikasi
            </Button>
          )}
        </div>
      </section>

      {/* Info mentor */}
      <section className="rounded-none border border-ink-200/80 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-bold text-ink-950">Informasi Mentor</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="Contoh: Asisten dosen Struktur Data, 5 tahun mengajar"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Ceritakan pengalaman dan keahlian mengajarmu…"
              maxLength={1000}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="university">Universitas</Label>
              <Input id="university" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="major">Program Studi</Label>
              <Input id="major" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="category">Bidang Utama</Label>
              <Select id="category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Pilih bidang</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="exp">Pengalaman (tahun)</Label>
              <Input id="exp" type="number" min={0} max={50} value={form.yearsExperience} onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="price">Harga per Sesi (Rp)</Label>
              <Input id="price" type="number" min={0} step={5000} value={form.pricePerSession} onChange={(e) => setForm({ ...form, pricePerSession: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label htmlFor="meeting">Link Meeting Default (opsional)</Label>
            <Input
              id="meeting"
              type="url"
              value={form.meetingUrl}
              onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
              placeholder="https://meet.google.com/…"
            />
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="rounded-none border border-ink-200/80 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-ink-950">Mata Kuliah yang Diajarkan</h2>
        <p className="mt-0.5 text-sm text-ink-500">Pilih lebih dari satu mata kuliah.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {subjects.map((s) => {
            const active = selected.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSubject(s.id)}
                className={cn(
                  "rounded-none border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 text-ink-600 hover:border-ink-300"
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <Label htmlFor="topics">Topik/Materi Khusus (satu per baris, terkait mata kuliah pertama)</Label>
          <Textarea
            id="topics"
            value={topicsText}
            onChange={(e) => setTopicsText(e.target.value)}
            placeholder={"Contoh:\nDynamic programming\nGraph traversal\nComplexity analysis"}
          />
        </div>
      </section>

      {error && <FormMessage variant="error">{error}</FormMessage>}
      {statusMsg && <FormMessage variant="success">{statusMsg}</FormMessage>}
      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={pending}>
          Simpan Semua Perubahan
        </Button>
      </div>
    </form>
  );
}
