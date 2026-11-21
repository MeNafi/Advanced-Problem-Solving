import { apiClient } from "./api-client";
import type { BookingQuote, Cinema } from "@/types";

export const cinemasService = {
  list: async (): Promise<Cinema[]> => (await apiClient.get<Cinema[]>("/cinemas")).data,
  booking: async (cinemaId: string, groupSize: number): Promise<BookingQuote> =>
    (await apiClient.get<BookingQuote>(`/cinemas/${cinemaId}/booking`, { params: { groupSize } })).data,
};
