import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireMentor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Mentor Dashboard" };

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  await requireMentor(supabase);
  return <>{children}</>;
}
