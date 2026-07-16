import type { Booking } from "./booking";

export type Permission = {
  key: string;
  module: string;
  group: string;
  action: string;
  label: string;
  description: string;
};

export type PermissionGroup = {
  module: string;
  label: string;
  permissions: Array<{
    action: string;
    label: string;
    description: string;
  }>;
};

export type Role = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
};

export type AdminUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  status: "invited" | "active" | "inactive" | "suspended";
  role?: {
    id: string;
    name: string;
    slug: string;
    permissions: string[];
  } | null;
  roleId?: Role;
};

export type CreateUserResponse = {
  user: AdminUser;
  setupToken: string;
  inviteExpiresAt: string;
};

export type DashboardStats = {
  bookingCount: number;
  pendingBookings: number;
  confirmedBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  todayBookings?: number;
  tomorrowBookings?: number;
  thisWeekBookings?: number;
  thisMonthBookings?: number;
  byStatus?: Partial<Record<Booking["status"], number>>;
  recentBookings?: Booking[];
  userCount: number;
  roleCount: number;
};
