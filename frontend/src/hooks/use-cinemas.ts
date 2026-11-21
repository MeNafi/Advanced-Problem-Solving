"use client";

import { useCallback, useEffect, useState } from "react";
import { cinemasService } from "@/services/cinemas.service";
import { getErrorMessage } from "@/services/api-client";
import type { Cinema } from "@/types";

export function useCinemas() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setCinemas(await cinemasService.list());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { cinemas, loading, error, refresh };
}
