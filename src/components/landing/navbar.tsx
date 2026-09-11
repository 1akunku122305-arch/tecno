"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink-950 bg-paper/95 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Navigasi utama">
        <Logo />
        <div className="hidden items-center gap-6 md:flex">
          <a href="#cara-kerja" className="text-sm font-bold uppercase tracking-wide text-ink-700 hover:text-ink-950">Cara Kerja</a>
          <a href="#keunggulan" className="text-sm font-bold uppercase tracking-wide text-ink-700 hover:text-ink-950">Keunggulan</a>
          <a href="#bidang" className="text-sm font-bold uppercase tracking-wide text-ink-700 hover:text-ink-950">Bidang</a>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink href="/login" variant="ghost" size="sm">Masuk</ButtonLink>
          <ButtonLink href="/register" size="sm">Daftar Gratis</ButtonLink>
        </div>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-none text-ink-700 hover:bg-ink-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t-2 border-ink-950 bg-paper px-4 pb-4 pt-2 md:hidden" id="mobile-menu">
          <div className="flex flex-col gap-1">
            <a href="#cara-kerja" onClick={() => setOpen(false)} className="rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-ink-700 hover:bg-ink-100">
              Cara Kerja
            </a>
            <a href="#keunggulan" onClick={() => setOpen(false)} className="rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-ink-700 hover:bg-ink-100">
              Keunggulan
            </a>
            <a href="#bidang" onClick={() => setOpen(false)} className="rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-ink-700 hover:bg-ink-100">
              Bidang
            </a>
          </div>
          <div className="mt-3 flex gap-3">
            <Link href="/login" className="flex h-10 flex-1 items-center justify-center rounded-none border border-ink-950 text-sm font-bold uppercase tracking-wide text-ink-950">
              Masuk
            </Link>
            <Link href="/register" className="flex h-10 flex-1 items-center justify-center rounded-none bg-ink-950 text-sm font-bold uppercase tracking-wide text-white">
              Daftar Gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
