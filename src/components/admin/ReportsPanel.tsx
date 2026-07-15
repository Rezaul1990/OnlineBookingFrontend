"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchBookingReport } from "@/services/adminService";
import type { Booking } from "@/types/booking";
import type { BookingReport, BookingReportFilters, BookingReportNameGroup } from "@/types/report";

const statusOptions: Array<{ value: Booking["status"]; label: string }> = [
  { value: "pending_call", label: "Pending call" },
  { value: "confirmed", label: "Confirmed" },
  { value: "reschedule_requested", label: "Reschedule requested" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" }
];

const statusLabels = Object.fromEntries(statusOptions.map((status) => [status.value, status.label])) as Record<Booking["status"], string>;

const csvCell = (value: string | number | undefined) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;

function StatCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </article>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: BookingReportNameGroup[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-bold text-slate-950">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-slate-600">No report data for this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3">Confirmed</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Cancelled</th>
                <th className="px-4 py-3">No-show</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => (
                <tr key={row.name}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.count}</td>
                  <td className="px-4 py-3 text-slate-700">{row.confirmed}</td>
                  <td className="px-4 py-3 text-slate-700">{row.completed}</td>
                  <td className="px-4 py-3 text-slate-700">{row.cancelled}</td>
                  <td className="px-4 py-3 text-slate-700">{row.noShow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ReportsPanel() {
  const [filters, setFilters] = useState<BookingReportFilters>({ status: "all", clientType: "all" });
  const [report, setReport] = useState<BookingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchBookingReport(nextFilters);
      setReport(data.report);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxDailyCount = useMemo(() => Math.max(...(report?.dailyCounts.map((item) => item.count) || [1]), 1), [report]);

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadReport(filters);
  };

  const resetFilters = () => {
    const nextFilters: BookingReportFilters = { status: "all", clientType: "all", dateFrom: "", dateTo: "", serviceName: "", providerName: "" };
    setFilters(nextFilters);
    loadReport(nextFilters);
  };

  const exportCsv = () => {
    if (!report) return;
    const header = ["Customer", "Email", "Phone", "Client type", "Service", "Provider", "Date", "Slot", "Status", "Notes"];
    const rows = report.bookings.map((booking) => [
      booking.customerName,
      booking.email,
      booking.phone,
      booking.clientType,
      booking.serviceName,
      booking.providerName,
      new Date(booking.bookingDate).toLocaleString(),
      booking.slotLabel,
      statusLabels[booking.status],
      booking.notes || ""
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "booking-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const summary = report?.summary;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Reports</h1>
          <p className="mt-1 text-sm text-slate-600">Track appointment volume, call confirmation, cancellations, no-shows, service demand, and provider performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => loadReport()}>
            Refresh
          </button>
          <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800" type="button" onClick={exportCsv} disabled={!report || report.bookings.length === 0}>
            Export CSV
          </button>
        </div>
      </div>

      <form onSubmit={handleFilterSubmit} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            From
            <input className="rounded-md border border-slate-300 px-3 py-2" type="date" value={filters.dateFrom || ""} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            To
            <input className="rounded-md border border-slate-300 px-3 py-2" type="date" value={filters.dateTo || ""} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Status
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2" value={filters.status || "all"} onChange={(event) => setFilters({ ...filters, status: event.target.value as BookingReportFilters["status"] })}>
              <option value="all">All statuses</option>
              {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Client
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2" value={filters.clientType || "all"} onChange={(event) => setFilters({ ...filters, clientType: event.target.value as BookingReportFilters["clientType"] })}>
              <option value="all">All clients</option>
              <option value="new">New</option>
              <option value="returning">Returning</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Service
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2" value={filters.serviceName || ""} onChange={(event) => setFilters({ ...filters, serviceName: event.target.value })}>
              <option value="">All services</option>
              {filters.serviceName && !report?.filterOptions.services.includes(filters.serviceName) ? <option value={filters.serviceName}>{filters.serviceName}</option> : null}
              {report?.filterOptions.services.map((service) => <option key={service} value={service}>{service}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Provider
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2" value={filters.providerName || ""} onChange={(event) => setFilters({ ...filters, providerName: event.target.value })}>
              <option value="">All providers</option>
              {filters.providerName && !report?.filterOptions.providers.includes(filters.providerName) ? <option value={filters.providerName}>{filters.providerName}</option> : null}
              {report?.filterOptions.providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
            Apply filters
          </button>
          <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </form>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="rounded-md border border-slate-200 bg-white p-5 text-slate-600">Loading reports...</p> : null}

      {!loading && report && summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total bookings" value={summary.totalBookings} />
            <StatCard label="Pending calls" value={summary.pendingCall} helper="Needs admin follow-up" />
            <StatCard label="Confirmed" value={summary.confirmed} />
            <StatCard label="Completed" value={`${summary.completionRate}%`} helper={`${summary.completed} completed`} />
            <StatCard label="Cancelled" value={`${summary.cancellationRate}%`} helper={`${summary.cancelled} cancelled`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section className="rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="font-bold text-slate-950">Booking status</h2>
              </div>
              <div className="grid gap-3 p-4">
                {report.byStatus.map((item) => (
                  <div key={item.status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800">{statusLabels[item.status]}</span>
                      <span className="text-slate-600">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-teal-700" style={{ width: `${summary.totalBookings ? (item.count / summary.totalBookings) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="font-bold text-slate-950">Daily booking trend</h2>
              </div>
              <div className="grid max-h-80 gap-3 overflow-y-auto p-4">
                {report.dailyCounts.length === 0 ? <p className="text-sm text-slate-600">No daily data for this filter.</p> : null}
                {report.dailyCounts.map((item) => (
                  <div key={item.date} className="grid grid-cols-[96px_1fr_36px] items-center gap-3 text-sm">
                    <span className="font-medium text-slate-700">{item.date}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-sky-600" style={{ width: `${(item.count / maxDailyCount) * 100}%` }} />
                    </div>
                    <span className="text-right text-slate-600">{item.count}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-bold text-slate-950">Client mix</h2>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {report.byClientType.length === 0 ? <p className="text-sm text-slate-600">No client data for this filter.</p> : null}
              {report.byClientType.map((item) => (
                <div key={item.clientType} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold capitalize text-slate-800">{item.clientType}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{item.count}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <BreakdownTable title="Service performance" rows={report.byService} />
            <BreakdownTable title="Provider performance" rows={report.byProvider} />
          </div>

          <section className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-bold text-slate-950">Filtered booking details</h2>
              <span className="text-xs font-semibold uppercase text-slate-500">Showing up to 500 records</span>
            </div>
            {report.bookings.length === 0 ? (
              <p className="m-4 rounded-md border border-dashed border-slate-300 p-5 text-center text-sm text-slate-600">No bookings match this report filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Slot</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {report.bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{booking.customerName}</p>
                          <p className="text-xs capitalize text-slate-500">{booking.clientType}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{booking.serviceName}</td>
                        <td className="px-4 py-3 text-slate-700">{booking.providerName}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <p>{new Date(booking.bookingDate).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-500">{booking.slotLabel}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{statusLabels[booking.status]}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <p className="break-all">{booking.email}</p>
                          <p className="text-xs text-slate-500">{booking.phone}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
