"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { BarChart3, BriefcaseBusiness, CalendarCheck, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { fetchCurrentAdmin, logoutAdmin } from "@/services/adminService";
import type { AdminUser } from "@/types/auth";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", permission: "dashboard.view", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", permission: "bookings.view", icon: CalendarCheck },
  { href: "/admin/services", label: "Services", permission: "services.view", icon: BriefcaseBusiness },
  { href: "/admin/providers", label: "Providers", permission: "providers.view", icon: UsersRound },
  { href: "/admin/reports", label: "Reports", permission: "reports.view", icon: BarChart3 },
  { href: "/admin/users", label: "Users", permission: "staff.view", icon: UserCog },
  { href: "/admin/roles", label: "Roles", permission: "roles.view", icon: ShieldCheck }
];

const SIDEBAR_COLLAPSED_KEY = "onlinebooking_admin_sidebar_collapsed";

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  }, []);

  const permissions = useMemo(() => new Set(user?.role?.permissions || []), [user]);
  const visibleItems = navItems.filter((item) => user?.role?.slug === "owner" || permissions.has(item.permission));

  const handleLogout = async () => {
    await logoutAdmin();
    router.replace("/admin/login");
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Loading admin...</div>;
  }

  if (error) {
    return <div className="grid min-h-screen place-items-center text-slate-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className={`fixed inset-y-0 left-0 hidden border-r border-slate-200 bg-white transition-all duration-200 lg:block ${sidebarCollapsed ? "w-20 px-3 py-5" : "w-64 p-5"}`}>
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? "flex-col justify-center" : "justify-between"}`}>
          <Link href="/admin/dashboard" className={`flex h-10 items-center rounded-md font-bold text-teal-800 ${sidebarCollapsed ? "w-10 justify-center bg-teal-50 text-lg" : "min-w-0 text-lg"}`} title="OnlineBooking">
            {sidebarCollapsed ? "O" : "OnlineBooking"}
          </Link>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden="true" /> : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        <nav className="mt-8 grid gap-1">
          {visibleItems.map((item) => (
            <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} className={`group relative flex h-11 items-center rounded-md text-sm font-semibold transition ${
              sidebarCollapsed ? "justify-center px-0" : "gap-3 px-3"
            } ${pathname === item.href ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {sidebarCollapsed ? (
                <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
                  {item.label}
                </span>
              ) : (
                <span>{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <div className={`transition-all duration-200 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Admin dashboard</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={handleLogout} type="button">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </header>
        <main className="p-5">{children}</main>
      </div>
    </div>
  );
}
