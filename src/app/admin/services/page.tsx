import { AdminShell } from "@/components/admin/AdminShell";
import { CatalogPanel } from "@/components/admin/CatalogPanel";

export default function AdminServicesPage() {
  return (
    <AdminShell>
      <CatalogPanel view="services" />
    </AdminShell>
  );
}
