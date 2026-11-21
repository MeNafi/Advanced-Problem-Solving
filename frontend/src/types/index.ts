export interface MovieRef {
  id: string;
  title: string;
}

export interface Movie {
  id: string;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  createdAt: string;
  updatedAt: string;
  prerequisites: MovieRef[];
}

export interface CreateMoviePayload {
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  prerequisites: string[];
}

export type UpdateMoviePayload = Partial<CreateMoviePayload>;

export interface RewatchMovie {
  id: string;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
}

export interface RewatchPlan {
  targetMovie: RewatchMovie;
  rewatchOrder: RewatchMovie[];
  summary: {
    totalMovies: number;
    watchedMovies: number;
    unwatchedMovies: number;
    remainingRuntime: number;
  };
}

export interface Cinema {
  id: string;
  name: string;
  bundleSizes: number[];
  createdAt: string;
  updatedAt: string;
}

export interface BundleQuantity {
  size: number;
  quantity: number;
}

export interface BookingQuote {
  cinema: { id: string; name: string; bundleSizes: number[] };
  possible: boolean;
  groupSize: number;
  totalBundles: number;
  bundles: BundleQuantity[];
  totalSeats: number;
}

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: Record<string, string>;
}
