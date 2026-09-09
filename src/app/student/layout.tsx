import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Student Dashboard" };

/**
 * Authentication gate for all /student pages. Layouts cannot pass dynamic
 * props to pages, so each page renders <DashboardShell> itself.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  await requireStudent(supabase);
  return <>{children}</>;
}
