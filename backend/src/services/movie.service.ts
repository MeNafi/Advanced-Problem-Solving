import { Prisma } from "@prisma/client";
import { getRewatchOrder, hasCycleFrom, PrerequisiteGraph } from "../algorithms/rewatch-order";
import { prisma } from "../config/prisma";
import type { MovieDto, RewatchOrderDto } from "../types";
import { AppError, circularDependencyError, validationError } from "../utils/errors";
import type { CreateMovieInput, UpdateMovieInput } from "../validators/movie.validator";

const movieInclude = {
  prerequisites: { include: { prerequisite: { select: { id: true, title: true, releaseYear: true } } } },
} satisfies Prisma.MovieInclude;

type MovieWithPrerequisites = Prisma.MovieGetPayload<{ include: typeof movieInclude }>;

const byYearThenTitle = (a: { releaseYear: number; title: string }, b: { releaseYear: number; title: string }) =>
  a.releaseYear - b.releaseYear || a.title.localeCompare(b.title);

function toDto(movie: MovieWithPrerequisites): MovieDto {
  return {
    id: movie.id,
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtime: movie.runtime,
    watched: movie.watched,
    createdAt: movie.createdAt,
    updatedAt: movie.updatedAt,
    prerequisites: movie.prerequisites
      .map((link) => link.prerequisite)
      .sort(byYearThenTitle)
      .map(({ id, title }) => ({ id, title })),
  };
}

async function assertMoviesExist(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const found = await prisma.movie.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const foundIds = new Set(found.map((m) => m.id));
  const missing = ids.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw validationError("Some prerequisite movies do not exist.", {
      prerequisites: `Unknown movie ID(s): ${missing.join(", ")}`,
    });
  }
}

/** Loads the whole prerequisite graph; prerequisites are ordered by release year for stable, chronological output. */
async function loadGraph(): Promise<{ graph: PrerequisiteGraph; years: Map<string, { releaseYear: number; title: string }> }> {
  const [movies, links] = await Promise.all([
    prisma.movie.findMany({ select: { id: true, title: true, releaseYear: true } }),
    prisma.moviePrerequisite.findMany({ select: { movieId: true, prerequisiteId: true } }),
  ]);
  const info = new Map(movies.map((m) => [m.id, { releaseYear: m.releaseYear, title: m.title }]));
  const graph: PrerequisiteGraph = new Map(movies.map((m) => [m.id, [] as string[]]));
  for (const link of links) graph.get(link.movieId)?.push(link.prerequisiteId);
  for (const [id, prereqs] of graph) {
    graph.set(id, prereqs.sort((a, b) => byYearThenTitle(info.get(a)!, info.get(b)!)));
  }
  return { graph, years: info };
}

export async function listMovies(): Promise<MovieDto[]> {
  const movies = await prisma.movie.findMany({
    include: movieInclude,
    orderBy: [{ releaseYear: "asc" }, { title: "asc" }],
  });
  return movies.map(toDto);
}

export async function createMovie(input: CreateMovieInput): Promise<MovieDto> {
  await assertMoviesExist(input.prerequisiteIds);
  // A brand-new movie has no dependents, so it cannot be part of a cycle.
  const movie = await prisma.movie.create({
    data: {
      title: input.title,
      releaseYear: input.releaseYear,
      runtime: input.runtime,
      watched: input.watched,
      prerequisites: { create: input.prerequisiteIds.map((prerequisiteId) => ({ prerequisiteId })) },
    },
    include: movieInclude,
  });
  return toDto(movie);
}

export async function updateMovie(id: string, input: UpdateMovieInput): Promise<MovieDto> {
  const existing = await prisma.movie.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, "NOT_FOUND", "Movie not found.");

  const { prerequisiteIds, ...fields } = input;

  if (prerequisiteIds !== undefined) {
    if (prerequisiteIds.includes(id)) throw circularDependencyError(); // direct self-dependency
    await assertMoviesExist(prerequisiteIds);

    // Test the proposed graph before touching the database.
    const { graph } = await loadGraph();
    graph.set(id, prerequisiteIds);
    if (hasCycleFrom(graph, id)) throw circularDependencyError();
  }

  const movie = await prisma.$transaction(async (tx) => {
    if (prerequisiteIds !== undefined) {
      await tx.moviePrerequisite.deleteMany({ where: { movieId: id } });
      if (prerequisiteIds.length > 0) {
        await tx.moviePrerequisite.createMany({
          data: prerequisiteIds.map((prerequisiteId) => ({ movieId: id, prerequisiteId })),
        });
      }
    }
    return tx.movie.update({ where: { id }, data: fields, include: movieInclude });
  });
  return toDto(movie);
}

export async function getMovieRewatchOrder(id: string): Promise<RewatchOrderDto> {
  const movies = await prisma.movie.findMany({
    select: { id: true, title: true, releaseYear: true, runtime: true, watched: true },
  });
  const byId = new Map(movies.map((m) => [m.id, m]));
  const target = byId.get(id);
  if (!target) throw new AppError(404, "NOT_FOUND", "Movie not found.");

  const { graph } = await loadGraph();
  const orderedIds = getRewatchOrder(graph, id);
  const rewatchOrder = orderedIds.map((movieId) => byId.get(movieId)!);

  const unwatched = rewatchOrder.filter((m) => !m.watched);
  return {
    targetMovie: target,
    rewatchOrder,
    summary: {
      totalMovies: rewatchOrder.length,
      watchedMovies: rewatchOrder.length - unwatched.length,
      unwatchedMovies: unwatched.length,
      remainingRuntime: unwatched.reduce((sum, m) => sum + m.runtime, 0),
    },
  };
}
