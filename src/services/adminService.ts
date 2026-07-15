import { apiRequest } from "./api";
import type { Booking, Service } from "@/types/booking";
import type { AdminUser, CreateUserResponse, DashboardStats, Permission, PermissionGroup, Role } from "@/types/auth";
import type { BookingReport, BookingReportFilters } from "@/types/report";

export const loginAdmin = (input: { email: string; password: string }) => {
  return apiRequest<{ user: AdminUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const logoutAdmin = () => {
  return apiRequest<null>("/auth/logout", { method: "POST" });
};

export const fetchCurrentAdmin = () => {
  return apiRequest<{ user: AdminUser }>("/auth/me");
};

export const fetchDashboard = () => {
  return apiRequest<{ stats: DashboardStats }>("/admin/dashboard");
};

export const fetchAdminBookings = () => {
  return apiRequest<{ bookings: Booking[] }>("/admin/bookings");
};

export const fetchBookingReport = (filters: BookingReportFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });

  const query = params.toString();
  return apiRequest<{ report: BookingReport }>(`/admin/reports/bookings${query ? `?${query}` : ""}`);
};

export const updateAdminBookingStatus = (bookingId: string, status: Booking["status"]) => {
  return apiRequest<{ booking: Booking }>(`/admin/bookings/${bookingId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
};

export const updateAdminBooking = (bookingId: string, input: Booking) => {
  return apiRequest<{ booking: Booking }>(`/admin/bookings/${bookingId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
};

export const deleteAdminBooking = (bookingId: string) => {
  return apiRequest<{ booking: Booking }>(`/admin/bookings/${bookingId}`, { method: "DELETE" });
};

export const fetchPermissions = () => {
  return apiRequest<{ permissions: Permission[]; groups: PermissionGroup[] }>("/admin/permissions");
};

export const fetchRoles = () => {
  return apiRequest<{ roles: Role[] }>("/admin/roles");
};

export const createRole = (input: { name: string; description: string; permissions: string[] }) => {
  return apiRequest<{ role: Role }>("/admin/roles", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const fetchUsers = () => {
  return apiRequest<{ users: AdminUser[] }>("/admin/users");
};

export const createUser = (input: { name: string; email: string; roleId: string }) => {
  return apiRequest<CreateUserResponse>("/admin/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const setupPassword = (input: { token: string; password: string }) => {
  return apiRequest<{ user: AdminUser }>("/auth/setup-password", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const fetchAdminCatalog = () => {
  return apiRequest<{ services: Service[]; providers: Service["providers"] }>("/admin/catalog");
};

export const createService = (input: { name: string; category: string; description: string; durationMinutes: number; price: number; providerIds?: string[] }) => {
  return apiRequest<{ service: Service }>("/admin/services", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const updateService = (serviceId: string, input: { name: string; category: string; description: string; durationMinutes: number; price: number; providerIds?: string[] }) => {
  return apiRequest<{ service: Service }>(`/admin/services/${serviceId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
};

export const createProvider = (serviceId: string, input: { name: string; title: string; email: string; phone: string; bio: string; serviceIds?: string[] }) => {
  return apiRequest<{ provider: Service["providers"][number] }>(`/admin/services/${serviceId}/providers`, {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const updateProvider = (serviceId: string, providerId: string, input: { name: string; title: string; email: string; phone: string; bio: string; serviceIds?: string[] }) => {
  return apiRequest<{ provider: Service["providers"][number] }>(`/admin/services/${serviceId}/providers/${providerId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
};

export const createSlot = (serviceId: string, providerId: string, input: { date: string; startTime: string; endTime: string; capacity: number }) => {
  return apiRequest<{ service: Service }>(`/admin/services/${serviceId}/providers/${providerId}/slots`, {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const updateSlot = (serviceId: string, providerId: string, slotId: string, input: { date: string; startTime: string; endTime: string; capacity: number }) => {
  return apiRequest<{ service: Service }>(`/admin/services/${serviceId}/providers/${providerId}/slots/${slotId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
};

export const uploadServiceImage = (serviceId: string, file: File) => {
  const body = new FormData();
  body.append("image", file);
  return apiRequest<{ service: Service }>(`/admin/services/${serviceId}/image`, {
    method: "POST",
    body
  });
};

export const uploadProviderImage = (serviceId: string, providerId: string, file: File) => {
  const body = new FormData();
  body.append("image", file);
  return apiRequest<{ service: Service }>(`/admin/services/${serviceId}/providers/${providerId}/image`, {
    method: "POST",
    body
  });
};

export const deleteService = (serviceId: string) => {
  return apiRequest<{ service: Service }>(`/admin/services/${serviceId}`, { method: "DELETE" });
};

export const deleteProvider = (serviceId: string, providerId: string) => {
  return apiRequest<{ service: Service }>(`/admin/services/${serviceId}/providers/${providerId}`, { method: "DELETE" });
};

export const deleteSlot = (serviceId: string, providerId: string, slotId: string) => {
  return apiRequest<{ service: Service }>(`/admin/services/${serviceId}/providers/${providerId}/slots/${slotId}`, { method: "DELETE" });
};
