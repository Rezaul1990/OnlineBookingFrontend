import { apiRequest } from "./api";
import type { Booking, CreateBookingInput } from "@/types/booking";

export const fetchBookings = () => {
  return apiRequest<{ bookings: Booking[] }>("/bookings");
};

export const createBooking = (input: CreateBookingInput) => {
  return apiRequest<{ booking: Booking }>("/bookings", {
    method: "POST",
    body: JSON.stringify(input)
  });
};
