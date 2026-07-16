"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBooking, fetchCatalog, updateBookingStatus } from "@/services/bookingService";
import type { Booking, BookingSlot, CreateBookingInput, Provider, Service } from "@/types/booking";

const todayDateString = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const addDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const futureTime = (offsetHours: number) => {
  const date = new Date();
  date.setHours(date.getHours() + offsetHours, 0, 0, 0);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const isFutureSlot = (slot: BookingSlot) => {
  const today = todayDateString();
  if (!slot.active || slot.date < today) return false;
  if (slot.date > today) return true;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return slot.startTime > currentTime;
};

const sortSlots = (slots: BookingSlot[]) => {
  return [...slots].sort((first, second) => `${first.date} ${first.startTime}`.localeCompare(`${second.date} ${second.startTime}`));
};

const normalizeCatalog = (catalogServices: Service[]) => {
  return catalogServices
    .map((service) => ({
      ...service,
      providers: service.providers
        .map((provider) => ({
          ...provider,
          slots: sortSlots(provider.slots.filter(isFutureSlot))
        }))
        .filter((provider) => provider.slots.length > 0)
    }))
    .filter((service) => service.providers.length > 0);
};

const fallbackServices: Service[] = [
  {
    _id: "sample-consultation",
    name: "Business Consultation",
    slug: "business-consultation",
    category: "Consulting",
    description: "One-to-one planning session for business, project, or service decisions.",
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
    durationMinutes: 45,
    price: 50,
    active: true,
    providers: [
      {
        _id: "provider-a",
        name: "Ayesha Rahman",
        title: "Senior Consultant",
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        bio: "Best for first-time planning and service selection.",
        active: true,
        slots: [
          { _id: "slot-a-1", date: addDays(todayDateString(), 0), startTime: futureTime(1), endTime: futureTime(2), capacity: 1, active: true },
          { _id: "slot-a-2", date: addDays(todayDateString(), 0), startTime: futureTime(3), endTime: futureTime(4), capacity: 1, active: true },
          { _id: "slot-a-3", date: addDays(todayDateString(), 1), startTime: "10:00", endTime: "10:45", capacity: 1, active: true }
        ]
      }
    ]
  },
  {
    _id: "sample-care",
    name: "Care Appointment",
    slug: "care-appointment",
    category: "Personal Service",
    description: "Book a standard care/service appointment with an available provider.",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",
    durationMinutes: 60,
    price: 80,
    active: true,
    providers: [
      {
        _id: "provider-c",
        name: "Nusrat Jahan",
        title: "Service Provider",
        imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
        bio: "Available for regular service appointments.",
        active: true,
        slots: [
          { _id: "slot-c-1", date: addDays(todayDateString(), 0), startTime: futureTime(2), endTime: futureTime(3), capacity: 1, active: true },
          { _id: "slot-c-2", date: addDays(todayDateString(), 3), startTime: "14:00", endTime: "15:00", capacity: 1, active: true }
        ]
      }
    ]
  }
];

const formatSlotDate = (slot: BookingSlot) => {
  const date = new Date(`${slot.date}T00:00:00`);
  return `${date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}, ${slot.startTime} - ${slot.endTime}`;
};

const formatDateChip = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

const toCalendarDate = (value: string) => {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
};

const createLocalBooking = (input: CreateBookingInput): Booking => ({
  _id: `local-${Date.now()}`,
  ...input,
  paymentStatus: "unpaid",
  paidAmount: 0,
  balanceAmount: input.paymentAmount,
  timeline: [{ action: "created", label: "Booking request created", actorName: "Customer", actorRole: "customer", at: new Date().toISOString() }],
  status: "pending_call"
});

export function BookingApp() {
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [clientType, setClientType] = useState<"new" | "returning">("new");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Booking["paymentMethod"]>("cash");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedService = useMemo(() => services.find((service) => service._id === selectedServiceId), [selectedServiceId, services]);
  const selectedProvider = useMemo(() => selectedService?.providers.find((provider) => provider._id === selectedProviderId), [selectedProviderId, selectedService]);
  const availableDates = useMemo(() => [...new Set((selectedProvider?.slots || []).map((slot) => slot.date))], [selectedProvider]);
  const visibleSlots = useMemo(() => (selectedProvider?.slots || []).filter((slot) => slot.date === selectedDate), [selectedDate, selectedProvider]);
  const selectedSlot = useMemo(() => visibleSlots.find((slot) => slot._id === selectedSlotId), [selectedSlotId, visibleSlots]);
  const step = selectedSlot ? 4 : selectedDate ? 3 : selectedProvider ? 3 : selectedService ? 2 : 1;

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        const catalog = await fetchCatalog();
        const normalizedServices = normalizeCatalog(catalog.services);
        setServices(normalizedServices.length ? normalizedServices : normalizeCatalog(fallbackServices));
      } catch {
        setServices(normalizeCatalog(fallbackServices));
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  const resetAfterService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedProviderId("");
    setSelectedDate("");
    setSelectedSlotId("");
    setError("");
    setNotice("");
  };

  const resetAfterProvider = (providerId: string) => {
    setSelectedProviderId(providerId);
    const provider = selectedService?.providers.find((item) => item._id === providerId);
    setSelectedDate(provider?.slots[0]?.date || "");
    setSelectedSlotId("");
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    if (!selectedService || !selectedProvider || !selectedSlot) {
      setError("Please select a service, provider, and time slot first.");
      setSubmitting(false);
      return;
    }

    const input: CreateBookingInput = {
      customerName,
      email,
      phone,
      clientType,
      serviceId: selectedService._id,
      serviceName: selectedService.name,
      providerId: selectedProvider._id,
      providerName: selectedProvider.name,
      slotId: selectedSlot._id,
      bookingDate: `${selectedSlot.date}T${selectedSlot.startTime}:00`,
      slotLabel: formatSlotDate(selectedSlot),
      paymentMethod,
      paymentAmount: selectedService.price,
      notes
    };

    try {
      const data = await createBooking(input);
      setBookings((current) => [data.booking, ...current].slice(0, 5));
      setConfirmedBooking(data.booking);
      setCustomerName("");
      setEmail("");
      setPhone("");
      setNotes("");
    } catch (requestError) {
      const booking = createLocalBooking(input);
      setConfirmedBooking(booking);
      setBookings((current) => [booking, ...current].slice(0, 5));
      setCustomerName("");
      setEmail("");
      setPhone("");
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  };

  const updateConfirmedStatus = async (status: Booking["status"]) => {
    if (!confirmedBooking) return;

    if (confirmedBooking._id.startsWith("local-")) {
      setConfirmedBooking({ ...confirmedBooking, status });
      return;
    }

    try {
      const data = await updateBookingStatus(confirmedBooking._id, status, confirmedBooking.publicToken);
      setConfirmedBooking(data.booking);
    } catch {
      setConfirmedBooking({ ...confirmedBooking, status });
    }
  };

  const handleAddCalendar = () => {
    if (!confirmedBooking) return;
    const start = toCalendarDate(confirmedBooking.bookingDate);
    const end = toCalendarDate(new Date(new Date(confirmedBooking.bookingDate).getTime() + 45 * 60 * 1000).toISOString());
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `UID:${confirmedBooking._id}@onlinebooking.local`,
      `DTSTAMP:${toCalendarDate(new Date().toISOString())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${confirmedBooking.serviceName} with ${confirmedBooking.providerName}`,
      `DESCRIPTION:Booking status: ${confirmedBooking.status.replace("_", " ")}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "onlinebooking-appointment.ics";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReschedule = async () => {
    if (!confirmedBooking) return;

    const booking = confirmedBooking;
    const service = services.find((item) => item._id === booking.serviceId) || services.find((item) => item.name === booking.serviceName);
    const provider = service?.providers.find((item) => item._id === booking.providerId) || service?.providers.find((item) => item.name === booking.providerName);

    await updateConfirmedStatus("reschedule_requested");
    setSelectedServiceId(service?._id || booking.serviceId);
    setSelectedProviderId(provider?._id || booking.providerId);
    setSelectedDate(provider?.slots[0]?.date || "");
    setSelectedSlotId("");
    setClientType(booking.clientType);
    setCustomerName(booking.customerName);
    setEmail(booking.email);
    setPhone(booking.phone);
    setNotes(booking.notes || "");
    setPaymentMethod(booking.paymentMethod);
    setConfirmedBooking(null);
    setNotice("Select a new slot and submit the reschedule request.");
    requestAnimationFrame(() => {
      document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#" className="text-lg font-bold text-slate-950">OnlineBooking</a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#services" className="hover:text-teal-700">Services</a>
            <a href="#booking" className="hover:text-teal-700">Book now</a>
            <a href="/admin/dashboard" className="hover:text-teal-700">Admin</a>
          </nav>
          <a href="#booking" className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Start booking</a>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-teal-700">Service booking</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Choose a service, provider, and available slot in one clean flow.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Clients can book as new or returning customers. Admins control services, provider profiles, images, and time slots from the dashboard.
            </p>
          </div>
          <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            <img
              src="https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1200&q=80"
              alt="Reception desk helping a client complete a booking"
              className="h-72 w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="booking" className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-bold">Create booking</h2>
              <p className="mt-1 text-sm text-slate-600">Step {step} of 4</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-500">
              {["Service", "Provider", "Slot", "Details"].map((label, index) => (
                <span key={label} className={`rounded-md px-3 py-2 text-center ${step >= index + 1 ? "bg-teal-50 text-teal-800" : "bg-slate-100"}`}>{label}</span>
              ))}
            </div>
          </div>

          {loading ? <p className="py-10 text-slate-600">Loading services...</p> : null}

          {confirmedBooking ? (
            <section className="grid gap-6 py-6">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold uppercase text-emerald-700">Booking request received</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950">Thank you, {confirmedBooking.customerName}.</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                  Your booking is in the confirmation queue. Our team will confirm the appointment by call before the slot is finalized.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div className="rounded-md border border-slate-200 bg-white p-5">
                  <h3 className="font-semibold">Booking details</h3>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="font-semibold text-slate-900">Service</dt><dd className="mt-1 text-slate-600">{confirmedBooking.serviceName}</dd></div>
                    <div><dt className="font-semibold text-slate-900">Provider</dt><dd className="mt-1 text-slate-600">{confirmedBooking.providerName}</dd></div>
            <div><dt className="font-semibold text-slate-900">Time</dt><dd className="mt-1 text-slate-600">{confirmedBooking.slotLabel}</dd></div>
            <div><dt className="font-semibold text-slate-900">Status</dt><dd className="mt-1 capitalize text-slate-600">{confirmedBooking.status.replace("_", " ")}</dd></div>
            <div><dt className="font-semibold text-slate-900">Payment</dt><dd className="mt-1 capitalize text-slate-600">{confirmedBooking.paymentMethod} · ${confirmedBooking.paymentAmount}</dd></div>
                  </dl>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <button onClick={handleAddCalendar} type="button" className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Add calendar</button>
                    <button onClick={handleReschedule} type="button" className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reschedule</button>
                    <button onClick={() => updateConfirmedStatus("cancelled")} type="button" className="rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">Cancel booking</button>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-5">
                  <h3 className="font-semibold">Timeline</h3>
                  <ol className="mt-4 grid gap-4 text-sm">
                    <li className="flex gap-3">
                      <span className="mt-1 h-3 w-3 rounded-full bg-emerald-500" />
                      <span><span className="block font-semibold">Request submitted</span><span className="text-slate-600">We received your details.</span></span>
                    </li>
                    <li className="flex gap-3">
                      <span className={`mt-1 h-3 w-3 rounded-full ${confirmedBooking.status === "cancelled" ? "bg-red-500" : "bg-teal-600"}`} />
                      <span><span className="block font-semibold">Confirm by call</span><span className="text-slate-600">Staff will call before final confirmation.</span></span>
                    </li>
                    <li className="flex gap-3">
                      <span className={`mt-1 h-3 w-3 rounded-full ${confirmedBooking.status === "confirmed" || confirmedBooking.status === "completed" ? "bg-teal-600" : "bg-slate-300"}`} />
                      <span><span className="block font-semibold">Appointment confirmed</span><span className="text-slate-600">You will receive the final slot update.</span></span>
                    </li>
                    <li className="flex gap-3">
                      <span className={`mt-1 h-3 w-3 rounded-full ${confirmedBooking.status === "completed" ? "bg-teal-600" : "bg-slate-300"}`} />
                      <span><span className="block font-semibold">Service completed</span><span className="text-slate-600">Admin marks completion after the visit.</span></span>
                    </li>
                  </ol>
                </div>
              </div>

              <button onClick={() => setConfirmedBooking(null)} type="button" className="w-fit rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Make another booking
              </button>
            </section>
          ) : null}

          {!loading && !confirmedBooking ? (
            <div className="grid gap-8 py-6">
              <section id="services">
                <h3 className="text-lg font-semibold">1. Select service</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {services.map((service) => (
                    <button key={service._id} onClick={() => resetAfterService(service._id)} type="button" className={`overflow-hidden rounded-md border text-left transition hover:border-teal-400 ${selectedServiceId === service._id ? "border-teal-600 ring-2 ring-teal-100" : "border-slate-200"}`}>
                      <img src={service.imageUrl || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"} alt={service.name} className="h-36 w-full object-cover" />
                      <div className="p-4">
                        <p className="text-xs font-semibold uppercase text-teal-700">{service.category}</p>
                        <h4 className="mt-1 font-bold">{service.name}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
                        <p className="mt-3 text-sm font-semibold text-slate-900">{service.durationMinutes} min · ${service.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {selectedService ? (
                <section>
                  <h3 className="text-lg font-semibold">2. Select provider</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {selectedService.providers.map((provider: Provider) => (
                      <button key={provider._id} onClick={() => resetAfterProvider(provider._id)} type="button" className={`flex gap-3 rounded-md border p-3 text-left transition hover:border-teal-400 ${selectedProviderId === provider._id ? "border-teal-600 ring-2 ring-teal-100" : "border-slate-200"}`}>
                        <img src={provider.imageUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"} alt={provider.name} className="h-20 w-20 rounded-md object-cover" />
                        <span>
                          <span className="block font-semibold">{provider.name}</span>
                          <span className="mt-1 block text-sm text-slate-600">{provider.title}</span>
                          <span className="mt-2 block text-sm text-slate-500">{provider.bio}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {selectedProvider ? (
                <section>
                  <h3 className="text-lg font-semibold">3. Select date and time</h3>
                  <div className="mt-4 grid gap-3">
                    <div className="flex flex-wrap gap-2">
                      {availableDates.map((date) => (
                        <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlotId(""); }} type="button" className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition hover:border-teal-500 ${selectedDate === date ? "border-teal-700 bg-teal-700 text-white" : "border-teal-200 bg-teal-50 text-teal-900"}`}>
                          {formatDateChip(date)}
                        </button>
                      ))}
                    </div>
                    {selectedDate ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleSlots.map((slot) => (
                          <button key={slot._id} onClick={() => setSelectedSlotId(slot._id)} type="button" className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition hover:border-teal-400 ${selectedSlotId === slot._id ? "border-teal-600 bg-teal-50 text-teal-900" : "border-slate-200 bg-white"}`}>
                            {slot.startTime} - {slot.endTime}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {availableDates.length === 0 ? <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No current or future slots are available for this provider.</p> : null}
                  </div>
                </section>
              ) : null}

              {selectedSlot ? (
                <form onSubmit={handleSubmit} className="grid gap-4 border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold">4. Client details</h3>
                  <div className="inline-grid w-fit grid-cols-2 rounded-md border border-slate-300 p-1 text-sm font-semibold">
                    {(["new", "returning"] as const).map((type) => (
                      <button key={type} onClick={() => setClientType(type)} type="button" className={`rounded px-4 py-2 capitalize ${clientType === type ? "bg-slate-950 text-white" : "text-slate-600"}`}>{type}</button>
                    ))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="grid gap-2 text-sm font-medium text-slate-700">Name<input className="rounded-md border border-slate-300 px-3 py-2" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required minLength={2} /></label>
                    <label className="grid gap-2 text-sm font-medium text-slate-700">Email<input className="rounded-md border border-slate-300 px-3 py-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                    <label className="grid gap-2 text-sm font-medium text-slate-700">Phone<input className="rounded-md border border-slate-300 px-3 py-2" value={phone} onChange={(event) => setPhone(event.target.value)} required minLength={6} /></label>
                  </div>
                  <fieldset className="grid gap-3">
                    <legend className="text-sm font-medium text-slate-700">Payment method</legend>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {(["cash", "bkash", "nagad", "card"] as const).map((method) => (
                        <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`rounded-md border px-4 py-3 text-sm font-bold capitalize ${paymentMethod === method ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                          {method}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">Payable amount: ${selectedService?.price || 0}. Admin can mark paid/partial after receiving payment.</p>
                  </fieldset>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">Notes<textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} /></label>
                  {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
                  {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}
                  <button className="rounded-md bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60" disabled={submitting}>
                    {submitting ? "Confirming..." : "Confirm booking"}
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Booking summary</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-semibold text-slate-900">Service</dt><dd className="mt-1 text-slate-600">{selectedService?.name || "Not selected"}</dd></div>
            <div><dt className="font-semibold text-slate-900">Provider</dt><dd className="mt-1 text-slate-600">{selectedProvider?.name || "Not selected"}</dd></div>
            <div><dt className="font-semibold text-slate-900">Slot</dt><dd className="mt-1 text-slate-600">{selectedSlot ? formatSlotDate(selectedSlot) : "Not selected"}</dd></div>
            <div><dt className="font-semibold text-slate-900">Payment</dt><dd className="mt-1 capitalize text-slate-600">{selectedService ? `$${selectedService.price} · ${paymentMethod}` : "Not selected"}</dd></div>
          </dl>
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="font-semibold">Recent bookings</h3>
            {bookings.length ? (
              <div className="mt-3 grid gap-3">
                {bookings.slice(0, 4).map((booking) => (
                  <article key={booking._id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-semibold">{booking.customerName}</p>
                    <p className="mt-1 text-slate-600">{booking.serviceName} with {booking.providerName || "provider"}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No saved bookings yet.</p>
            )}
          </div>
        </aside>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>OnlineBooking</p>
          <p>Admin controls services, providers, images, slots, and booking status.</p>
        </div>
      </footer>
    </main>
  );
}
