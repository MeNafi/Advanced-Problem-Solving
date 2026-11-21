import { Router } from "express";
import * as cinemaController from "../controllers/cinema.controller";
import * as movieController from "../controllers/movie.controller";

export const apiRouter = Router();

apiRouter.post("/movies", movieController.createMovie);
apiRouter.get("/movies", movieController.listMovies);
apiRouter.patch("/movies/:id", movieController.updateMovie);
apiRouter.get("/movies/:id/rewatch-order", movieController.getRewatchOrder);

apiRouter.post("/cinemas", cinemaController.createCinema);
apiRouter.get("/cinemas", cinemaController.listCinemas);
apiRouter.get("/cinemas/:id/booking", cinemaController.getBookingQuote);
