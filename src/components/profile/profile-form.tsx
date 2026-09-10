"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction, uploadAvatarAction } from "@/services/profile-actions";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label, Textarea } from "@/components/ui/form";

export function ProfileForm({
  name,
  university,
  major,
  semester,
  bio,
  avatarUrl,
  showSemester = true,
}: {
  name: string;
  university: string;
  major: string;
  semester: string;
  bio: string;
  avatarUrl?: string | null;
  showSemester?: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(avatarUrl ?? null);
  const [values, setValues] = useState({ name, university, major, semester, bio });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  function onChange(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setSuccess("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await updateProfileAction({
        full_name: values.name,
        university: values.university || null,
        major: values.major || null,
        semester: values.semester ? Number(values.semester) : null,
        bio: values.bio || null,
      });
      if (!res.ok) setError(res.error ?? "Gagal menyimpan profil.");
      else {
        setSuccess("Profil berhasil disimpan.");
        router.refresh();
      }
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await uploadAvatarAction(file, avatar);
      if (!res.ok) setError(res.error ?? "Gagal mengunggah foto.");
      else {
        setAvatar(res.url ?? null);
        setSuccess("Foto profil berhasil diperbarui.");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-ink-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <Avatar src={avatar} name={values.name} size={64} />
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={pending}>
            {pending ? "Mengunggah…" : "Ganti Foto"}
          </Button>
          <p className="mt-1.5 text-[11px] text-ink-400">PNG/JPG, maksimal 2 MB</p>
        </div>
      </div>

      {error && <FormMessage variant="error">{error}</FormMessage>}
      {success && <FormMessage variant="success">{success}</FormMessage>}

      <div>
        <Label htmlFor="full_name">Nama Lengkap</Label>
        <Input id="full_name" value={values.name} onChange={(e) => onChange("name", e.target.value)} required minLength={2} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="university">Universitas</Label>
          <Input id="university" value={values.university} onChange={(e) => onChange("university", e.target.value)} placeholder="Nama universitas" />
        </div>
        <div>
          <Label htmlFor="major">Program Studi</Label>
          <Input id="major" value={values.major} onChange={(e) => onChange("major", e.target.value)} placeholder="Contoh: Ilmu Komputer" />
        </div>
      </div>
      {showSemester && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="semester">Semester</Label>
            <Input id="semester" type="number" min={1} max={20} value={values.semester} onChange={(e) => onChange("semester", e.target.value)} placeholder="Contoh: 5" />
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="bio">Bio Singkat</Label>
        <Textarea id="bio" value={values.bio} onChange={(e) => onChange("bio", e.target.value)} placeholder="Ceritakan singkat tentang kamu…" maxLength={500} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>Simpan Profil</Button>
      </div>
    </form>
  );
}
