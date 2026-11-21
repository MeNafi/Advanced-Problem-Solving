"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/services/api-client";
import { moviesService } from "@/services/movies.service";
import type { Movie } from "@/types";

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setMovies(await moviesService.list());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { movies, loading, error, refresh };
}
