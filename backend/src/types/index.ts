export interface MovieRef {
  id: string;
  title: string;
}

export interface MovieDto {
  id: string;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  createdAt: Date;
  updatedAt: Date;
  prerequisites: MovieRef[];
}

export interface RewatchOrderDto {
  targetMovie: { id: string; title: string; releaseYear: number; runtime: number; watched: boolean };
  rewatchOrder: { id: string; title: string; releaseYear: number; runtime: number; watched: boolean }[];
  summary: {
    totalMovies: number;
    watchedMovies: number;
    unwatchedMovies: number;
    remainingRuntime: number;
  };
}
