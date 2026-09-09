"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

/**
 * Auth server actions — all real Supabase Auth calls, no fake login.
 * `next` is a relative path to return to after login (kept server-side).
 */

export interface AuthFormState {
  error?: string;
  info?: string;
}

const DEFAULT_HOME: Record<string, string> = {
  student: "/student/dashboard",
  mentor: "/mentor/dashboard",
  admin: "/admin/dashboard",
};

export async function registerUser(formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "student") as UserRole;

  if (fullName.length < 2) return { error: "Nama lengkap minimal 2 karakter." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Alamat email tidak valid." };
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };
  if (role !== "student" && role !== "mentor")
    return { error: "Peran tidak valid. Pilih Mahasiswa atau Mentor." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });

  if (error) {
    return { error: error.message.includes("already registered")
      ? "Email sudah terdaftar. Silakan login."
      : `Gagal mendaftar: ${error.message}` };
  }

  // If email confirmation is required, the session is null.
  if (!data.session) {
    return {
      info: "Pendaftaran berhasil. Cek email kamu untuk mengonfirmasi akun sebelum login.",
    };
  }

  revalidatePath("/", "layout");
  redirect(DEFAULT_HOME[role] ?? "/student/dashboard");
}

export async function loginUser(formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !password) return { error: "Email dan kata sandi wajib diisi." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes("invalid login credentials"))
      return { error: "Email atau kata sandi salah." };
    if (error.message.toLowerCase().includes("email not confirmed"))
      return { error: "Email belum dikonfirmasi. Cek kotak masuk email kamu." };
    return { error: `Gagal login: ${error.message}` };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  revalidatePath("/", "layout");

  const allowedNext = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin");
  if (allowedNext) redirect(next);
  redirect(DEFAULT_HOME[(profile?.role as UserRole) ?? "student"] ?? "/student/dashboard");
}

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPassword(formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Alamat email tidak valid." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });
  if (error) return { error: `Gagal mengirim email reset: ${error.message}` };
  return { info: "Tautan reset kata sandi telah dikirim ke email kamu." };
}

export async function updatePassword(formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: `Gagal memperbarui kata sandi: ${error.message}` };
  redirect("/login");
}
