import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)} aria-label="Mentora — Beranda">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
        <GraduationCap className="h-5 w-5" aria-hidden />
      </span>
      <span className={cn("text-xl font-extrabold tracking-tight", light ? "text-white" : "text-ink-950")}>
        Mentora
      </span>
    </Link>
  );
}
