"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/types";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/services/admin-actions";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label } from "@/components/ui/form";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await createCategoryAction({ name, description });
      if (!res.ok) setError(res.error ?? "Gagal menambah kategori.");
      else {
        setName("");
        setDescription("");
        router.refresh();
      }
    });
  }

  function toggle(cat: Category) {
    setError("");
    startTransition(async () => {
      const res = await updateCategoryAction(cat.id, { isActive: !cat.is_active });
      if (!res.ok) setError(res.error ?? "Gagal memperbarui kategori.");
      else router.refresh();
    });
  }

  function remove(cat: Category) {
    if (!confirm(`Hapus kategori "${cat.name}"? Mata kuliah di dalamnya ikut terhapus.`)) return;
    setError("");
    startTransition(async () => {
      const res = await deleteCategoryAction(cat.id);
      if (!res.ok) setError(res.error ?? "Gagal menghapus kategori.");
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={create} className="space-y-4 rounded-none border border-ink-200/80 bg-white p-5">
        <h2 className="font-bold text-ink-950">Tambah Kategori</h2>
        <div>
          <Label htmlFor="cat-name">Nama Bidang</Label>
          <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Desain" required />
        </div>
        <div>
          <Label htmlFor="cat-desc">Deskripsi (opsional)</Label>
          <Input id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <FormMessage variant="error">{error}</FormMessage>}
        <Button type="submit" loading={pending}>Tambah</Button>
      </form>

      <div className="rounded-none border border-ink-200/80 bg-white p-5 lg:col-span-2">
        <h2 className="font-bold text-ink-950">Kategori Saat Ini</h2>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">Belum ada kategori.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">
                    {c.name}{" "}
                    <span className={"ml-1 text-[11px] font-medium " + (c.is_active ? "text-ink-600" : "text-ink-400")}>
                      {c.is_active ? "aktif" : "nonaktif"}
                    </span>
                  </p>
                  {c.description && <p className="truncate text-xs text-ink-500">{c.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => toggle(c)}
                    className="rounded-none border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                  >
                    {c.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="rounded-none border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                  >
                    Hapus
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
