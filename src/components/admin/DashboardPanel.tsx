"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchDashboard } from "@/services/adminService";
import type { DashboardStats } from "@/types/auth";
import type { Booking } from "@/types/booking";

const statusLabels: Record<Booking["status"], string> = {
  pending_call: "Pending call",
  confirmed: "Confirmed",
  reschedule_requested: "Reschedule",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show"
};

const statusColors: Record<Booking["status"], string> = {
  pending_call: "bg-amber-500",
  confirmed: "bg-cyan-500",
  reschedule_requested: "bg-indigo-500",
  cancelled: "bg-rose-500",
  completed: "bg-emerald-500",
  no_show: "bg-slate-400"
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export function DashboardPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setError("");
        const data = await fetchDashboard();
        setStats(data.stats);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5">
        <div className="h-20 animate-pulse rounded-md bg-white" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-md bg-white" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>;
  }

  const totalBookings = stats?.bookingCount ?? 0;
  const statusEntries = Object.entries(statusLabels).map(([status, label]) => ({
    status: status as Booking["status"],
    label,
    value: stats?.byStatus?.[status as Booking["status"]] ?? 0
  }));
  const maxStatus = Math.max(...statusEntries.map((item) => item.value), 1);

  const cards = [
    { label: "Total bookings", value: totalBookings, helper: "All customer requests" },
    { label: "Today", value: stats?.todayBookings ?? 0, helper: "Scheduled for today" },
    { label: "Tomorrow", value: stats?.tomorrowBookings ?? 0, helper: "Next-day workload" },
    { label: "This week", value: stats?.thisWeekBookings ?? 0, helper: "Current week demand" },
    { label: "This month", value: stats?.thisMonthBookings ?? 0, helper: "Monthly bookings" },
    { label: "Pending call", value: stats?.pendingBookings ?? 0, helper: "Needs follow-up" }
  ];

  const operations = [
    { label: "Confirmed", value: stats?.confirmedBookings ?? 0 },
    { label: "Completed", value: stats?.completedBookings ?? 0 },
    { label: "Cancelled", value: stats?.cancelledBookings ?? 0 },
    { label: "Admin users", value: stats?.userCount ?? 0 },
    { label: "Roles", value: stats?.roleCount ?? 0 }
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Control center</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Dashboard</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">A quick operational view of booking volume, upcoming workload, staff access, and booking status health.</p>
        </div>
        <Link className="inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" href="/admin/bookings">
          Manage bookings
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <article key={card.label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-950">Booking status</h2>
              <p className="mt-1 text-sm text-slate-500">Live distribution across the customer workflow.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {statusEntries.map((item) => (
              <div key={item.status} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-sm">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <span className={`block h-full rounded-full ${statusColors[item.status]}`} style={{ width: `${Math.max((item.value / maxStatus) * 100, item.value ? 8 : 0)}%` }} />
                </span>
                <span className="text-right font-bold text-slate-950">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">Operations snapshot</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {operations.map((item) => (
              <article key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-950">Recent bookings</h2>
            <p className="mt-1 text-sm text-slate-500">Latest scheduled customer requests.</p>
          </div>
          <Link className="text-sm font-bold text-teal-700 hover:text-teal-800" href="/admin/bookings">View all</Link>
        </div>
        {!stats?.recentBookings?.length ? (
          <p className="p-5 text-sm text-slate-600">No recent bookings yet.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {stats.recentBookings.map((booking) => (
              <article key={booking._id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_1fr_140px] md:items-center">
                <div>
                  <p className="font-bold text-slate-950">{booking.customerName}</p>
                  <p className="mt-1 text-sm text-slate-500">{booking.email}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{booking.serviceName}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDateTime(booking.bookingDate)}</p>
                </div>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-center text-xs font-bold uppercase text-slate-700">
                  {statusLabels[booking.status]}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
