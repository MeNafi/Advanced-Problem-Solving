import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/utils";
import type { RewatchPlan } from "@/types";

export function RewatchSummary({ plan }: { plan: RewatchPlan }) {
  const { totalMovies, watchedMovies, unwatchedMovies, remainingRuntime } = plan.summary;
  const percent = totalMovies === 0 ? 0 : Math.round((watchedMovies / totalMovies) * 100);

  return (
    <Card>
      <CardHeader>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Rewatch progress</p>
        <CardTitle className="text-xl">{plan.targetMovie.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-lg font-semibold">
              {watchedMovies} / {totalMovies} <span className="text-sm font-normal text-muted-foreground">Movies Watched</span>
            </p>
            <p className="text-sm font-medium text-primary">{percent}%</p>
          </div>
          <Progress value={percent} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Remaining Movies</p>
            <p className="mt-1 text-2xl font-semibold">{unwatchedMovies}</p>
          </div>
          <div className="rounded-md bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Remaining Watch Time</p>
            <p className="mt-1 text-2xl font-semibold">{remainingRuntime} <span className="text-sm font-normal">Minutes</span></p>
            <p className="text-xs text-muted-foreground">{formatDuration(remainingRuntime)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
