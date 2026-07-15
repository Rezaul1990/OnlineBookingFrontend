"use client";

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

type DrawerMode = "service" | "provider" | "slot" | null;

const serviceInitial = { serviceId: "", name: "", category: "", description: "", durationMinutes: 30, price: 0, providerIds: [] as string[] };
const providerInitial = { providerId: "", name: "", title: "", email: "", phone: "", bio: "", serviceIds: [] as string[] };
const slotInitial = { serviceId: "", providerId: "", slotId: "", date: "", startTime: "", endTime: "", capacity: 1 };
const weeklyInitial = { enabled: true, selectedDays: [new Date().getDay()], startTime: "09:00", endTime: "17:00", capacity: 1, weeksAhead: 4 };
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/30">
      <button className="absolute inset-0 h-full w-full cursor-default" type="button" aria-label="Close drawer" onClick={onClose} />
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

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function CatalogPanel() {
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

  const isEditingService = Boolean(serviceForm.serviceId);
  const isEditingProvider = Boolean(providerForm.providerId);
  const isEditingSlot = Boolean(slotForm.slotId);
  const selectedSlotService = useMemo(() => services.find((service) => service._id === slotForm.serviceId), [services, slotForm.serviceId]);
  const slotProviderOptions = selectedSlotService?.providers || [];

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
      providerIds: service.providerIds || service.providers.map((provider) => provider._id)
    });
    setDrawer("service");
  };

  const openNewProvider = () => {
    setProviderForm(providerInitial);
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
      serviceIds: provider.serviceIds || []
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
        providerIds: serviceForm.providerIds
      };
      if (isEditingService) {
        await updateService(serviceForm.serviceId, input);
      } else {
        await createService(input);
      }
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
        serviceIds: providerForm.serviceIds
      };
      const routeServiceId = providerForm.serviceIds[0] || services[0]?._id || "unassigned";
      if (isEditingProvider) {
        await updateProvider(routeServiceId, providerForm.providerId, input);
      } else {
        await createProvider(routeServiceId, input);
      }
      setNotice(isEditingProvider ? "Provider updated." : "Provider added.");
      closeDrawer();
      await loadCatalog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save provider.");
    } finally {
      setSaving("");
    }
  };

  const handleSlotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving("slot");
    setError("");
    setNotice("");
    try {
      if (isEditingSlot) {
        const input = {
          date: slotForm.date,
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
          capacity: slotForm.capacity
        };
        await updateSlot(slotForm.serviceId, slotForm.providerId, slotForm.slotId, input);
      } else if (weeklyForm.enabled) {
        if (!weeklyForm.selectedDays.length) throw new Error("Select at least one day.");
        const today = todayDateString();
        const totalDays = Math.max(1, weeklyForm.weeksAhead) * 7;
        const dates = Array.from({ length: totalDays }, (_, index) => addDays(today, index)).filter((date) => {
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
      } else {
        const input = {
          date: slotForm.date,
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
          capacity: slotForm.capacity
        };
        await createSlot(slotForm.serviceId, slotForm.providerId, input);
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

  const serviceName = (serviceId?: string) => services.find((service) => service._id === serviceId)?.name || "Unassigned";

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Services and providers</h1>
          <p className="mt-1 text-sm text-slate-600">Providers are managed separately. Assign providers from service create/edit, or assign services from provider create/edit.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openNewService} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800" type="button">New service</button>
          <button onClick={openNewProvider} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">New provider</button>
          <button onClick={() => openNewSlot()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button">New slot</button>
        </div>
      </div>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Services</h2>
            <p className="mt-1 text-sm text-slate-600">Select providers for each service in new/edit drawers.</p>
          </div>
          <button onClick={loadCatalog} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" type="button">Refresh</button>
        </div>
        {loading ? <p className="mt-5 text-slate-600">Loading catalog...</p> : null}
        {!loading && services.length === 0 ? <p className="mt-5 rounded-md border border-dashed border-slate-300 p-5 text-center text-slate-600">No services created yet.</p> : null}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <article key={service._id} className="rounded-md border border-slate-200 p-4">
              <img src={service.imageUrl || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=500&q=80"} alt={service.name} className="h-32 w-full rounded-md object-cover" />
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-teal-700">{service.category}</p>
                  <h3 className="mt-1 text-lg font-bold">{service.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{service.description}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{service.durationMinutes} min · ${service.price}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openEditService(service)} type="button" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit</button>
                  <label className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                    Upload image
                    <input className="sr-only" type="file" accept="image/*" onChange={(event) => handleServiceImage(service._id, event)} />
                  </label>
                  <button onClick={() => handleDeleteService(service._id)} type="button" className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {service.providers.length ? service.providers.map((provider) => (
                  <span key={provider._id} className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{provider.name}</span>
                )) : <span className="text-sm text-slate-500">No providers assigned</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Providers</h2>
            <p className="mt-1 text-sm text-slate-600">Providers stay separate and can be assigned to one or more services.</p>
          </div>
        </div>
        {!loading && providers.length === 0 ? <p className="mt-5 rounded-md border border-dashed border-slate-300 p-5 text-center text-slate-600">No providers created yet.</p> : null}
        <div className="mt-5 grid gap-4">
          {providers.map((provider) => (
            <article key={provider._id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <img src={provider.imageUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80"} alt={provider.name} className="h-16 w-16 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{provider.name}</h3>
                  <p className="text-sm text-slate-600">{provider.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {provider.serviceIds?.length ? provider.serviceIds.map((id) => (
                      <span key={id} className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">{serviceName(id)}</span>
                    )) : <span className="text-xs font-semibold text-slate-500">No services assigned</span>}
                  </div>
                </div>
                <button onClick={() => openEditProvider(provider)} type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit</button>
                <label className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                  Upload image
                  <input className="sr-only" type="file" accept="image/*" onChange={(event) => handleProviderImage(provider, event)} />
                </label>
                <button onClick={() => openNewSlot(provider.serviceIds?.[0] || "", provider._id)} type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">Add slot</button>
                <button onClick={() => handleDeleteProvider(provider)} type="button" className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
              </div>

              {provider.slots.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {provider.slots.map((slot) => (
                    <span key={slot._id} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                      {serviceName(slot.serviceId)} · {slot.date} {slot.startTime}-{slot.endTime}
                      <button onClick={() => openEditSlot(provider, slot)} type="button" className="text-teal-700">Edit</button>
                      <button onClick={() => handleDeleteSlot(provider, slot)} type="button" className="text-red-700">Delete</button>
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {drawer === "service" ? (
        <Drawer title={isEditingService ? "Edit service" : "New service"} onClose={closeDrawer}>
          <form onSubmit={handleServiceSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">Service name<input className="rounded-md border border-slate-300 px-3 py-2" value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} required /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Category<input className="rounded-md border border-slate-300 px-3 py-2" value={serviceForm.category} onChange={(event) => setServiceForm({ ...serviceForm, category: event.target.value })} required /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Description<textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2" value={serviceForm.description} onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })} required /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Duration<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={5} value={serviceForm.durationMinutes} onChange={(event) => setServiceForm({ ...serviceForm, durationMinutes: Number(event.target.value) })} required /></label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Price<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={0} value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: Number(event.target.value) })} required /></label>
            </div>
            <fieldset className="grid gap-2 rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-700">Providers for this service</legend>
              {providers.length ? providers.map((provider) => (
                <label key={provider._id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={serviceForm.providerIds.includes(provider._id)} onChange={() => setServiceForm({ ...serviceForm, providerIds: toggleId(serviceForm.providerIds, provider._id) })} />
                  {provider.name}
                </label>
              )) : <p className="text-sm text-slate-500">Create providers first, then assign them here.</p>}
            </fieldset>
            <button className="rounded-md bg-teal-700 px-4 py-3 font-semibold text-white" disabled={saving === "service"}>{saving === "service" ? "Saving..." : isEditingService ? "Save changes" : "Create service"}</button>
          </form>
        </Drawer>
      ) : null}

      {drawer === "provider" ? (
        <Drawer title={isEditingProvider ? "Edit provider" : "New provider"} onClose={closeDrawer}>
          <form onSubmit={handleProviderSubmit} className="grid gap-4">
            <fieldset className="grid gap-2 rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-700">Services for this provider</legend>
              {services.length ? services.map((service) => (
                <label key={service._id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={providerForm.serviceIds.includes(service._id)} onChange={() => setProviderForm({ ...providerForm, serviceIds: toggleId(providerForm.serviceIds, service._id) })} />
                  {service.name}
                </label>
              )) : <p className="text-sm text-slate-500">Create services first, then assign them here.</p>}
            </fieldset>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Provider name<input className="rounded-md border border-slate-300 px-3 py-2" value={providerForm.name} onChange={(event) => setProviderForm({ ...providerForm, name: event.target.value })} required /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Title<input className="rounded-md border border-slate-300 px-3 py-2" value={providerForm.title} onChange={(event) => setProviderForm({ ...providerForm, title: event.target.value })} required /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Email<input className="rounded-md border border-slate-300 px-3 py-2" type="email" value={providerForm.email} onChange={(event) => setProviderForm({ ...providerForm, email: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Phone<input className="rounded-md border border-slate-300 px-3 py-2" value={providerForm.phone} onChange={(event) => setProviderForm({ ...providerForm, phone: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Bio<textarea className="min-h-20 rounded-md border border-slate-300 px-3 py-2" value={providerForm.bio} onChange={(event) => setProviderForm({ ...providerForm, bio: event.target.value })} /></label>
            <button className="rounded-md bg-teal-700 px-4 py-3 font-semibold text-white" disabled={saving === "provider"}>{saving === "provider" ? "Saving..." : isEditingProvider ? "Save changes" : "Add provider"}</button>
          </form>
        </Drawer>
      ) : null}

      {drawer === "slot" ? (
        <Drawer title={isEditingSlot ? "Edit slot" : "New slot"} onClose={closeDrawer}>
          <form onSubmit={handleSlotSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">Service<select aria-label="Service" className="rounded-md border border-slate-300 px-3 py-2" value={slotForm.serviceId} onChange={(event) => setSlotForm({ ...slotForm, serviceId: event.target.value, providerId: "" })} required disabled={isEditingSlot}>
              <option value="">Select service</option>
              {services.map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}
            </select></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Provider<select aria-label="Provider" className="rounded-md border border-slate-300 px-3 py-2" value={slotForm.providerId} onChange={(event) => setSlotForm({ ...slotForm, providerId: event.target.value })} required disabled={isEditingSlot}>
              <option value="">Select provider</option>
              {slotProviderOptions.map((provider) => <option key={provider._id} value={provider._id}>{provider.name}</option>)}
            </select></label>
            {!isEditingSlot ? (
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={weeklyForm.enabled} onChange={(event) => setWeeklyForm({ ...weeklyForm, enabled: event.target.checked })} />
                Weekly hours
              </label>
            ) : null}
            {!isEditingSlot && weeklyForm.enabled ? (
              <fieldset className="grid gap-4 rounded-md border border-slate-200 p-3">
                <legend className="px-1 text-sm font-semibold text-slate-800">Weekly hours</legend>
                <label className="grid gap-2 text-sm font-medium text-slate-700">Location<select className="rounded-md border border-slate-300 px-3 py-2" defaultValue="main">
                  <option value="main">Main location</option>
                </select></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Mode</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-700">
                      <label className="flex items-center gap-1"><input type="checkbox" checked readOnly /> In person</label>
                      <label className="flex items-center gap-1"><input type="checkbox" readOnly /> Phone</label>
                      <label className="flex items-center gap-1"><input type="checkbox" readOnly /> Online</label>
                    </div>
                  </div>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">Weeks ahead<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={1} max={12} value={weeklyForm.weeksAhead} onChange={(event) => setWeeklyForm({ ...weeklyForm, weeksAhead: Number(event.target.value) })} /></label>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_130px_130px]">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Days</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-700">
                      {weekDays.map((day, index) => (
                        <label key={day} className="flex items-center gap-1">
                          <input type="checkbox" checked={weeklyForm.selectedDays.includes(index)} onChange={() => setWeeklyForm({ ...weeklyForm, selectedDays: toggleId(weeklyForm.selectedDays.map(String), String(index)).map(Number) })} />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">Start<input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={weeklyForm.startTime} onChange={(event) => setWeeklyForm({ ...weeklyForm, startTime: event.target.value })} required /></label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">End<input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={weeklyForm.endTime} onChange={(event) => setWeeklyForm({ ...weeklyForm, endTime: event.target.value })} required /></label>
                </div>
                <label className="grid gap-2 text-sm font-medium text-slate-700">Capacity<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={1} value={weeklyForm.capacity} onChange={(event) => setWeeklyForm({ ...weeklyForm, capacity: Number(event.target.value) })} required /></label>
              </fieldset>
            ) : (
              <>
                <label className="grid gap-2 text-sm font-medium text-slate-700">Date<input className="rounded-md border border-slate-300 px-3 py-2" type="date" min={todayDateString()} value={slotForm.date} onChange={(event) => setSlotForm({ ...slotForm, date: event.target.value })} required /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">Start<input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={slotForm.startTime} onChange={(event) => setSlotForm({ ...slotForm, startTime: event.target.value })} required /></label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">End<input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={slotForm.endTime} onChange={(event) => setSlotForm({ ...slotForm, endTime: event.target.value })} required /></label>
                </div>
                <label className="grid gap-2 text-sm font-medium text-slate-700">Capacity<input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={1} value={slotForm.capacity} onChange={(event) => setSlotForm({ ...slotForm, capacity: Number(event.target.value) })} required /></label>
              </>
            )}
            <button className="rounded-md bg-teal-700 px-4 py-3 font-semibold text-white" disabled={saving === "slot"}>{saving === "slot" ? "Saving..." : isEditingSlot ? "Save changes" : weeklyForm.enabled ? "Add Hours" : "Add slot"}</button>
          </form>
        </Drawer>
      ) : null}
    </div>
  );
}
