import { Logo } from "@/components/logo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex items-center justify-between border-b-2 border-ink-950 bg-white px-6 py-5">
        <Logo />
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-wide text-ink-600 hover:text-ink-950 transition-colors"
        >
          Kembali ke beranda
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">{children}</main>
      <footer className="pb-6 text-center text-xs uppercase tracking-wide text-ink-500">
        © {new Date().getFullYear()} Mentora — Your Academic Growth Partner
      </footer>
    </div>
  );
}
