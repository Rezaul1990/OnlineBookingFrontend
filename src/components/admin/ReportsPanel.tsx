"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
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

const money = (value = 0) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const escapeHtml = (value: string | number | undefined) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function StatCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </article>
  );
}

function BreakdownTable({ title, rows, onPrintInvoice }: { title: string; rows: BookingReportNameGroup[]; onPrintInvoice?: (row: BookingReportNameGroup) => void }) {
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
                {onPrintInvoice ? <th className="px-4 py-3 text-right">Invoice</th> : null}
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
                  {onPrintInvoice ? (
                    <td className="px-4 py-3 text-right">
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        type="button"
                        onClick={() => onPrintInvoice(row)}
                        title={`Print invoice for ${row.name}`}
                        aria-label={`Print invoice for ${row.name}`}
                      >
                        <Printer className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  ) : null}
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
    const timeout = window.setTimeout(() => {
      loadReport(filters);
    }, 250);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const resetFilters = () => {
    const nextFilters: BookingReportFilters = { status: "all", clientType: "all", dateFrom: "", dateTo: "", serviceName: "", providerName: "" };
    setFilters(nextFilters);
  };

  const printProviderInvoice = (provider: BookingReportNameGroup) => {
    if (!report) return;
    const printedAt = new Date().toLocaleString();
    const periodFrom = report.filters.dateFrom || "All";
    const periodTo = report.filters.dateTo || "All";
    const invoiceWindow = window.open("", "_blank", "width=920,height=720");
    if (!invoiceWindow) return;

    invoiceWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Provider invoice - ${escapeHtml(provider.name)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; color: #0f172a; font-family: Arial, sans-serif; }
            .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #0f766e; padding-bottom: 20px; }
            .brand { color: #0f766e; font-size: 22px; font-weight: 800; }
            .muted { color: #475569; font-size: 12px; line-height: 1.6; }
            h1 { margin: 24px 0 4px; font-size: 26px; }
            h2 { margin: 24px 0 10px; font-size: 15px; text-transform: uppercase; letter-spacing: .08em; color: #475569; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
            .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; }
            .label { color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .value { margin-top: 6px; font-size: 20px; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: .05em; }
            .right { text-align: right; }
            .footer { margin-top: 34px; color: #64748b; font-size: 12px; }
            @media print { body { padding: 24px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">OnlineBooking</div>
              <div class="muted">Provider performance invoice</div>
            </div>
            <div class="muted right">
              Printed: ${escapeHtml(printedAt)}<br />
              Period: ${escapeHtml(periodFrom)} to ${escapeHtml(periodTo)}
            </div>
          </div>
          <h1>${escapeHtml(provider.name)}</h1>
          <div class="muted">Filtered by service: ${escapeHtml(report.filters.serviceName || "All services")} | Status: ${escapeHtml(report.filters.status || "all")}</div>

          <div class="grid">
            <div class="box"><div class="label">Bookings</div><div class="value">${provider.count}</div></div>
            <div class="box"><div class="label">Completed</div><div class="value">${provider.completed}</div></div>
            <div class="box"><div class="label">Paid</div><div class="value">${escapeHtml(money(provider.paidAmount))}</div></div>
          </div>

          <h2>Booking Summary</h2>
          <table>
            <thead><tr><th>Confirmed</th><th>Completed</th><th>Cancelled</th><th>No-show</th></tr></thead>
            <tbody><tr><td>${provider.confirmed}</td><td>${provider.completed}</td><td>${provider.cancelled}</td><td>${provider.noShow}</td></tr></tbody>
          </table>

          <h2>Payment Summary</h2>
          <table>
            <thead><tr><th>Total Amount</th><th>Paid Amount</th><th>Balance Due</th></tr></thead>
            <tbody>
              <tr>
                <td>${escapeHtml(money(provider.paymentAmount))}</td>
                <td>${escapeHtml(money(provider.paidAmount))}</td>
                <td>${escapeHtml(money(provider.balanceAmount))}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">This invoice is generated from the current admin report filters. Cancelled and no-show bookings follow the system payment rules.</div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
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
        </div>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
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
          <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </section>

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
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Payment amount" value={`$${summary.totalPaymentAmount || 0}`} helper="Cancelled/no-show bookings are zeroed" />
            <StatCard label="Paid amount" value={`$${summary.totalPaidAmount || 0}`} />
            <StatCard label="Balance due" value={`$${summary.totalBalanceAmount || 0}`} />
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
            <BreakdownTable title="Provider performance" rows={report.byProvider} onPrintInvoice={printProviderInvoice} />
          </div>
        </>
      ) : null}
    </div>
  );
}
