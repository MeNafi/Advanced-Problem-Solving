"use client";

import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { RewatchSummary } from "@/components/rewatch/rewatch-summary";
import { RewatchTimeline } from "@/components/rewatch/rewatch-timeline";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { EmptyState, LoadingState } from "@/components/ui/state-views";
import { DEFAULT_TARGET_TITLE } from "@/constants";
import { useMovies } from "@/hooks/use-movies";
import { useNotice } from "@/hooks/use-notice";
import { useRewatchPlan } from "@/hooks/use-rewatch-plan";
import { getErrorMessage } from "@/services/api-client";
import { moviesService } from "@/services/movies.service";
import type { RewatchMovie } from "@/types";

export default function RewatchPlanPage() {
  const { movies, loading: moviesLoading, error: moviesError } = useMovies();
  const [targetId, setTargetId] = useState<string | null>(null);
  const { plan, loading: planLoading, error: planError, refresh } = useRewatchPlan(targetId);
  const { notice, show, clear } = useNotice();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Pick a sensible default target once movies have loaded
  useEffect(() => {
    if (targetId || movies.length === 0) return;
    const preferred = movies.find((m) => m.title === DEFAULT_TARGET_TITLE) ?? movies[movies.length - 1];
    setTargetId(preferred.id);
  }, [movies, targetId]);

  async function toggleWatched(movie: RewatchMovie) {
    if (pendingIds.has(movie.id)) return;
    setPendingIds((s) => new Set(s).add(movie.id));
    try {
      await moviesService.update(movie.id, { watched: !movie.watched });
      await refresh(); // re-fetch plan => progress, counts and remaining time update
    } catch (e) {
      show("error", getErrorMessage(e));
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(movie.id);
        return next;
      });
    }
  }

  return (
    <>
      <PageHeader title="Rewatch Plan" description="Pick a target movie and see exactly what to watch first, in order." />

      <div className="grid gap-5">
        {moviesError && <Alert type="error" message={moviesError} />}
        {notice && <Alert type={notice.type} message={notice.message} onDismiss={clear} />}

        {moviesLoading ? (
          <LoadingState label="Loading movies…" />
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="target">Target movie</Label>
            <Select id="target" value={targetId ?? ""} onChange={(e) => setTargetId(e.target.value || null)} disabled={movies.length === 0}>
              <option value="" disabled>
                Select a movie…
              </option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.releaseYear})
                </option>
              ))}
            </Select>
          </div>
        )}

        {planError && <Alert type="error" message={planError} />}
        {planLoading && !plan && <LoadingState label="Building rewatch plan…" />}

        {plan && (
          <>
            {plan.rewatchOrder.length === 0 ? (
              <EmptyState
                icon={<PartyPopper className="h-8 w-8" />}
                title="Nothing to rewatch"
                description={`${plan.targetMovie.title} has no prerequisites. You can watch it right away.`}
              />
            ) : (
              <>
                <RewatchSummary plan={plan} />
                <div>
                  <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                    Watch in this order before {plan.targetMovie.title}
                  </h2>
                  <RewatchTimeline movies={plan.rewatchOrder} pendingIds={pendingIds} onToggleWatched={toggleWatched} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
