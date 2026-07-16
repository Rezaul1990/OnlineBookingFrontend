"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import {
  deleteAdminBooking,
  fetchAdminBookings,
  type AdminBookingFilters,
  updateAdminBooking,
  updateAdminBookingStatus
} from "@/services/adminService";
import type { Booking } from "@/types/booking";

const statusOptions: Array<{ value: Booking["status"]; label: string }> = [
  { value: "pending_call", label: "Pending call" },
  { value: "confirmed", label: "Confirmed" },
  { value: "reschedule_requested", label: "Reschedule requested" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" }
];

const statusTone: Record<Booking["status"], string> = {
  pending_call: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-cyan-200 bg-cyan-50 text-cyan-800",
  reschedule_requested: "border-indigo-200 bg-indigo-50 text-indigo-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  no_show: "border-slate-200 bg-slate-100 text-slate-700"
};

type DatePreset = "all" | "today" | "tomorrow" | "yesterday" | "this_week" | "this_month" | "custom";

const datePresets: Array<{ value: DatePreset; label: string }> = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "custom", label: "Custom" }
];

const sortOptions = [
  { value: "bookingDate_desc", label: "Newest booking date" },
  { value: "bookingDate_asc", label: "Oldest booking date" },
  { value: "newest", label: "Recently created" },
  { value: "customerName_asc", label: "Customer A-Z" },
  { value: "status_asc", label: "Status" }
];

const pageSizeOptions = [10, 25, 50, 100];
const paymentMethodLabels: Record<Booking["paymentMethod"], string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card"
};

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getWeekStart = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + offset);
  return start;
};

const getPresetRange = (preset: DatePreset) => {
  const today = new Date();
  if (preset === "today") return { dateFrom: toInputDate(today), dateTo: toInputDate(today) };
  if (preset === "tomorrow") {
    const tomorrow = addDays(today, 1);
    return { dateFrom: toInputDate(tomorrow), dateTo: toInputDate(tomorrow) };
  }
  if (preset === "yesterday") {
    const yesterday = addDays(today, -1);
    return { dateFrom: toInputDate(yesterday), dateTo: toInputDate(yesterday) };
  }
  if (preset === "this_week") {
    const start = getWeekStart(today);
    return { dateFrom: toInputDate(start), dateTo: toInputDate(addDays(start, 6)) };
  }
  if (preset === "this_month") {
    return {
      dateFrom: toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      dateTo: toInputDate(new Date(today.getFullYear(), today.getMonth() + 1, 0))
    };
  }
  return { dateFrom: "", dateTo: "" };
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const formatStatus = (status: Booking["status"]) => statusOptions.find((item) => item.value === status)?.label || status;

function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/35">
      <button className="absolute inset-0 h-full w-full cursor-default" type="button" aria-label="Close booking drawer" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Booking details</p>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          </div>
          <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}

