"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { fetchCurrentAdmin, logoutAdmin } from "@/services/adminService";
import type { AdminUser } from "@/types/auth";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", permission: "dashboard.view" },
  { href: "/admin/bookings", label: "Bookings", permission: "bookings.view" },
  { href: "/admin/services", label: "Services", permission: "services.view" },
  { href: "/admin/providers", label: "Providers", permission: "providers.view" },
  { href: "/admin/reports", label: "Reports", permission: "reports.view" },
  { href: "/admin/users", label: "Users", permission: "staff.view" },
  { href: "/admin/roles", label: "Roles", permission: "roles.view" }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await fetchCurrentAdmin();
        setUser(data.user);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Authentication required.");
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const permissions = useMemo(() => new Set(user?.role?.permissions || []), [user]);
  const visibleItems = navItems.filter((item) => user?.role?.slug === "owner" || permissions.has(item.permission));

  const handleLogout = async () => {
    await logoutAdmin();
    router.replace("/admin/login");
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Loading admin...</div>;
  }

  if (error) {
    return <div className="grid min-h-screen place-items-center text-slate-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
        <Link href="/admin/dashboard" className="text-lg font-bold text-teal-800">
          OnlineBooking
        </Link>
        <nav className="mt-8 grid gap-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium ${pathname === item.href ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Admin dashboard</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
          <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={handleLogout} type="button">
            Logout
          </button>
        </header>
        <main className="p-5">{children}</main>
      </div>
    </div>
  );
}
