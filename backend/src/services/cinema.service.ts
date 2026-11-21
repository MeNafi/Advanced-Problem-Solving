import { findMinimumBundles } from "../algorithms/booking-optimizer";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import type { CreateCinemaInput } from "../validators/cinema.validator";

export function listCinemas() {
  return prisma.cinema.findMany({ orderBy: { name: "asc" } });
}

export function createCinema(input: CreateCinemaInput) {
  return prisma.cinema.create({ data: { name: input.name, bundleSizes: input.bundleSizes } });
}

export async function getBookingQuote(cinemaId: string, groupSize: number) {
  const cinema = await prisma.cinema.findUnique({ where: { id: cinemaId } });
  if (!cinema) throw new AppError(404, "NOT_FOUND", "Cinema not found.");

  const result = findMinimumBundles(cinema.bundleSizes, groupSize);
  return {
    cinema: { id: cinema.id, name: cinema.name, bundleSizes: cinema.bundleSizes },
    ...result,
  };
}
