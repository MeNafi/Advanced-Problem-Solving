import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "@/types";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

/** Consistent, human-readable error text for any failed request. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ApiErrorBody>;
    if (err.response) {
      const body = err.response.data;
      const details = body?.details ? Object.values(body.details).join(" ") : "";
      return details || body?.message || `Request failed (${err.response.status}).`;
    }
    return "Cannot reach the server. Check that the backend is running.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function getErrorCode(error: unknown): string | undefined {
  return axios.isAxiosError(error) ? (error.response?.data as ApiErrorBody | undefined)?.code : undefined;
}
