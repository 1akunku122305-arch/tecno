import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)} aria-label="Mentora — Beranda">
      <span className="flex h-9 w-9 items-center justify-center rounded-none border-2 border-ink-950 bg-ink-950 text-white">
        <GraduationCap className="h-5 w-5" aria-hidden />
      </span>
      <span className={cn("font-masthead text-xl font-black uppercase tracking-tight", light ? "text-white" : "text-ink-950")}>
        Mentora
      </span>
    </Link>
  );
}
