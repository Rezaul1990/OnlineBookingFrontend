"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  createProvider,
  createService,
  createSlot,
  deleteProvider,
  deleteService,
  deleteSlot,
  fetchAdminCatalog,
  updateProvider,
  updateService,
  updateSlot,
  uploadProviderImage,
  uploadServiceImage
} from "@/services/adminService";
import type { BookingSlot, Provider, Service } from "@/types/booking";

type CatalogView = "services" | "providers";
type DrawerMode = "service" | "provider" | "slot" | "serviceDetails" | "providerDetails" | null;

const serviceInitial = { serviceId: "", name: "", category: "", description: "", durationMinutes: 30, price: 0, providerIds: [] as string[], active: true };
const providerInitial = { providerId: "", name: "", title: "", email: "", phone: "", bio: "", serviceIds: [] as string[], active: true };
const slotInitial = { serviceId: "", providerId: "", slotId: "", date: "", startTime: "09:00", endTime: "10:00", capacity: 1 };
const weeklyInitial = { enabled: true, selectedDays: [new Date().getDay()], startTime: "09:00", endTime: "17:00", capacity: 1, weeksAhead: 4 };
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pageSize = 8;

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

const toggleId = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);

function Drawer({ title, eyebrow, children, onClose }: { title: string; eyebrow: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/35">
      <button className="absolute inset-0 h-full w-full cursor-default" type="button" aria-label="Close drawer" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{eyebrow}</p>
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

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  if (total <= pageSize) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-600">Page {page} of {totalPages} · {total} records</p>
      <div className="flex gap-2">
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50" type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function CatalogPanel({ view = "services" }: { view?: CatalogView }) {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [serviceForm, setServiceForm] = useState(serviceInitial);
  const [providerForm, setProviderForm] = useState(providerInitial);
  const [slotForm, setSlotForm] = useState(slotInitial);
  const [weeklyForm, setWeeklyForm] = useState(weeklyInitial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [servicePage, setServicePage] = useState(1);
  const [providerPage, setProviderPage] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const isEditingService = Boolean(serviceForm.serviceId);
  const isEditingProvider = Boolean(providerForm.providerId);
  const isEditingSlot = Boolean(slotForm.slotId);
  const serviceName = (serviceId?: string) => services.find((service) => service._id === serviceId)?.name || "Unassigned";
  const selectedSlotService = services.find((service) => service._id === slotForm.serviceId);
  const slotProviderOptions = selectedSlotService?.providers || [];

  const filteredServices = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return services;
    return services.filter((service) => [service.name, service.category, service.description].some((value) => value.toLowerCase().includes(search)));
  }, [query, services]);

  const filteredProviders = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return providers;
    return providers.filter((provider) => [provider.name, provider.title, provider.email || "", provider.phone || "", provider.bio || ""].some((value) => value.toLowerCase().includes(search)));
  }, [providers, query]);

  const pagedServices = filteredServices.slice((servicePage - 1) * pageSize, servicePage * pageSize);
  const pagedProviders = filteredProviders.slice((providerPage - 1) * pageSize, providerPage * pageSize);
  const totalSlots = providers.reduce((total, provider) => total + provider.slots.length, 0);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminCatalog();
      setServices(data.services);
      setProviders(data.providers || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const closeDrawer = () => {
    setDrawer(null);
    setServiceForm(serviceInitial);
    setProviderForm(providerInitial);
    setSlotForm(slotInitial);
    setWeeklyForm(weeklyInitial);
    setSelectedService(null);
    setSelectedProvider(null);
  };

  const openServiceDetails = (service: Service) => {
    setSelectedService(service);
    setDrawer("serviceDetails");
  };

  const openProviderDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setDrawer("providerDetails");
  };

  const openNewService = () => {
    setServiceForm(serviceInitial);
    setDrawer("service");
  };

  const openEditService = (service: Service) => {
    setServiceForm({
      serviceId: service._id,
      name: service.name,
      category: service.category,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price,
      providerIds: service.providerIds || service.providers.map((provider) => provider._id),
      active: service.active
    });
    setDrawer("service");
  };

  const openNewProvider = (serviceId = "") => {
    setProviderForm({ ...providerInitial, serviceIds: serviceId ? [serviceId] : [] });
    setDrawer("provider");
  };

  const openEditProvider = (provider: Provider) => {
    setProviderForm({
      providerId: provider._id,
      name: provider.name,
      title: provider.title,
      email: provider.email || "",
      phone: provider.phone || "",
      bio: provider.bio || "",
      serviceIds: provider.serviceIds || [],
      active: provider.active
    });
    setDrawer("provider");
  };

  const openNewSlot = (serviceId = "", providerId = "") => {
    setSlotForm({ ...slotInitial, serviceId, providerId, date: todayDateString() });
    setWeeklyForm(weeklyInitial);
    setDrawer("slot");
  };

  const openEditSlot = (provider: Provider, slot: BookingSlot) => {
    setSlotForm({
      serviceId: slot.serviceId || provider.serviceIds?.[0] || "",
      providerId: provider._id,
      slotId: slot._id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity
    });
    setWeeklyForm({ ...weeklyInitial, enabled: false });
    setDrawer("slot");
  };

  const handleServiceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving("service");
    setError("");
    setNotice("");
    try {
      const input = {
        name: serviceForm.name,
        category: serviceForm.category,
        description: serviceForm.description,
        durationMinutes: serviceForm.durationMinutes,
        price: serviceForm.price,
        providerIds: serviceForm.providerIds,
        active: serviceForm.active
      };
      if (isEditingService) await updateService(serviceForm.serviceId, input);
      else await createService(input);
      setNotice(isEditingService ? "Service updated." : "Service created.");
      closeDrawer();
      await loadCatalog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save service.");
    } finally {
      setSaving("");
    }
  };

  const handleProviderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!providerForm.serviceIds.length) {
      setError("Select at least one service for this provider.");
      return;
    }
    setSaving("provider");
    setError("");
    setNotice("");
    try {
      const input = {
        name: providerForm.name,
        title: providerForm.title,
        email: providerForm.email,
        phone: providerForm.phone,
        bio: providerForm.bio,
        serviceIds: providerForm.serviceIds,
        active: providerForm.active
      };
      const routeServiceId = providerForm.serviceIds[0];
      if (isEditingProvider) await updateProvider(routeServiceId, providerForm.providerId, input);
      else await createProvider(routeServiceId, input);
      setNotice(isEditingProvider ? "Provider updated." : "Provider added.");
      closeDrawer();
      await loadCatalog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save provider.");
    } finally {
      setSaving("");
    }
  };

  const createWeeklySlots = async () => {
    if (!weeklyForm.selectedDays.length) throw new Error("Select at least one day.");
    const today = todayDateString();
    const dates = Array.from({ length: Math.max(1, weeklyForm.weeksAhead) * 7 }, (_, index) => addDays(today, index)).filter((date) => {
      return weeklyForm.selectedDays.includes(new Date(`${date}T00:00:00`).getDay());
    });

    for (const date of dates) {
      await createSlot(slotForm.serviceId, slotForm.providerId, {
        date,
        startTime: weeklyForm.startTime,
        endTime: weeklyForm.endTime,
        capacity: weeklyForm.capacity
      });
    }
  };

  const handleSlotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving("slot");
    setError("");
    setNotice("");
    try {
      if (isEditingSlot) {
        await updateSlot(slotForm.serviceId, slotForm.providerId, slotForm.slotId, {
          date: slotForm.date,
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
          capacity: slotForm.capacity
        });
      } else if (weeklyForm.enabled) {
        await createWeeklySlots();
      } else {
        await createSlot(slotForm.serviceId, slotForm.providerId, {
          date: slotForm.date,
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
          capacity: slotForm.capacity
        });
      }
      setNotice(isEditingSlot ? "Time slot updated." : weeklyForm.enabled ? "Weekly availability added." : "Time slot added.");
      closeDrawer();
      await loadCatalog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save slot.");
    } finally {
      setSaving("");
    }
  };

  const handleServiceImage = async (serviceId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(serviceId);
    try {
      await uploadServiceImage(serviceId, file);
      setNotice("Service image uploaded.");
      await loadCatalog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to upload service image.");
    } finally {
      setSaving("");
    }
  };

  const handleProviderImage = async (provider: Provider, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(provider._id);
    try {
      await uploadProviderImage(provider.serviceIds?.[0] || services[0]?._id || "unassigned", provider._id, file);
      setNotice("Provider image uploaded.");
      await loadCatalog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to upload provider image.");
    } finally {
      setSaving("");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm("Delete this service? Assigned providers will stay in the provider list.")) return;
    setSaving(serviceId);
    try {
      await deleteService(serviceId);
      setNotice("Service deleted.");
      await loadCatalog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete service.");
    } finally {
      setSaving("");
    }
  };

  const handleDeleteProvider = async (provider: Provider) => {
    if (!window.confirm("Delete this provider and all provider slots?")) return;
    setSaving(provider._id);
    try {
      await deleteProvider(provider.serviceIds?.[0] || services[0]?._id || "unassigned", provider._id);
      setNotice("Provider deleted.");
      await loadCatalog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete provider.");
    } finally {
      setSaving("");
    }
  };

  const handleDeleteSlot = async (provider: Provider, slot: BookingSlot) => {
    if (!window.confirm("Delete this time slot?")) return;
    setSaving(slot._id);
    try {
      await deleteSlot(slot.serviceId || provider.serviceIds?.[0] || "unassigned", provider._id, slot._id);
      setNotice("Slot deleted.");
      await loadCatalog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete slot.");
    } finally {
      setSaving("");
    }
  };

  const weeklyPreviewCount = Math.max(1, weeklyForm.weeksAhead) * weeklyForm.selectedDays.length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Catalog management</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">{view === "services" ? "Services" : "Providers"}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Services and providers are linked both ways. Assign providers from a service, assign services from a provider, and manage provider availability without leaving the admin shell.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openNewService} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800" type="button">New service</button>
          <button onClick={() => openNewProvider()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">New provider</button>
          <button onClick={() => openNewSlot()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">New time slot</button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link className={`rounded-md border px-4 py-2 text-sm font-bold ${view === "services" ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} href="/admin/services">Services</Link>
          <Link className={`rounded-md border px-4 py-2 text-sm font-bold ${view === "providers" ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} href="/admin/providers">Providers</Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-[220px_auto]">
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder={`Search ${view}`} value={query} onChange={(event) => { setQuery(event.target.value); setServicePage(1); setProviderPage(1); }} />
          <button onClick={loadCatalog} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" type="button">Refresh</button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Services", value: services.length },
          { label: "Providers", value: providers.length },
          { label: "Time slots", value: totalSlots },
          { label: "Unassigned providers", value: providers.filter((provider) => !provider.serviceIds?.length).length }
        ].map((card) => (
          <article key={card.label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{card.value}</p>
          </article>
        ))}
      </section>

      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

      {view === "services" ? (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-950">Service list</h2>
              <p className="mt-1 text-sm text-slate-500">Each service can have multiple providers.</p>
            </div>
          </div>
          {loading ? <p className="mt-5 text-slate-600">Loading services...</p> : null}
          {!loading && filteredServices.length === 0 ? <p className="mt-5 rounded-md border border-dashed border-slate-300 p-5 text-center text-slate-600">No services found.</p> : null}
          <div className="mt-5 overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Providers</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pagedServices.map((service) => (
                  <tr key={service._id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-950">{service.name}</p>
                      <p className="mt-1 line-clamp-1 max-w-md text-xs text-slate-500">{service.description}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{service.category}</td>
                    <td className="px-4 py-3 text-slate-600">{service.durationMinutes} min</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">${service.price}</td>
                    <td className="px-4 py-3 text-slate-600">{service.providers.length}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-1 text-xs font-bold ${service.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{service.active ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openServiceDetails(service)} type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">View</button>
                        <button onClick={() => openEditService(service)} type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={servicePage} total={filteredServices.length} onPage={setServicePage} />
        </section>
      ) : null}

      {view === "providers" ? (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-bold text-slate-950">Provider list</h2>
            <p className="mt-1 text-sm text-slate-500">Providers can be assigned to multiple services and own their time slots.</p>
          </div>
          {loading ? <p className="mt-5 text-slate-600">Loading providers...</p> : null}
          {!loading && filteredProviders.length === 0 ? <p className="mt-5 rounded-md border border-dashed border-slate-300 p-5 text-center text-slate-600">No providers found.</p> : null}
          <div className="mt-5 overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Services</th>
                  <th className="px-4 py-3">Slots</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pagedProviders.map((provider) => (
                  <tr key={provider._id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-950">{provider.name}</p>
                      <p className="mt-1 line-clamp-1 max-w-md text-xs text-slate-500">{provider.bio || "No bio added."}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{provider.title}</td>
                    <td className="px-4 py-3 text-slate-600">{provider.serviceIds?.length || 0}</td>
                    <td className="px-4 py-3 text-slate-600">{provider.slots.length}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{provider.phone || "No phone"}</p>
                      <p className="text-xs">{provider.email || "No email"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-1 text-xs font-bold ${provider.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{provider.active ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openProviderDetails(provider)} type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">View</button>
                        <button onClick={() => openEditProvider(provider)} type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={providerPage} total={filteredProviders.length} onPage={setProviderPage} />
        </section>
      ) : null}

      {drawer === "serviceDetails" && selectedService ? (
        <Drawer title={selectedService.name} eyebrow="Service details" onClose={closeDrawer}>
          <div className="grid gap-5">
            <img src={selectedService.imageUrl || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"} alt={selectedService.name} className="h-56 w-full rounded-md object-cover" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Category</p>
                <p className="mt-1 font-bold text-slate-950">{selectedService.category}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Duration</p>
                <p className="mt-1 font-bold text-slate-950">{selectedService.durationMinutes} min</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Price</p>
                <p className="mt-1 font-bold text-slate-950">${selectedService.price}</p>
              </div>
            </div>
            <section>
              <h3 className="font-bold text-slate-950">Description</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedService.description}</p>
            </section>
            <section>
              <h3 className="font-bold text-slate-950">Assigned providers</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedService.providers.length ? selectedService.providers.map((provider) => (
                  <button key={provider._id} type="button" onClick={() => openProviderDetails(provider)} className="rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100">{provider.name}</button>
                )) : <span className="text-sm text-slate-500">No providers assigned.</span>}
              </div>
            </section>
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <button onClick={() => openEditService(selectedService)} type="button" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit service</button>
              <button onClick={() => openNewProvider(selectedService._id)} type="button" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Add provider</button>
              <button onClick={() => openNewSlot(selectedService._id)} type="button" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Add slot</button>
              <label className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                Upload image
                <input className="sr-only" type="file" accept="image/*" onChange={(event) => handleServiceImage(selectedService._id, event)} />
              </label>
              <button onClick={() => handleDeleteService(selectedService._id)} type="button" className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
            </div>
          </div>
        </Drawer>
      ) : null}

      {drawer === "providerDetails" && selectedProvider ? (
        <Drawer title={selectedProvider.name} eyebrow="Provider details" onClose={closeDrawer}>
          <div className="grid gap-5">
            <div className="flex gap-4">
              <img src={selectedProvider.imageUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"} alt={selectedProvider.name} className="h-24 w-24 rounded-md object-cover" />
              <div>
                <p className="font-bold text-slate-950">{selectedProvider.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedProvider.bio || "No bio added."}</p>
                <p className="mt-2 text-sm text-slate-500">{selectedProvider.email || "No email"} · {selectedProvider.phone || "No phone"}</p>
              </div>
            </div>
            <section>
              <h3 className="font-bold text-slate-950">Assigned services</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedProvider.serviceIds?.length ? selectedProvider.serviceIds.map((id) => (
                  <span key={id} className="rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">{serviceName(id)}</span>
                )) : <span className="text-sm text-rose-600">No services assigned.</span>}
              </div>
            </section>
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-slate-950">Time slots</h3>
                <button onClick={() => openNewSlot(selectedProvider.serviceIds?.[0] || "", selectedProvider._id)} type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">Add slot</button>
              </div>
              {selectedProvider.slots.length ? (
                <div className="mt-3 grid gap-2">
                  {selectedProvider.slots.map((slot) => (
                    <div key={slot._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span className="font-semibold text-slate-700">{serviceName(slot.serviceId)} · {slot.date} · {slot.startTime}-{slot.endTime} · cap {slot.capacity}</span>
                      <span className="flex gap-2">
                        <button onClick={() => openEditSlot(selectedProvider, slot)} type="button" className="font-bold text-teal-700">Edit</button>
                        <button onClick={() => handleDeleteSlot(selectedProvider, slot)} type="button" className="font-bold text-rose-700">Delete</button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No time slots yet.</p>}
            </section>
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <button onClick={() => openEditProvider(selectedProvider)} type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit provider</button>
              <label className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                Upload image
                <input className="sr-only" type="file" accept="image/*" onChange={(event) => handleProviderImage(selectedProvider, event)} />
              </label>
              <button onClick={() => handleDeleteProvider(selectedProvider)} type="button" className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
            </div>
          </div>
        </Drawer>
      ) : null}

      {drawer === "service" ? (
        <Drawer title={isEditingService ? "Edit service" : "New service"} eyebrow="Service setup" onClose={closeDrawer}>
          <form onSubmit={handleServiceSubmit} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Service name<input className="rounded-md border border-slate-300 px-3 py-2" value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} required /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Category<input className="rounded-md border border-slate-300 px-3 py-2" value={serviceForm.category} onChange={(event) => setServiceForm({ ...serviceForm, category: event.target.value })} required /></label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Description<textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2" value={serviceForm.description} onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })} required /></label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Duration minutes<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={5} value={serviceForm.durationMinutes} onChange={(event) => setServiceForm({ ...serviceForm, durationMinutes: Number(event.target.value) })} required /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Price<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={0} value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: Number(event.target.value) })} required /></label>
              <label className="flex items-center gap-2 pt-7 text-sm font-bold text-slate-700"><input type="checkbox" checked={serviceForm.active} onChange={(event) => setServiceForm({ ...serviceForm, active: event.target.checked })} /> Active</label>
            </div>
            <fieldset className="grid gap-2 rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-700">Providers for this service</legend>
              {providers.length ? providers.map((provider) => (
                <label key={provider._id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <span>{provider.name}<span className="ml-2 text-xs text-slate-500">{provider.title}</span></span>
                  <input type="checkbox" checked={serviceForm.providerIds.includes(provider._id)} onChange={() => setServiceForm({ ...serviceForm, providerIds: toggleId(serviceForm.providerIds, provider._id) })} />
                </label>
              )) : <p className="text-sm text-slate-500">Create providers first, then assign them here.</p>}
            </fieldset>
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Images are uploaded from the service list after saving, so the file is attached to a saved service record.</p>
            <button className="rounded-md bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800" disabled={saving === "service"}>{saving === "service" ? "Saving..." : isEditingService ? "Save service" : "Create service"}</button>
          </form>
        </Drawer>
      ) : null}

      {drawer === "provider" ? (
        <Drawer title={isEditingProvider ? "Edit provider" : "New provider"} eyebrow="Provider setup" onClose={closeDrawer}>
          <form onSubmit={handleProviderSubmit} className="grid gap-4">
            <fieldset className="grid gap-2 rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-700">Services for this provider</legend>
              {services.length ? services.map((service) => (
                <label key={service._id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <span>{service.name}<span className="ml-2 text-xs text-slate-500">{service.category}</span></span>
                  <input type="checkbox" checked={providerForm.serviceIds.includes(service._id)} onChange={() => setProviderForm({ ...providerForm, serviceIds: toggleId(providerForm.serviceIds, service._id) })} />
                </label>
              )) : <p className="text-sm text-slate-500">Create at least one service first.</p>}
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Provider name<input className="rounded-md border border-slate-300 px-3 py-2" value={providerForm.name} onChange={(event) => setProviderForm({ ...providerForm, name: event.target.value })} required /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Title<input className="rounded-md border border-slate-300 px-3 py-2" value={providerForm.title} onChange={(event) => setProviderForm({ ...providerForm, title: event.target.value })} required /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Email<input className="rounded-md border border-slate-300 px-3 py-2" type="email" value={providerForm.email} onChange={(event) => setProviderForm({ ...providerForm, email: event.target.value })} /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Phone<input className="rounded-md border border-slate-300 px-3 py-2" value={providerForm.phone} onChange={(event) => setProviderForm({ ...providerForm, phone: event.target.value })} /></label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Bio<textarea className="min-h-20 rounded-md border border-slate-300 px-3 py-2" value={providerForm.bio} onChange={(event) => setProviderForm({ ...providerForm, bio: event.target.value })} /></label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={providerForm.active} onChange={(event) => setProviderForm({ ...providerForm, active: event.target.checked })} /> Active provider</label>
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">A provider must be assigned to at least one service. Images are uploaded from the provider list after saving.</p>
            <button className="rounded-md bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800" disabled={saving === "provider"}>{saving === "provider" ? "Saving..." : isEditingProvider ? "Save provider" : "Create provider"}</button>
          </form>
        </Drawer>
      ) : null}

      {drawer === "slot" ? (
        <Drawer title={isEditingSlot ? "Edit time slot" : "New time slot"} eyebrow="Availability" onClose={closeDrawer}>
          <form onSubmit={handleSlotSubmit} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Service<select className="rounded-md border border-slate-300 px-3 py-2" value={slotForm.serviceId} onChange={(event) => setSlotForm({ ...slotForm, serviceId: event.target.value, providerId: "" })} required disabled={isEditingSlot}>
                <option value="">Select service</option>
                {services.map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}
              </select></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Provider<select className="rounded-md border border-slate-300 px-3 py-2" value={slotForm.providerId} onChange={(event) => setSlotForm({ ...slotForm, providerId: event.target.value })} required disabled={isEditingSlot || !slotForm.serviceId}>
                <option value="">Select provider</option>
                {slotProviderOptions.map((provider) => <option key={provider._id} value={provider._id}>{provider.name}</option>)}
              </select></label>
            </div>
            {!isEditingSlot ? (
              <div className="inline-grid w-fit grid-cols-2 rounded-md border border-slate-300 p-1 text-sm font-bold">
                <button type="button" className={`rounded px-4 py-2 ${weeklyForm.enabled ? "bg-slate-950 text-white" : "text-slate-600"}`} onClick={() => setWeeklyForm({ ...weeklyForm, enabled: true })}>Weekly</button>
                <button type="button" className={`rounded px-4 py-2 ${!weeklyForm.enabled ? "bg-slate-950 text-white" : "text-slate-600"}`} onClick={() => setWeeklyForm({ ...weeklyForm, enabled: false })}>Single</button>
              </div>
            ) : null}
            {!isEditingSlot && weeklyForm.enabled ? (
              <fieldset className="grid gap-4 rounded-md border border-slate-200 p-3">
                <legend className="px-1 text-sm font-semibold text-slate-800">Weekly availability</legend>
                <div>
                  <p className="text-sm font-medium text-slate-700">Days</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weekDays.map((day, index) => (
                      <button key={day} type="button" className={`rounded-md border px-3 py-2 text-sm font-bold ${weeklyForm.selectedDays.includes(index) ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600"}`} onClick={() => setWeeklyForm({ ...weeklyForm, selectedDays: toggleId(weeklyForm.selectedDays.map(String), String(index)).map(Number) })}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">Start<input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={weeklyForm.startTime} onChange={(event) => setWeeklyForm({ ...weeklyForm, startTime: event.target.value })} required /></label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">End<input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={weeklyForm.endTime} onChange={(event) => setWeeklyForm({ ...weeklyForm, endTime: event.target.value })} required /></label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">Capacity<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={1} value={weeklyForm.capacity} onChange={(event) => setWeeklyForm({ ...weeklyForm, capacity: Number(event.target.value) })} required /></label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">Weeks ahead<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={1} max={12} value={weeklyForm.weeksAhead} onChange={(event) => setWeeklyForm({ ...weeklyForm, weeksAhead: Number(event.target.value) })} /></label>
                </div>
                <p className="rounded-md bg-teal-50 p-3 text-sm font-semibold text-teal-800">This will create about {weeklyPreviewCount} slots for the selected provider and service.</p>
              </fieldset>
            ) : (
              <>
                <label className="grid gap-2 text-sm font-medium text-slate-700">Date<input className="rounded-md border border-slate-300 px-3 py-2" type="date" min={todayDateString()} value={slotForm.date} onChange={(event) => setSlotForm({ ...slotForm, date: event.target.value })} required /></label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">Start<input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={slotForm.startTime} onChange={(event) => setSlotForm({ ...slotForm, startTime: event.target.value })} required /></label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">End<input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={slotForm.endTime} onChange={(event) => setSlotForm({ ...slotForm, endTime: event.target.value })} required /></label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">Capacity<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={1} value={slotForm.capacity} onChange={(event) => setSlotForm({ ...slotForm, capacity: Number(event.target.value) })} required /></label>
                </div>
              </>
            )}
            <button className="rounded-md bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800" disabled={saving === "slot"}>{saving === "slot" ? "Saving..." : isEditingSlot ? "Save slot" : weeklyForm.enabled ? "Create weekly slots" : "Create slot"}</button>
          </form>
        </Drawer>
      ) : null}
    </div>
  );
}
