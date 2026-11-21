import { describe, expect, it } from "vitest";
import { parseGroupSize, validateCreateCinema } from "../src/validators/cinema.validator";
import { validateCreateMovie, validateUpdateMovie } from "../src/validators/movie.validator";
import { AppError } from "../src/utils/errors";

const validMovie = { title: "  Iron Man ", releaseYear: 2008, runtime: 126 };

function fieldErrors(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return error.details ?? {};
    throw error;
  }
  throw new Error("expected validation to fail");
}

describe("validateCreateMovie", () => {
  it("accepts valid input, trims the title and applies defaults", () => {
    expect(validateCreateMovie(validMovie)).toEqual({
      title: "Iron Man",
      releaseYear: 2008,
      runtime: 126,
      watched: false,
      prerequisiteIds: [],
    });
  });

  it("de-duplicates prerequisite ids", () => {
    expect(validateCreateMovie({ ...validMovie, prerequisites: ["a", "a", "b"] }).prerequisiteIds).toEqual(["a", "b"]);
  });

  it("reports every invalid field", () => {
    const errors = fieldErrors(() => validateCreateMovie({ title: "", releaseYear: 20.5, runtime: 0, watched: "yes" }));
    expect(Object.keys(errors).sort()).toEqual(["releaseYear", "runtime", "title", "watched"]);
  });

  it.each([0, 301, 1.5, "100", null])("rejects runtime %j", (runtime) => {
    expect(fieldErrors(() => validateCreateMovie({ ...validMovie, runtime })).runtime).toBeTruthy();
  });

  it("accepts the runtime limits", () => {
    expect(validateCreateMovie({ ...validMovie, runtime: 1 }).runtime).toBe(1);
    expect(validateCreateMovie({ ...validMovie, runtime: 300 }).runtime).toBe(300);
  });

  it("rejects a non-array prerequisites value", () => {
    expect(fieldErrors(() => validateCreateMovie({ ...validMovie, prerequisites: "abc" })).prerequisites).toBeTruthy();
  });

  it("rejects a non-object body", () => {
    expect(() => validateCreateMovie(null)).toThrow(AppError);
  });
});

describe("validateUpdateMovie", () => {
  it("accepts a partial update", () => {
    expect(validateUpdateMovie({ watched: true })).toEqual({ watched: true });
  });

  it("accepts an empty prerequisites list", () => {
    expect(validateUpdateMovie({ prerequisites: [] })).toEqual({ prerequisiteIds: [] });
  });

  it("rejects an empty update", () => {
    expect(() => validateUpdateMovie({})).toThrow(AppError);
  });

  it("validates provided fields", () => {
    expect(fieldErrors(() => validateUpdateMovie({ runtime: 999 })).runtime).toBeTruthy();
  });
});

describe("validateCreateCinema", () => {
  it("accepts valid input and sorts sizes", () => {
    expect(validateCreateCinema({ name: " Hall A ", bundleSizes: [5, 2] })).toEqual({ name: "Hall A", bundleSizes: [2, 5] });
  });

  it("rejects duplicates, out-of-range, empty and too many sizes", () => {
    expect(fieldErrors(() => validateCreateCinema({ name: "x", bundleSizes: [2, 2] })).bundleSizes).toContain("duplicates");
    expect(fieldErrors(() => validateCreateCinema({ name: "x", bundleSizes: [0] })).bundleSizes).toBeTruthy();
    expect(fieldErrors(() => validateCreateCinema({ name: "x", bundleSizes: [501] })).bundleSizes).toBeTruthy();
    expect(fieldErrors(() => validateCreateCinema({ name: "x", bundleSizes: [] })).bundleSizes).toBeTruthy();
    const eleven = Array.from({ length: 11 }, (_, i) => i + 1);
    expect(fieldErrors(() => validateCreateCinema({ name: "x", bundleSizes: eleven })).bundleSizes).toBeTruthy();
  });

  it("accepts exactly 10 sizes", () => {
    const ten = Array.from({ length: 10 }, (_, i) => i + 1);
    expect(validateCreateCinema({ name: "x", bundleSizes: ten }).bundleSizes).toHaveLength(10);
  });

  it("requires a name", () => {
    expect(fieldErrors(() => validateCreateCinema({ name: "  ", bundleSizes: [2] })).name).toBeTruthy();
  });
});

describe("parseGroupSize", () => {
  it("parses valid values", () => {
    expect(parseGroupSize("6")).toBe(6);
    expect(parseGroupSize("10000")).toBe(10_000);
  });

  it.each(["0", "10001", "-1", "abc", "2.5", "", undefined])("rejects %j", (raw) => {
    expect(() => parseGroupSize(raw)).toThrow(AppError);
  });
});
