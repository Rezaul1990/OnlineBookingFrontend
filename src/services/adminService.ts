import { apiRequest, clearAdminToken, setAdminToken } from "./api";
import type { Booking, Provider, Service } from "@/types/booking";
import type { AdminUser, CreateUserResponse, DashboardStats, Permission, PermissionGroup, Role } from "@/types/auth";
import type { BookingReport, BookingReportFilters } from "@/types/report";

export type AdminBookingFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: "all" | Booking["status"];
  clientType?: "all" | Booking["clientType"];
  serviceName?: string;
  providerName?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

type ServiceInput = { name: string; category: string; description: string; durationMinutes: number; price: number; providerIds?: string[]; active?: boolean };
type ProviderInput = { name: string; title: string; email: string; phone: string; bio: string; serviceIds?: string[]; active?: boolean };

export const loginAdmin = (input: { email: string; password: string }) => {
  return apiRequest<{ token: string; user: AdminUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  }).then((data) => {
    setAdminToken(data.token);
    return data;
  });
};

export const logoutAdmin = () => {
  clearAdminToken();
  return apiRequest<null>("/auth/logout", { method: "POST" });
};

export const fetchCurrentAdmin = () => {
  return apiRequest<{ user: AdminUser }>("/auth/me");
};

export const fetchDashboard = () => {
  return apiRequest<{ stats: DashboardStats }>("/admin/dashboard");
};

export const fetchAdminBookings = (filters: AdminBookingFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, String(value));
  });

  const query = params.toString();
  return apiRequest<{
    bookings: Booking[];
    filters: AdminBookingFilters;
    pagination?: { page: number; pageSize: number; total: number; totalPages: number };
    summary: { total: number; matchingTotal?: number; pendingCall: number; confirmed: number; completed: number; cancelled: number };
    filterOptions: { services: string[]; providers: string[] };
  }>(`/admin/bookings${query ? `?${query}` : ""}`);
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
  return apiRequest<{ services: Service[]; providers: Provider[] }>("/admin/catalog");
};

export const createService = (input: ServiceInput) => {
  return apiRequest<{ service: Service }>("/admin/services", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const updateService = (serviceId: string, input: ServiceInput) => {
  return apiRequest<{ service: Service }>(`/admin/services/${serviceId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
};

export const createProvider = (serviceId: string, input: ProviderInput) => {
  return apiRequest<{ provider: Service["providers"][number] }>(`/admin/services/${serviceId}/providers`, {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const updateProvider = (serviceId: string, providerId: string, input: ProviderInput) => {
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

export const createBulkSlots = (
  serviceId: string,
  providerId: string,
  input: { dateFrom: string; dateTo: string; selectedDays: number[]; startTime: string; endTime: string; durationMinutes: number; capacity: number }
) => {
  return apiRequest<{ provider: Provider; created: number; skippedDuplicates: number; skippedClosed: number }>(`/admin/services/${serviceId}/providers/${providerId}/slots/bulk`, {
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

export const addProviderClosedDate = (providerId: string, input: { date: string; reason: string }) => {
  return apiRequest<{ provider: Provider }>(`/admin/providers/${providerId}/closed-dates`, {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const deleteProviderClosedDate = (providerId: string, date: string) => {
  return apiRequest<{ provider: Provider }>(`/admin/providers/${providerId}/closed-dates/${date}`, { method: "DELETE" });
};
