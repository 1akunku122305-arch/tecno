"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category, Subject } from "@/types";
import {
  createSubjectAction,
  deleteSubjectAction,
  updateSubjectAction,
} from "@/services/admin-actions";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label, Select } from "@/components/ui/form";

export function SubjectManager({
  categories,
  subjects,
}: {
  categories: Category[];
  subjects: Subject[];
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!categoryId) return setError("Pilih kategori terlebih dahulu.");
    startTransition(async () => {
      const res = await createSubjectAction({ categoryId, name });
      if (!res.ok) setError(res.error ?? "Gagal menambah mata kuliah.");
      else {
        setName("");
        router.refresh();
      }
    });
  }

  function toggle(s: Subject) {
    setError("");
    startTransition(async () => {
      const res = await updateSubjectAction(s.id, { isActive: !s.is_active });
      if (!res.ok) setError(res.error ?? "Gagal memperbarui mata kuliah.");
      else router.refresh();
    });
  }

  function remove(s: Subject) {
    if (!confirm(`Hapus mata kuliah "${s.name}"?`)) return;
    setError("");
    startTransition(async () => {
      const res = await deleteSubjectAction(s.id);
      if (!res.ok) setError(res.error ?? "Gagal menghapus mata kuliah.");
      else router.refresh();
    });
  }

  const grouped = categories
    .map((c) => ({ ...c, items: subjects.filter((s) => s.category_id === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={create} className="h-fit space-y-4 rounded-none border border-ink-200/80 bg-white p-5">
        <h2 className="font-bold text-ink-950">Tambah Mata Kuliah</h2>
        <div>
          <Label htmlFor="sub-cat">Kategori</Label>
          <Select id="sub-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sub-name">Nama Mata Kuliah</Label>
          <Input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Algoritma dan Pemrograman" required />
        </div>
        {error && <FormMessage variant="error">{error}</FormMessage>}
        <Button type="submit" loading={pending}>Tambah</Button>
      </form>

      <div className="space-y-5 lg:col-span-2">
        {grouped.length === 0 && (
          <div className="rounded-none border border-dashed border-ink-200 p-8 text-center text-sm text-ink-500">
            Belum ada mata kuliah.
          </div>
        )}
        {grouped.map((g) => (
          <div key={g.id} className="rounded-none border border-ink-200/80 bg-white p-5">
            <h2 className="font-bold text-ink-950">{g.name}</h2>
            <ul className="mt-2 divide-y divide-ink-100">
              {g.items.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">
                      {s.name}
                      <span className={"ml-1.5 text-[11px] font-medium " + (s.is_active ? "text-ink-600" : "text-ink-400")}>
                        {s.is_active ? "aktif" : "nonaktif"}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => toggle(s)}
                      className="rounded-none border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                    >
                      {s.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      onClick={() => remove(s)}
                      className="rounded-none border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
