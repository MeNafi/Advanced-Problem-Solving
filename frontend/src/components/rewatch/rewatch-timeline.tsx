import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RewatchMovie } from "@/types";

interface RewatchTimelineProps {
  movies: RewatchMovie[];
  pendingIds: Set<string>;
  onToggleWatched: (movie: RewatchMovie) => void;
}

export function RewatchTimeline({ movies, pendingIds, onToggleWatched }: RewatchTimelineProps) {
  return (
    <ol className="relative grid gap-3">
      {movies.map((movie, index) => {
        const pending = pendingIds.has(movie.id);
        return (
          <li key={movie.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{movie.title}</p>
              <p className="text-xs text-muted-foreground">
                {movie.releaseYear} · {movie.runtime} min
              </p>
            </div>
            <Badge variant={movie.watched ? "success" : "muted"} className="hidden sm:inline-flex">
              {movie.watched ? "Watched" : "Unwatched"}
            </Badge>
            <button
              type="button"
              role="checkbox"
              aria-checked={movie.watched}
              aria-label={`Mark ${movie.title} as ${movie.watched ? "unwatched" : "watched"}`}
              disabled={pending}
              onClick={() => onToggleWatched(movie)}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-60",
                movie.watched ? "border-success bg-success text-background" : "border-input hover:border-primary",
              )}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : movie.watched && <Check className="h-4 w-4" />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
