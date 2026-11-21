import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Forwards rejected promises from async controllers to the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
