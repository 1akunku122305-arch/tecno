"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createClientBrowser } from "@/lib/supabase/client";
import type { Category, Subject } from "@/types";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const DURATIONS = [30, 60, 90] as const;

export function FindMentorForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState<30 | 60 | 90>(60);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const supabase = typeof window !== "undefined" ? createClientBrowser() : null;
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (!supabase) return;
    if (!categoryId) {
      setSubjects([]);
      setSubjectId("");
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("name");
      if (!active) return;
      setSubjects((error || !data ? [] : data) as Subject[]);
    })();
    return () => {
      active = false;
    };
  }, [categoryId, supabase]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!categoryId) return setError("Pilih bidang akademik.");
    if (!subjectId) return setError("Pilih mata kuliah.");
    if (topic.trim().length < 2) return setError("Jelaskan topik/materi yang kamu butuhkan.");
    if (!date) return setError("Pilih tanggal sesi.");
    if (!time) return setError("Pilih waktu sesi.");
    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax))
      return setError("Budget minimum tidak boleh lebih besar dari maksimum.");

    const params = new URLSearchParams({
      category_id: categoryId,
      subject_id: subjectId,
      topic: topic.trim(),
      date,
      start_time: time,
      duration: String(duration),
    });
    if (budgetMin) params.set("budget_min", budgetMin);
    if (budgetMax) params.set("budget_max", budgetMax);

    startTransition(() => router.push(`/find-mentor/results?${params.toString()}`));
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="font-semibold">Supabase belum dikonfigurasi.</p>
        <p className="mt-1">
          Isi <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code>, lalu jalankan migration SQL di Supabase.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-ink-200/80 bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Bidang Akademik</Label>
          <Select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Pilih bidang</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="subject">Mata Kuliah</Label>
          <Select
            id="subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!categoryId}
            required
          >
            <option value="">{categoryId ? "Pilih mata kuliah" : "Pilih bidang dulu"}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="topic">Topik / Materi</Label>
        <Input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Contoh: dynamic programming, jurnal penyesuaian, atau presentasi bahasa Inggris"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="date">Tanggal</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="time">Waktu Mulai</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="duration" className="block">Durasi</Label>
          <div id="duration" className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Durasi sesi">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={duration === d}
                onClick={() => setDuration(d)}
                className={cn(
                  "h-11 rounded-xl border text-sm font-semibold transition-colors",
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
          <Label htmlFor="budget_min">Budget Minimum (Rp)</Label>
          <Input
            id="budget_min"
            type="number"
            min={0}
            step={5000}
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            placeholder="50000"
          />
        </div>
        <div>
          <Label htmlFor="budget_max">Budget Maksimum (Rp)</Label>
          <Input
            id="budget_max"
            type="number"
            min={0}
            step={5000}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="150000"
          />
        </div>
      </div>

      <FieldError message={error} />
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        <Search className="h-4 w-4" aria-hidden /> Cari Mentor
      </Button>
    </form>
  );
}
