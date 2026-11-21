import { asyncHandler } from "../middleware/async-handler";
import * as movieService from "../services/movie.service";
import { validateCreateMovie, validateUpdateMovie } from "../validators/movie.validator";

export const createMovie = asyncHandler(async (req, res) => {
  const movie = await movieService.createMovie(validateCreateMovie(req.body));
  res.status(201).json(movie);
});

export const listMovies = asyncHandler(async (_req, res) => {
  res.json(await movieService.listMovies());
});

export const updateMovie = asyncHandler(async (req, res) => {
  const movie = await movieService.updateMovie(req.params.id, validateUpdateMovie(req.body));
  res.json(movie);
});

export const getRewatchOrder = asyncHandler(async (req, res) => {
  res.json(await movieService.getMovieRewatchOrder(req.params.id));
});
