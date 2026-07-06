"use client";

import { useEffect, useState } from "react";
import { fetchDashboard } from "@/services/adminService";
import type { DashboardStats } from "@/types/auth";

export function DashboardPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
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

  if (loading) return <p className="text-slate-600">Loading dashboard...</p>;

  if (error) {
    return <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>;
  }

  const cards = [
    { label: "Total bookings", value: stats?.bookingCount ?? 0 },
    { label: "Pending bookings", value: stats?.pendingBookings ?? 0 },
    { label: "Admin users", value: stats?.userCount ?? 0 },
    { label: "Roles", value: stats?.roleCount ?? 0 }
  ];

  return (
    <section>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
