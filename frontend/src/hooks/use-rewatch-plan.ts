"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/services/api-client";
import { moviesService } from "@/services/movies.service";
import type { RewatchPlan } from "@/types";

/** Loads the rewatch plan for a target movie and exposes a refresh function. */
export function useRewatchPlan(targetId: string | null) {
  const [plan, setPlan] = useState<RewatchPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0); // ignore responses that arrive out of order

  const refresh = useCallback(async () => {
    if (!targetId) {
      setPlan(null);
      return;
    }
    const current = ++requestId.current;
    setLoading(true);
    try {
      const data = await moviesService.rewatchOrder(targetId);
      if (current === requestId.current) {
        setPlan(data);
        setError(null);
      }
    } catch (e) {
      if (current === requestId.current) setError(getErrorMessage(e));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    setPlan(null);
    void refresh();
  }, [refresh]);

  return { plan, loading, error, refresh };
}
