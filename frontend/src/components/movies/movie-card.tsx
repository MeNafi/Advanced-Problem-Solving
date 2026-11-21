import { CalendarDays, Check, Clock, Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatDuration } from "@/lib/utils";
import type { Movie } from "@/types";

interface MovieCardProps {
  movie: Movie;
  busy: boolean;
  onEdit: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => void;
}

export function MovieCard({ movie, busy, onEdit, onToggleWatched }: MovieCardProps) {
  return (
    <Card className="p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={movie.watched}
          aria-label={`Mark ${movie.title} as ${movie.watched ? "unwatched" : "watched"}`}
          onClick={() => onToggleWatched(movie)}
          disabled={busy}
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-60",
            movie.watched ? "border-success bg-success text-background" : "border-input hover:border-primary",
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : movie.watched && <Check className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{movie.title}</h3>
            <Badge variant={movie.watched ? "success" : "muted"}>{movie.watched ? "Watched" : "Unwatched"}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{movie.releaseYear}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{movie.runtime} min ({formatDuration(movie.runtime)})</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Watch first:</span>
            {movie.prerequisites.length === 0 ? (
              <span className="text-muted-foreground/70">No prerequisites</span>
            ) : (
              movie.prerequisites.map((p) => (
                <Badge key={p.id} variant="outline">{p.title}</Badge>
              ))
            )}
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={() => onEdit(movie)} aria-label={`Edit ${movie.title}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
