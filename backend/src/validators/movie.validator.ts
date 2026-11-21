import { validationError } from "../utils/errors";

export const MIN_RUNTIME = 1;
export const MAX_RUNTIME = 300;
export const MIN_RELEASE_YEAR = 1888; // first motion picture
export const MAX_RELEASE_YEAR = 2100;
export const MAX_TITLE_LENGTH = 200;

export interface CreateMovieInput {
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  prerequisiteIds: string[];
}

export type UpdateMovieInput = Partial<CreateMovieInput>;

type FieldErrors = Record<string, string>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isIntegerInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

function parseTitle(value: unknown, errors: FieldErrors): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.title = "Title is required.";
    return undefined;
  }
  const title = value.trim();
  if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title must be at most ${MAX_TITLE_LENGTH} characters.`;
    return undefined;
  }
  return title;
}

function parseReleaseYear(value: unknown, errors: FieldErrors): number | undefined {
  if (!isIntegerInRange(value, MIN_RELEASE_YEAR, MAX_RELEASE_YEAR)) {
    errors.releaseYear = `Release year must be an integer between ${MIN_RELEASE_YEAR} and ${MAX_RELEASE_YEAR}.`;
    return undefined;
  }
  return value;
}

function parseRuntime(value: unknown, errors: FieldErrors): number | undefined {
  if (!isIntegerInRange(value, MIN_RUNTIME, MAX_RUNTIME)) {
    errors.runtime = `Runtime must be an integer between ${MIN_RUNTIME} and ${MAX_RUNTIME} minutes.`;
    return undefined;
  }
  return value;
}

function parseWatched(value: unknown, errors: FieldErrors): boolean | undefined {
  if (typeof value !== "boolean") {
    errors.watched = "Watched must be true or false.";
    return undefined;
  }
  return value;
}

function parsePrerequisites(value: unknown, errors: FieldErrors): string[] | undefined {
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string" && id.length > 0)) {
    errors.prerequisites = "Prerequisites must be an array of movie IDs.";
    return undefined;
  }
  return [...new Set(value as string[])];
}

function assertBody(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) throw validationError("Request body must be a JSON object.");
  return body;
}

function finish(errors: FieldErrors): void {
  if (Object.keys(errors).length > 0) throw validationError("Validation failed.", errors);
}

export function validateCreateMovie(body: unknown): CreateMovieInput {
  const data = assertBody(body);
  const errors: FieldErrors = {};

  const title = parseTitle(data.title, errors);
  const releaseYear = parseReleaseYear(data.releaseYear, errors);
  const runtime = parseRuntime(data.runtime, errors);
  const watched = data.watched === undefined ? false : parseWatched(data.watched, errors);
  const prerequisiteIds = data.prerequisites === undefined ? [] : parsePrerequisites(data.prerequisites, errors);

  finish(errors);
  return {
    title: title as string,
    releaseYear: releaseYear as number,
    runtime: runtime as number,
    watched: watched as boolean,
    prerequisiteIds: prerequisiteIds as string[],
  };
}

export function validateUpdateMovie(body: unknown): UpdateMovieInput {
  const data = assertBody(body);
  const errors: FieldErrors = {};
  const input: UpdateMovieInput = {};

  if (data.title !== undefined) input.title = parseTitle(data.title, errors);
  if (data.releaseYear !== undefined) input.releaseYear = parseReleaseYear(data.releaseYear, errors);
  if (data.runtime !== undefined) input.runtime = parseRuntime(data.runtime, errors);
  if (data.watched !== undefined) input.watched = parseWatched(data.watched, errors);
  if (data.prerequisites !== undefined) input.prerequisiteIds = parsePrerequisites(data.prerequisites, errors);

  finish(errors);
  if (Object.keys(input).length === 0) {
    throw validationError(
      "Provide at least one of: title, releaseYear, runtime, watched, prerequisites.",
    );
  }
  return input;
}
