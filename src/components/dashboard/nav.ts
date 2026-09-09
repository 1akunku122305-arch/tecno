import type { NavItem } from "./dashboard-shell";
import {
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Compass,
  FolderKanban,
  GraduationCap,
  History,
  LayoutDashboard,
  Star,
  Tags,
  Users,
  UserRound,
  Wallet,
} from "lucide-react";

export const STUDENT_NAV: NavItem[] = [
  { key: "dashboard", href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "find", href: "/find-mentor", label: "Cari Mentor", icon: Compass },
  { key: "bookings", href: "/student/bookings", label: "Booking Saya", icon: BookOpen },
  { key: "sessions", href: "/student/sessions", label: "Sesi Saya", icon: CalendarClock },
  { key: "history", href: "/student/history", label: "Riwayat", icon: History },
  { key: "notifications", href: "/student/notifications", label: "Notifikasi", icon: Bell },
  { key: "profile", href: "/student/profile", label: "Profil", icon: UserRound },
];

export const MENTOR_NAV: NavItem[] = [
  { key: "dashboard", href: "/mentor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "bookings", href: "/mentor/bookings", label: "Booking", icon: BookOpen },
  { key: "schedule", href: "/mentor/schedule", label: "Jadwal", icon: CalendarClock },
  { key: "sessions", href: "/mentor/sessions", label: "Sesi", icon: GraduationCap },
  { key: "reviews", href: "/mentor/reviews", label: "Review", icon: Star },
  { key: "earnings", href: "/mentor/earnings", label: "Pendapatan", icon: Wallet },
  { key: "notifications", href: "/mentor/notifications", label: "Notifikasi", icon: Bell },
  { key: "profile", href: "/mentor/profile", label: "Profil", icon: UserRound },
];

export const ADMIN_NAV: NavItem[] = [
  { key: "dashboard", href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "users", href: "/admin/users", label: "Pengguna", icon: Users },
  { key: "mentors", href: "/admin/mentors", label: "Mentor", icon: GraduationCap },
  { key: "categories", href: "/admin/categories", label: "Kategori", icon: Tags },
  { key: "subjects", href: "/admin/subjects", label: "Mata Kuliah", icon: FolderKanban },
  { key: "bookings", href: "/admin/bookings", label: "Booking", icon: BookOpen },
  { key: "notifications", href: "/admin/notifications", label: "Notifikasi", icon: Bell },
];
