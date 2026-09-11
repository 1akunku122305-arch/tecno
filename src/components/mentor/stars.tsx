import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating, className }: { rating?: number | null; className?: string }) {
  const value = rating ?? 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            "h-3.5 w-3.5",
            i <= Math.round(value) ? "fill-ink-950 text-ink-950" : "fill-ink-200 text-ink-200"
          )}
        />
      ))}
    </span>
  );
}
