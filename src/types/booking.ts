export type BookingSlot = {
  _id: string;
  serviceId?: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  active: boolean;
};

export type Provider = {
  _id: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  bio?: string;
  imageUrl?: string;
  serviceIds?: string[];
  closedDates?: Array<{ _id?: string; date: string; reason?: string }>;
  active: boolean;
  slots: BookingSlot[];
};

export type Service = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  imageUrl?: string;
  durationMinutes: number;
  price: number;
  providerIds?: string[];
  active: boolean;
  providers: Provider[];
};

export type Booking = {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  clientType: "new" | "returning";
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  slotId: string;
  bookingDate: string;
  slotLabel: string;
  notes?: string;
  paymentMethod: "cash" | "bkash" | "nagad" | "card";
  paymentStatus: "unpaid" | "partial" | "paid" | "waived";
  paymentAmount: number;
  paidAmount: number;
  balanceAmount: number;
  timeline?: Array<{
    _id?: string;
    action: string;
    label: string;
    actorName: string;
    actorRole: string;
    note?: string;
    at: string;
  }>;
  publicToken?: string;
  status: "pending_call" | "confirmed" | "reschedule_requested" | "cancelled" | "completed" | "no_show";
};

export type CreateBookingInput = {
  customerName: string;
  email: string;
  phone: string;
  clientType: "new" | "returning";
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  slotId: string;
  bookingDate: string;
  slotLabel: string;
  paymentMethod: Booking["paymentMethod"];
  paymentAmount: number;
  notes: string;
};
