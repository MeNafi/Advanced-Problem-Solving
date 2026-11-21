import {
  MAX_GROUP_SIZE,
  MAX_RELEASE_YEAR,
  MAX_RUNTIME,
  MIN_GROUP_SIZE,
  MIN_RELEASE_YEAR,
  MIN_RUNTIME,
} from "@/constants";

export interface MovieFormValues {
  title: string;
  releaseYear: string;
  runtime: string;
  watched: boolean;
  prerequisites: string[];
}

export type FormErrors = Partial<Record<"title" | "releaseYear" | "runtime", string>>;

const isInt = (value: string) => /^-?\d+$/.test(value.trim());

export function validateMovieForm(values: MovieFormValues): FormErrors {
  const errors: FormErrors = {};
  const title = values.title.trim();

  if (!title) errors.title = "Title is required.";
  else if (title.length > 200) errors.title = "Title must be at most 200 characters.";

  const year = Number(values.releaseYear);
  if (!isInt(values.releaseYear) || year < MIN_RELEASE_YEAR || year > MAX_RELEASE_YEAR) {
    errors.releaseYear = `Enter a whole year between ${MIN_RELEASE_YEAR} and ${MAX_RELEASE_YEAR}.`;
  }

  const runtime = Number(values.runtime);
  if (!isInt(values.runtime) || runtime < MIN_RUNTIME || runtime > MAX_RUNTIME) {
    errors.runtime = `Runtime must be a whole number between ${MIN_RUNTIME} and ${MAX_RUNTIME} minutes.`;
  }
  return errors;
}

/** Returns an error message, or null when the group size is valid. */
export function validateGroupSize(raw: string): string | null {
  if (!isInt(raw)) return "Enter a whole number of people.";
  const value = Number(raw);
  if (value < MIN_GROUP_SIZE || value > MAX_GROUP_SIZE) {
    return `Group size must be between ${MIN_GROUP_SIZE} and ${MAX_GROUP_SIZE.toLocaleString()}.`;
  }
  return null;
}
