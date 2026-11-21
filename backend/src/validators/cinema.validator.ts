import { MAX_BUNDLE_SIZE, MAX_GROUP_SIZE, MIN_BUNDLE_SIZE, MIN_GROUP_SIZE } from "../algorithms/booking-optimizer";
import { validationError } from "../utils/errors";

export const MAX_BUNDLE_COUNT = 10;
export const MAX_CINEMA_NAME_LENGTH = 100;

export interface CreateCinemaInput {
  name: string;
  bundleSizes: number[];
}

export function validateCreateCinema(body: unknown): CreateCinemaInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw validationError("Request body must be a JSON object.");
  }
  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  let name = "";
  if (typeof data.name !== "string" || data.name.trim().length === 0) {
    errors.name = "Cinema name is required.";
  } else if (data.name.trim().length > MAX_CINEMA_NAME_LENGTH) {
    errors.name = `Cinema name must be at most ${MAX_CINEMA_NAME_LENGTH} characters.`;
  } else {
    name = data.name.trim();
  }

  let bundleSizes: number[] = [];
  const sizes = data.bundleSizes;
  if (!Array.isArray(sizes) || sizes.length < 1 || sizes.length > MAX_BUNDLE_COUNT) {
    errors.bundleSizes = `Provide between 1 and ${MAX_BUNDLE_COUNT} bundle sizes.`;
  } else if (
    !sizes.every((s) => typeof s === "number" && Number.isInteger(s) && s >= MIN_BUNDLE_SIZE && s <= MAX_BUNDLE_SIZE)
  ) {
    errors.bundleSizes = `Every bundle size must be an integer between ${MIN_BUNDLE_SIZE} and ${MAX_BUNDLE_SIZE}.`;
  } else if (new Set(sizes).size !== sizes.length) {
    errors.bundleSizes = "Bundle sizes must not contain duplicates.";
  } else {
    bundleSizes = [...(sizes as number[])].sort((a, b) => a - b);
  }

  if (Object.keys(errors).length > 0) throw validationError("Validation failed.", errors);
  return { name, bundleSizes };
}

/** Parses the `groupSize` query parameter (a string from the URL). */
export function parseGroupSize(raw: unknown): number {
  const message = `groupSize must be an integer between ${MIN_GROUP_SIZE} and ${MAX_GROUP_SIZE}.`;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw validationError(message, { groupSize: message });
  }
  const value = Number(raw);
  if (value < MIN_GROUP_SIZE || value > MAX_GROUP_SIZE) {
    throw validationError(message, { groupSize: message });
  }
  return value;
}
