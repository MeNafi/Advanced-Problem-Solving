import { asyncHandler } from "../middleware/async-handler";
import * as cinemaService from "../services/cinema.service";
import { parseGroupSize, validateCreateCinema } from "../validators/cinema.validator";

export const createCinema = asyncHandler(async (req, res) => {
  const cinema = await cinemaService.createCinema(validateCreateCinema(req.body));
  res.status(201).json(cinema);
});

export const listCinemas = asyncHandler(async (_req, res) => {
  res.json(await cinemaService.listCinemas());
});

export const getBookingQuote = asyncHandler(async (req, res) => {
  const groupSize = parseGroupSize(req.query.groupSize);
  res.json(await cinemaService.getBookingQuote(req.params.id, groupSize));
});
