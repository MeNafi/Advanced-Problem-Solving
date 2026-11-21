/** Error that maps directly onto an HTTP response. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string>;

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const validationError = (message: string, details?: Record<string, string>): AppError =>
  new AppError(400, "VALIDATION_ERROR", message, details);

export const circularDependencyError = (): AppError =>
  new AppError(409, "CIRCULAR_DEPENDENCY", "Circular movie dependency detected.");
