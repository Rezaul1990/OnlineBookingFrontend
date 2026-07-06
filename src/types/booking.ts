export type Booking = {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  serviceName: string;
  bookingDate: string;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled";
};

export type CreateBookingInput = {
  customerName: string;
  email: string;
  phone: string;
  serviceName: string;
  bookingDate: string;
  notes: string;
};
