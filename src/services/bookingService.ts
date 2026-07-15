import { apiRequest } from "./api";
import type { Booking, CreateBookingInput, Service } from "@/types/booking";

export const createBooking = (input: CreateBookingInput) => {
  return apiRequest<{ booking: Booking }>("/bookings", {
    method: "POST",
    body: JSON.stringify(input)
  });
};

export const fetchCatalog = () => {
  return apiRequest<{ services: Service[] }>("/catalog");
};

export const updateBookingStatus = (bookingId: string, status: Booking["status"], publicToken?: string) => {
  return apiRequest<{ booking: Booking }>(`/bookings/${bookingId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, publicToken })
  });
};
