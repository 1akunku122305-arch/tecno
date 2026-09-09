"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MentorAvailability } from "@/types";
import {
  deleteAvailability,
  saveAvailability,
  toggleAvailability,
} from "@/services/mentor-onboarding.service";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label, Select } from "@/components/ui/form";
import { dayName } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export function AvailabilityManager({ slots }: { slots: MentorAvailability[] }) {
  const router = useRouter();
  const [dayOfWeek, setDayOfWeek] = useState(6);
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await saveAvailability({ dayOfWeek, startTime, endTime, isAvailable: true });
      if (!res.ok) setError(res.error ?? "Gagal menyimpan jadwal.");
      else router.refresh();
    });
  }

  function remove(id: string) {
    setError("");
    startTransition(async () => {
      const res = await deleteAvailability(id);
      if (!res.ok) setError(res.error ?? "Gagal menghapus jadwal.");
      else router.refresh();
    });
  }

  function toggle(id: string, isAvailable: boolean) {
    startTransition(async () => {
      await toggleAvailability(id, isAvailable);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={add} className="space-y-4 rounded-2xl border border-ink-200/80 bg-white p-5">
        <h2 className="font-bold text-ink-950">Tambah Slot Jadwal</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="day">Hari</Label>
            <Select id="day" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{dayName(d)}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="start">Jam Mulai</Label>
            <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="end">Jam Selesai</Label>
            <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
        </div>
        {error && <FormMessage variant="error">{error}</FormMessage>}
        <Button type="submit" loading={pending}>Tambah Jadwal</Button>
      </form>

      <div className="rounded-2xl border border-ink-200/80 bg-white p-5">
        <h2 className="font-bold text-ink-950">Jadwal Saat Ini</h2>
        {slots.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">
            Belum ada jadwal. Tambahkan slot agar mahasiswa dapat membook sesi.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {slots.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {dayName(s.day_of_week)} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </p>
                  <p className="text-[11px] text-ink-400">{s.is_available ? "Tersedia" : "Tidak tersedia"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-600">
                    <input
                      type="checkbox"
                      checked={s.is_available}
                      onChange={() => toggle(s.id, s.is_available)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    Aktif
                  </label>
                  <button
                    onClick={() => remove(s.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    aria-label={`Hapus jadwal ${dayName(s.day_of_week)}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
