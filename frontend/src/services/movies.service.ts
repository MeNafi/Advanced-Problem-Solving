import { apiClient } from "./api-client";
import type { CreateMoviePayload, Movie, RewatchPlan, UpdateMoviePayload } from "@/types";

export const moviesService = {
  list: async (): Promise<Movie[]> => (await apiClient.get<Movie[]>("/movies")).data,
  create: async (payload: CreateMoviePayload): Promise<Movie> => (await apiClient.post<Movie>("/movies", payload)).data,
  update: async (id: string, payload: UpdateMoviePayload): Promise<Movie> =>
    (await apiClient.patch<Movie>(`/movies/${id}`, payload)).data,
  rewatchOrder: async (id: string): Promise<RewatchPlan> =>
    (await apiClient.get<RewatchPlan>(`/movies/${id}/rewatch-order`)).data,
};
