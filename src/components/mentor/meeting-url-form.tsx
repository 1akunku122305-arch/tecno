"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMeetingUrlAction } from "@/services/booking-actions";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label } from "@/components/ui/form";

export function MeetingUrlForm({
  bookingId,
  initialUrl,
}: {
  bookingId: string;
  initialUrl?: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await updateMeetingUrlAction(bookingId, url);
      if (!res.ok) setError(res.error ?? "Gagal menyimpan.");
      else {
        setSuccess("Link meeting tersimpan.");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor={`meeting-${bookingId}`}>Link Meeting (Google Meet dsb.)</Label>
        <Input
          id={`meeting-${bookingId}`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://meet.google.com/…"
          type="url"
        />
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
        {success && !error && (
          <p className="mt-1.5 text-xs font-medium text-emerald-600">{success}</p>
        )}
      </div>
      <Button type="submit" size="sm" loading={pending}>Simpan</Button>
    </form>
  );
}
