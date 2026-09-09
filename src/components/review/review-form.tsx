"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReviewAction } from "@/services/review-actions";
import { Button } from "@/components/ui/button";
import { FormMessage, Label, Textarea } from "@/components/ui/form";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewForm({ bookingId, mentorId }: { bookingId: string; mentorId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await createReviewAction({ bookingId, mentorId, rating, review: text });
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan review.");
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <FormMessage variant="success">
        Terima kasih! Review kamu sudah tersimpan dan akan memperbarui rating mentor.
      </FormMessage>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-ink-200/80 bg-white p-5 sm:p-6">
      <div>
        <Label>Rating</Label>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating 1 sampai 5">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} bintang`}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5"
            >
              <Star
                aria-hidden
                className={cn(
                  "h-7 w-7 transition-colors",
                  i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "fill-ink-200 text-ink-200"
                )}
              />
            </button>
          ))}
          <span className="ml-2 self-center text-sm font-semibold text-ink-700">{rating}/5</span>
        </div>
      </div>
      <div>
        <Label htmlFor="review">Review</Label>
        <Textarea
          id="review"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Bagaimana pengalamanmu dengan mentor ini?"
          maxLength={1000}
        />
      </div>
      {error && <FormMessage variant="error">{error}</FormMessage>}
      <Button type="submit" loading={pending}>Kirim Review</Button>
    </form>
  );
}
