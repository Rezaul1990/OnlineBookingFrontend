import { AdminShell } from "@/components/admin/AdminShell";
import { CatalogPanel } from "@/components/admin/CatalogPanel";

export default function AdminProvidersPage() {
  return (
    <AdminShell>
      <CatalogPanel view="providers" />
    </AdminShell>
  );
}
