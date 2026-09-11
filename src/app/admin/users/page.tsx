import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listUsers } from "@/services/admin.service";
import { SetupPanel } from "@/components/dashboard/setup-panel";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/ui/badge";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { Users } from "lucide-react";
import type { UserRole } from "@/types";

export const metadata: Metadata = { title: "Pengguna" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const supabase = await createClient();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const users = configured
    ? await listUsers(supabase, (["student", "mentor", "admin"] as UserRole[]).includes(role as UserRole) ? (role as UserRole) : undefined)
    : [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-950">Pengguna</h1>
          <p className="mt-1 text-sm text-ink-500">{users.length} pengguna terdaftar.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            { label: "Semua", value: "" },
            { label: "Mahasiswa", value: "student" },
            { label: "Mentor", value: "mentor" },
            { label: "Admin", value: "admin" },
          ].map((f) => (
            <a
              key={f.value}
              href={f.value ? `/admin/users?role=${f.value}` : "/admin/users"}
              className={
                "rounded-none px-3 py-2 font-semibold " +
                ((role ?? "") === f.value ? "bg-ink-900 text-white" : "bg-white text-ink-600 border border-ink-200")
              }
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {!configured && <SetupPanel />}
      {configured && users.length === 0 && (
        <EmptyState icon={<Users className="h-10 w-10" aria-hidden />} title="Belum ada pengguna." />
      )}
      {configured && users.length > 0 && (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-ink-100 text-xs uppercase text-ink-400">
                <tr>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Universitas</th>
                  <th className="px-4 py-3">Daftar</th>
                  <th className="px-4 py-3">Peran</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={u.avatar_url} name={u.full_name} size={30} />
                        <div>
                          <p className="font-semibold text-ink-900">{u.full_name ?? "-"}</p>
                          <p className="text-xs text-ink-400">{u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{u.university ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {new Date(u.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <UserRoleSelect userId={u.id} role={u.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </>
  );
}
