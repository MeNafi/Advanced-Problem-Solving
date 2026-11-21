import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { BookingInputError } from "../algorithms/booking-optimizer";
import { CircularDependencyError } from "../algorithms/rewatch-order";
import { AppError, circularDependencyError } from "../utils/errors";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: `Route ${req.method} ${req.originalUrl} not found.` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }

  if (err instanceof CircularDependencyError) {
    const mapped = circularDependencyError();
    res.status(mapped.status).json({ code: mapped.code, message: mapped.message });
    return;
  }

  if (err instanceof BookingInputError) {
    res.status(400).json({ code: "VALIDATION_ERROR", message: err.message });
    return;
  }

  // Unique constraint violations (duplicate movie title / cinema name)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = String((err.meta as { target?: unknown } | undefined)?.target ?? "");
    if (target.includes("title")) {
      res.status(409).json({ code: "DUPLICATE_TITLE", message: "A movie with this title already exists." });
      return;
    }
    if (target.includes("name")) {
      res.status(409).json({ code: "DUPLICATE_NAME", message: "A cinema with this name already exists." });
      return;
    }
    res.status(409).json({ code: "CONFLICT", message: "A record with these values already exists." });
    return;
  }

  // Malformed JSON body (thrown by express.json())
  if (err && typeof err === "object" && (err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ code: "INVALID_JSON", message: "Request body is not valid JSON." });
    return;
  }

  console.error(err);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Something went wrong on the server." });
};
