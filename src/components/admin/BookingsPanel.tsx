"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { deleteAdminBooking, fetchAdminBookings, updateAdminBooking, updateAdminBookingStatus } from "@/services/adminService";
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
  pending_call: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-teal-50 text-teal-800 border-teal-200",
  reschedule_requested: "bg-sky-50 text-sky-800 border-sky-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  no_show: "bg-slate-100 text-slate-700 border-slate-200"
};

function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/30">
      <button className="absolute inset-0 h-full w-full cursor-default" type="button" aria-label="Close booking drawer" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
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
  const [statusFilter, setStatusFilter] = useState<"all" | Booking["status"]>("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminBookings();
      setBookings(data.bookings);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const visibleBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

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

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Bookings</h1>
          <p className="mt-1 text-sm text-slate-600">Manage customer booking requests, call confirmation, rescheduling, cancellations, and completion status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Booking status filter"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | Booking["status"])}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          <button onClick={loadBookings} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">
            Refresh
          </button>
        </div>
      </div>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-5 text-slate-600">Loading bookings...</p> : null}
        {!loading && visibleBookings.length === 0 ? (
          <p className="m-5 rounded-md border border-dashed border-slate-300 p-5 text-center text-slate-600">No bookings found.</p>
        ) : null}

        <div className="divide-y divide-slate-200">
          {visibleBookings.map((booking) => (
            <article key={booking._id} className="grid gap-4 p-5 xl:grid-cols-[1fr_320px]">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{booking.customerName}</h2>
                    <p className="mt-1 text-sm text-slate-600">{booking.serviceName} with {booking.providerName}</p>
                  </div>
                  <span className={`rounded-md border px-3 py-1 text-xs font-bold uppercase ${statusTone[booking.status]}`}>
                    {statusOptions.find((status) => status.value === booking.status)?.label || booking.status}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt className="font-semibold text-slate-900">Slot</dt><dd className="mt-1 text-slate-600">{booking.slotLabel}</dd></div>
                  <div><dt className="font-semibold text-slate-900">Client</dt><dd className="mt-1 capitalize text-slate-600">{booking.clientType}</dd></div>
                  <div><dt className="font-semibold text-slate-900">Email</dt><dd className="mt-1 break-all text-slate-600">{booking.email}</dd></div>
                  <div><dt className="font-semibold text-slate-900">Phone</dt><dd className="mt-1 text-slate-600">{booking.phone}</dd></div>
                </dl>
                {booking.notes ? <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{booking.notes}</p> : null}
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Status
                  <select
                    aria-label={`Status for ${booking.customerName}`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2"
                    value={booking.status}
                    onChange={(event) => changeStatus(booking, event.target.value as Booking["status"])}
                    disabled={savingId === booking._id}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => changeStatus(booking, "confirmed")} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800" disabled={savingId === booking._id} type="button">
                    Confirm
                  </button>
                  <button onClick={() => setEditingBooking(booking)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={savingId === booking._id} type="button">
                    Edit
                  </button>
                  <button onClick={() => changeStatus(booking, "reschedule_requested")} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={savingId === booking._id} type="button">
                    Reschedule
                  </button>
                  <button onClick={() => changeStatus(booking, "completed")} className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50" disabled={savingId === booking._id} type="button">
                    Complete
                  </button>
                  <button onClick={() => changeStatus(booking, "cancelled")} className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" disabled={savingId === booking._id} type="button">
                    Cancel
                  </button>
                  <button onClick={() => deleteBooking(booking)} className="col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100" disabled={savingId === booking._id} type="button">
                    Delete booking
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editingBooking ? (
        <Drawer title="Edit booking" onClose={() => setEditingBooking(null)}>
          <form onSubmit={handleEditSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Client type<select className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.clientType} onChange={(event) => setEditingBooking({ ...editingBooking, clientType: event.target.value as Booking["clientType"] })}>
                <option value="new">New</option>
                <option value="returning">Returning</option>
              </select></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Status<select className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.status} onChange={(event) => setEditingBooking({ ...editingBooking, status: event.target.value as Booking["status"] })}>
                {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select></label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Customer name<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.customerName} onChange={(event) => setEditingBooking({ ...editingBooking, customerName: event.target.value })} required /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Email<input className="rounded-md border border-slate-300 px-3 py-2" type="email" value={editingBooking.email} onChange={(event) => setEditingBooking({ ...editingBooking, email: event.target.value })} required /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Phone<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.phone} onChange={(event) => setEditingBooking({ ...editingBooking, phone: event.target.value })} required /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Service name<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.serviceName} onChange={(event) => setEditingBooking({ ...editingBooking, serviceName: event.target.value })} required /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Provider name<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.providerName} onChange={(event) => setEditingBooking({ ...editingBooking, providerName: event.target.value })} required /></label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Booking date<input className="rounded-md border border-slate-300 px-3 py-2" type="datetime-local" value={new Date(editingBooking.bookingDate).toISOString().slice(0, 16)} onChange={(event) => setEditingBooking({ ...editingBooking, bookingDate: event.target.value })} required /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Slot label<input className="rounded-md border border-slate-300 px-3 py-2" value={editingBooking.slotLabel} onChange={(event) => setEditingBooking({ ...editingBooking, slotLabel: event.target.value })} required /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Notes<textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2" value={editingBooking.notes || ""} onChange={(event) => setEditingBooking({ ...editingBooking, notes: event.target.value })} /></label>
            <button className="rounded-md bg-teal-700 px-4 py-3 font-semibold text-white" disabled={savingId === editingBooking._id}>
              {savingId === editingBooking._id ? "Saving..." : "Save booking"}
            </button>
          </form>
        </Drawer>
      ) : null}
    </div>
  );
}
