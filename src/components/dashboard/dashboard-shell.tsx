import Link from "next/link";
import { logoutUser } from "@/lib/auth/actions";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Bell, LogOut } from "lucide-react";

export interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({
  items,
  current,
  role,
  userName,
  avatarUrl,
  unreadNotifications,
  children,
}: {
  items: NavItem[];
  current: string;
  role: "student" | "mentor" | "admin";
  userName?: string | null;
  avatarUrl?: string | null;
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-2 border-ink-950 bg-white lg:flex">
        <div className="flex h-16 items-center border-b-2 border-ink-950 px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navigasi dashboard">
          {items.map((item) => {
            const active = item.key === current;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors",
                  active
                    ? "bg-ink-950 text-white"
                    : "text-ink-700 hover:bg-ink-100 hover:text-ink-950"
                )}
              >
                <item.icon className="h-4.5 w-4.5" aria-hidden />
                {item.label}
                {item.key === "notifications" && unreadNotifications > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-none bg-ink-950 px-1.5 text-[10px] font-bold text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t-2 border-ink-950 p-4">
          <div className="flex items-center gap-2.5">
            <Avatar src={avatarUrl} name={userName} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold uppercase tracking-wide text-ink-950">{userName ?? "Pengguna"}</p>
              <p className="text-[11px] uppercase tracking-wide text-ink-500">{role}</p>
            </div>
            <form action={logoutUser}>
              <button
                type="submit"
                className="inline-flex h-8 w-8 items-center justify-center rounded-none text-ink-500 hover:bg-ink-100 hover:text-ink-950"
                aria-label="Keluar"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Top bar mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-ink-950 bg-white px-4 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <Link
            href={`/${role}/notifications`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-none text-ink-700 hover:bg-ink-100"
            aria-label={`Notifikasi (${unreadNotifications} belum dibaca)`}
          >
            <Bell className="h-4.5 w-4.5" aria-hidden />
            {unreadNotifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-none bg-ink-950 px-1 text-[9px] font-bold text-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Link>
          <form action={logoutUser}>
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-none text-ink-700 hover:bg-ink-100"
              aria-label="Keluar"
            >
              <LogOut className="h-4.5 w-4.5" aria-hidden />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile nav */}
      <nav
        className="sticky top-14 z-20 flex gap-1 overflow-x-auto border-b-2 border-ink-950 bg-white px-2 py-2 lg:hidden"
        aria-label="Navigasi dashboard mobile"
      >
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-none px-3 py-2 text-xs font-bold uppercase tracking-wide",
              item.key === current ? "bg-ink-950 text-white" : "text-ink-700"
            )}
          >
            <item.icon className="h-3.5 w-3.5" aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="p-4 sm:p-6 lg:ml-64 lg:p-8">{children}</main>
    </div>
  );
}
