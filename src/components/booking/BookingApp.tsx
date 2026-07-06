"use client";

import { FormEvent, useEffect, useState } from "react";
import { createBooking, fetchBookings } from "@/services/bookingService";
import type { Booking, CreateBookingInput } from "@/types/booking";

const initialForm: CreateBookingInput = {
  customerName: "",
  email: "",
  phone: "",
  serviceName: "",
  bookingDate: "",
  notes: ""
};

export function BookingApp() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState<CreateBookingInput>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchBookings();
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

  const updateField = (field: keyof CreateBookingInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createBooking(form);
      setSuccess("Booking request created successfully.");
      setForm(initialForm);
      await loadBookings();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">OnlineBooking</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-bold text-slate-950 md:text-5xl">Book services without the back-and-forth</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              A basic full-stack starter for collecting appointment requests and managing recent bookings.
            </p>
          </div>
          <div className="rounded-md border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
            API-driven booking flow
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Create Booking</h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Customer name
              <input className="rounded-md border border-slate-300 px-3 py-2" value={form.customerName} onChange={(event) => updateField("customerName", event.target.value)} required minLength={2} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <input className="rounded-md border border-slate-300 px-3 py-2" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Phone
              <input className="rounded-md border border-slate-300 px-3 py-2" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} required minLength={6} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Service
              <input className="rounded-md border border-slate-300 px-3 py-2" value={form.serviceName} onChange={(event) => updateField("serviceName", event.target.value)} required minLength={2} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Date and time
              <input className="rounded-md border border-slate-300 px-3 py-2" type="datetime-local" value={form.bookingDate} onChange={(event) => updateField("bookingDate", event.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Notes
              <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} maxLength={500} />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

          <button className="mt-5 w-full rounded-md bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting}>
            {submitting ? "Creating..." : "Create booking"}
          </button>
        </form>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">Recent Bookings</h2>
            <button onClick={loadBookings} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button">
              Refresh
            </button>
          </div>

          {loading ? <p className="mt-6 text-slate-600">Loading bookings...</p> : null}

          {!loading && !error && bookings.length === 0 ? (
            <div className="mt-6 rounded-md border border-dashed border-slate-300 p-6 text-center text-slate-600">No bookings yet.</div>
          ) : null}

          {!loading && bookings.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {bookings.map((booking) => (
                <article key={booking._id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-950">{booking.customerName}</h3>
                      <p className="mt-1 text-sm text-slate-600">{booking.serviceName}</p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">{booking.status}</span>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-slate-900">Date</dt>
                      <dd>{new Date(booking.bookingDate).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-900">Contact</dt>
                      <dd>{booking.email}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
