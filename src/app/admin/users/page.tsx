import { AdminShell } from "@/components/admin/AdminShell";
import { UsersPanel } from "@/components/admin/UsersPanel";

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <UsersPanel />
    </AdminShell>
  );
}
