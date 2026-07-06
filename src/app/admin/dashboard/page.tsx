import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardPanel } from "@/components/admin/DashboardPanel";

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <DashboardPanel />
    </AdminShell>
  );
}
