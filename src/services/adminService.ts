import { apiRequest } from "./api";
import type { AdminUser, DashboardStats, Permission, PermissionGroup, Role } from "@/types/auth";

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

export const createUser = (input: { name: string; email: string; password: string; roleId: string; status: string }) => {
  return apiRequest<{ user: AdminUser }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
};