export function BookingsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filters, setFilters] = useState<AdminBookingFilters>({
    search: "",
    status: "all",
    clientType: "all",
    serviceName: "",
    providerName: "",
    sort: "bookingDate_desc",
    page: 1,
    pageSize: 25
  });
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customRange, setCustomRange] = useState({ dateFrom: "", dateTo: "" });
  const [filterOptions, setFilterOptions] = useState({ services: [] as string[], providers: [] as string[] });
  const [summary, setSummary] = useState({ total: 0, pendingCall: 0, confirmed: 0, completed: 0, cancelled: 0 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const resolvedFilters = useMemo(() => {
    const range = datePreset === "custom" ? customRange : getPresetRange(datePreset);
    return { ...filters, ...range };
  }, [customRange, datePreset, filters]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminBookings(resolvedFilters);
      setBookings(data.bookings);
      setSummary(data.summary);
      setFilterOptions(data.filterOptions);
      setPagination(data.pagination || { page: 1, pageSize: filters.pageSize || 25, total: data.summary.total, totalPages: 1 });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedFilters]);

  const activeFilterCount = [
    filters.search,
    filters.status && filters.status !== "all",
    filters.clientType && filters.clientType !== "all",
    filters.serviceName,
    filters.providerName,
    datePreset !== "all"
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters({ search: "", status: "all", clientType: "all", serviceName: "", providerName: "", sort: "bookingDate_desc", page: 1, pageSize: 25 });
    setDatePreset("all");
    setCustomRange({ dateFrom: "", dateTo: "" });
  };

  const updateFilter = (next: Partial<AdminBookingFilters>) => {
    setFilters((current) => ({ ...current, ...next, page: next.page || 1 }));
  };

  const changeStatus = async (booking: Booking, status: Booking["status"]) => {
    setSavingId(booking._id);
    setError("");
    setNotice("");
    try {
      const data = await updateAdminBookingStatus(booking._id, status);
      setBookings((current) => current.map((item) => (item._id === booking._id ? data.booking : item)));
      setNotice("Booking status updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update booking.");
    } finally {
      setSavingId("");
    }
  };

  const deleteBooking = async (booking: Booking) => {
    if (!window.confirm("Delete this booking permanently?")) return;
    setSavingId(booking._id);
    setError("");
    setNotice("");
    try {
      await deleteAdminBooking(booking._id);
      setBookings((current) => current.filter((item) => item._id !== booking._id));
      setSummary((current) => ({ ...current, total: Math.max(current.total - 1, 0) }));
      setNotice("Booking deleted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete booking.");
    } finally {
      setSavingId("");
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBooking) return;
    setSavingId(editingBooking._id);
    setError("");
    setNotice("");
    try {
      const data = await updateAdminBooking(editingBooking._id, editingBooking);
      setBookings((current) => current.map((item) => (item._id === editingBooking._id ? data.booking : item)));
      setNotice("Booking updated.");
      setEditingBooking(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update booking.");
    } finally {
      setSavingId("");
    }
  };

  const metricCards = [
    { label: "Matching bookings", value: summary.total },
    { label: "Pending call", value: summary.pendingCall },
    { label: "Confirmed", value: summary.confirmed },
    { label: "Completed", value: summary.completed },
    { label: "Cancelled", value: summary.cancelled }
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Operations</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Bookings</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Search, filter, confirm, reschedule, complete, cancel, and edit customer booking requests from one focused admin list.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={resetFilters} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">
            Reset
          </button>
          <button onClick={loadBookings} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" type="button">
            Refresh
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <article key={card.label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {datePresets.map((preset) => (
            <button
              key={preset.value}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                datePreset === preset.value ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              type="button"
              onClick={() => {
                setDatePreset(preset.value);
                setFilters((current) => ({ ...current, page: 1 }));
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(150px,1fr))]">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Search
            <input
              className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-950"
              placeholder="Name, phone, email, service"
              value={filters.search || ""}
              onChange={(event) => updateFilter({ search: event.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Status
            <select className="rounded-md border border-slate-300 px-3 py-2 font-normal" value={filters.status} onChange={(event) => updateFilter({ status: event.target.value as AdminBookingFilters["status"] })}>
              <option value="all">All statuses</option>
              {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Client
            <select className="rounded-md border border-slate-300 px-3 py-2 font-normal" value={filters.clientType} onChange={(event) => updateFilter({ clientType: event.target.value as AdminBookingFilters["clientType"] })}>
              <option value="all">All clients</option>
              <option value="new">New</option>
              <option value="returning">Returning</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Service
            <select className="rounded-md border border-slate-300 px-3 py-2 font-normal" value={filters.serviceName || ""} onChange={(event) => updateFilter({ serviceName: event.target.value })}>
              <option value="">All services</option>
              {filterOptions.services.map((service) => <option key={service} value={service}>{service}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Provider
            <select className="rounded-md border border-slate-300 px-3 py-2 font-normal" value={filters.providerName || ""} onChange={(event) => updateFilter({ providerName: event.target.value })}>
              <option value="">All providers</option>
              {filterOptions.providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Sort
            <select className="rounded-md border border-slate-300 px-3 py-2 font-normal" value={filters.sort} onChange={(event) => updateFilter({ sort: event.target.value })}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        {datePreset === "custom" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              From
              <input className="rounded-md border border-slate-300 px-3 py-2 font-normal" type="date" value={customRange.dateFrom} onChange={(event) => setCustomRange((current) => ({ ...current, dateFrom: event.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              To
              <input className="rounded-md border border-slate-300 px-3 py-2 font-normal" type="date" value={customRange.dateTo} onChange={(event) => setCustomRange((current) => ({ ...current, dateTo: event.target.value }))} />
            </label>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-md bg-slate-100 px-2 py-1">{activeFilterCount} active filters</span>
          {resolvedFilters.dateFrom ? <span className="rounded-md bg-slate-100 px-2 py-1">From {resolvedFilters.dateFrom}</span> : null}
          {resolvedFilters.dateTo ? <span className="rounded-md bg-slate-100 px-2 py-1">To {resolvedFilters.dateTo}</span> : null}
        </div>
      </section>

      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.2fr_1.1fr_1fr_0.9fr_0.9fr_1fr_160px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid">
          <span>Customer</span>
          <span>Booking</span>
          <span>Service</span>
          <span>Status</span>
          <span>Payment</span>
          <span>Contact</span>
          <span>Actions</span>
        </div>

        {loading ? <p className="p-5 text-slate-600">Loading bookings...</p> : null}
        {!loading && bookings.length === 0 ? (
          <div className="m-5 rounded-md border border-dashed border-slate-300 p-8 text-center">
            <p className="font-semibold text-slate-950">No bookings match these filters.</p>
            <p className="mt-1 text-sm text-slate-600">Try another date preset, clear search text, or reset filters.</p>
          </div>
        ) : null}

        <div className="divide-y divide-slate-200">
          {bookings.map((booking) => (
            <article key={booking._id} className="grid gap-4 p-4 xl:grid-cols-[1.2fr_1.1fr_1fr_0.9fr_0.9fr_1fr_160px] xl:items-center">
              <div>
                <p className="font-bold text-slate-950">{booking.customerName}</p>
                <p className="mt-1 text-sm capitalize text-slate-500">{booking.clientType} client</p>
                {booking.notes ? <p className="mt-2 line-clamp-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{booking.notes}</p> : null}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{formatDateTime(booking.bookingDate)}</p>
                <p className="mt-1 text-sm text-slate-500">{booking.slotLabel}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{booking.serviceName}</p>
                <p className="mt-1 text-sm text-slate-500">{booking.providerName}</p>
              </div>
              <div>
                <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold uppercase ${statusTone[booking.status]}`}>
                  {formatStatus(booking.status)}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-bold capitalize text-slate-900">{paymentMethodLabels[booking.paymentMethod || "cash"]}</p>
                <p className="mt-1 text-slate-500">${booking.paymentAmount || 0} · {booking.paymentStatus || "unpaid"}</p>
              </div>
              <div className="text-sm">
                <p className="break-all font-semibold text-slate-800">{booking.email}</p>
                <p className="mt-1 text-slate-500">{booking.phone}</p>
              </div>
              <div className="grid gap-2">
                <button
                  onClick={() => setEditingBooking(booking)}
                  className="inline-flex h-9 w-9 items-center justify-center justify-self-end rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={savingId === booking._id}
                  type="button"
                  title={`Edit booking for ${booking.customerName}`}
                  aria-label={`Edit booking for ${booking.customerName}`}
                >
                  <Pencil aria-hidden="true" size={15} strokeWidth={2.2} />
                </button>
                <select
                  aria-label={`Status for ${booking.customerName}`}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
                  value={booking.status}
                  onChange={(event) => changeStatus(booking, event.target.value as Booking["status"])}
                  disabled={savingId === booking._id}
                >
                  {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </div>
            </article>
          ))}
        </div>
        {!loading && pagination.total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-600">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} bookings
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                value={filters.pageSize || 25}
                onChange={(event) => setFilters((current) => ({ ...current, pageSize: Number(event.target.value), page: 1 }))}
              >
                {pageSizeOptions.map((size) => <option key={size} value={size}>{size} / page</option>)}
              </select>
              <button
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setFilters((current) => ({ ...current, page: Math.max((current.page || 1) - 1, 1) }))}
              >
                Previous
              </button>
              <button
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters((current) => ({ ...current, page: Math.min((current.page || 1) + 1, pagination.totalPages) }))}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {editingBooking ? (
        <Drawer title={editingBooking.customerName} onClose={() => setEditingBooking(null)}>
          <form onSubmit={handleEditSubmit} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Client type<select className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.clientType} onChange={(event) => setEditingBooking({ ...editingBooking, clientType: event.target.value as Booking["clientType"] })}>
                <option value="new">New</option>
                <option value="returning">Returning</option>
              </select></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Status<select className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.status} onChange={(event) => setEditingBooking({ ...editingBooking, status: event.target.value as Booking["status"] })}>
                {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select></label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Customer name<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.customerName} onChange={(event) => setEditingBooking({ ...editingBooking, customerName: event.target.value })} required /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Email<input className="rounded-md border border-slate-300 px-3 py-2" type="email" value={editingBooking.email} onChange={(event) => setEditingBooking({ ...editingBooking, email: event.target.value })} required /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Phone<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.phone} onChange={(event) => setEditingBooking({ ...editingBooking, phone: event.target.value })} required /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Service name<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.serviceName} onChange={(event) => setEditingBooking({ ...editingBooking, serviceName: event.target.value })} required /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Provider name<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.providerName} onChange={(event) => setEditingBooking({ ...editingBooking, providerName: event.target.value })} required /></label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Booking date<input className="rounded-md border border-slate-300 px-3 py-2" type="datetime-local" value={new Date(editingBooking.bookingDate).toISOString().slice(0, 16)} onChange={(event) => setEditingBooking({ ...editingBooking, bookingDate: event.target.value })} required /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Slot label<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.slotLabel} onChange={(event) => setEditingBooking({ ...editingBooking, slotLabel: event.target.value })} required /></label>
            <fieldset className="grid gap-3 rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-sm font-bold text-slate-800">Payment</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">Method<select className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.paymentMethod || "cash"} onChange={(event) => setEditingBooking({ ...editingBooking, paymentMethod: event.target.value as Booking["paymentMethod"] })}>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select></label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">Payment status<select className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.paymentStatus || "unpaid"} onChange={(event) => setEditingBooking({ ...editingBooking, paymentStatus: event.target.value as Booking["paymentStatus"] })}>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="waived">Waived</option>
                </select></label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium text-slate-700">Amount<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={0} value={editingBooking.paymentAmount || 0} onChange={(event) => setEditingBooking({ ...editingBooking, paymentAmount: Number(event.target.value) })} /></label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">Paid<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={0} value={editingBooking.paidAmount || 0} onChange={(event) => setEditingBooking({ ...editingBooking, paidAmount: Number(event.target.value) })} /></label>
                <div className="rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-bold text-slate-700">Balance</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">${Math.max((editingBooking.paymentAmount || 0) - (editingBooking.paidAmount || 0), 0)}</p>
                </div>
              </div>
              {["cancelled", "no_show"].includes(editingBooking.status) ? <p className="rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">Cancelled/no-show bookings are saved with payment amount, paid amount, and balance as zero.</p> : null}
            </fieldset>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Notes<textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2" value={editingBooking.notes || ""} onChange={(event) => setEditingBooking({ ...editingBooking, notes: event.target.value })} /></label>
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <h3 className="font-bold text-slate-950">Timeline</h3>
              <div className="mt-3 grid gap-3">
                {editingBooking.timeline?.length ? [...editingBooking.timeline].reverse().map((item) => (
                  <article key={item._id || `${item.action}-${item.at}`} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-slate-500">{item.actorName} · {item.actorRole}</p>
                      </div>
                      <time className="text-xs font-semibold text-slate-500">{new Date(item.at).toLocaleString()}</time>
                    </div>
                    {item.note ? <p className="mt-2 text-slate-600">{item.note}</p> : null}
                  </article>
                )) : <p className="text-sm text-slate-600">No timeline entries yet.</p>}
              </div>
            </section>
            <div className="grid gap-2 sm:grid-cols-2">
              <button className="rounded-md bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800" disabled={savingId === editingBooking._id}>
                {savingId === editingBooking._id ? "Saving..." : "Save booking"}
              </button>
              <button className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 font-semibold text-rose-800 hover:bg-rose-100" type="button" onClick={() => deleteBooking(editingBooking)} disabled={savingId === editingBooking._id}>
                Delete booking
              </button>
            </div>
          </form>
        </Drawer>
      ) : null}
    </div>
  );
}
