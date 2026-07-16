import type { Booking } from "./booking";

export type BookingReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  status?: Booking["status"] | "all";
  serviceName?: string;
  providerName?: string;
  clientType?: Booking["clientType"] | "all";
};

export type BookingReportSummary = {
  totalBookings: number;
  pendingCall: number;
  confirmed: number;
  rescheduleRequested: number;
  cancelled: number;
  completed: number;
  noShow: number;
  cancellationRate: number;
  completionRate: number;
  noShowRate: number;
  totalPaymentAmount: number;
  totalPaidAmount: number;
  totalBalanceAmount: number;
  waivedAmount: number;
};

export type BookingReportNameGroup = {
  name: string;
  count: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
  paymentAmount: number;
  paidAmount: number;
  balanceAmount: number;
};

export type BookingReport = {
  filters: BookingReportFilters;
  summary: BookingReportSummary;
  byStatus: Array<{ status: Booking["status"]; count: number }>;
  byService: BookingReportNameGroup[];
  byProvider: BookingReportNameGroup[];
  byClientType: Array<{ clientType: Booking["clientType"]; count: number }>;
  dailyCounts: Array<{ date: string; count: number }>;
  filterOptions: {
    services: string[];
    providers: string[];
  };
  bookings: Booking[];
};
