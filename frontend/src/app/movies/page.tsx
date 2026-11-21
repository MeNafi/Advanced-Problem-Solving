"use client";

import { useState } from "react";
import { Clapperboard, Plus } from "lucide-react";
import { MovieCard } from "@/components/movies/movie-card";
import { MovieFormDialog } from "@/components/movies/movie-form-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, LoadingState } from "@/components/ui/state-views";
import { useMovies } from "@/hooks/use-movies";
import { useNotice } from "@/hooks/use-notice";
import { getErrorMessage } from "@/services/api-client";
import { moviesService } from "@/services/movies.service";
import type { Movie } from "@/types";

export default function MoviesPage() {
  const { movies, loading, error, refresh } = useMovies();
  const { notice, show, clear } = useNotice();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (movie: Movie) => {
    setEditing(movie);
    setDialogOpen(true);
  };

  async function toggleWatched(movie: Movie) {
    if (pendingIds.has(movie.id)) return;
    setPendingIds((s) => new Set(s).add(movie.id));
    try {
      await moviesService.update(movie.id, { watched: !movie.watched });
      await refresh();
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

  async function handleSaved(message: string) {
    show("success", message);
    await refresh();
  }

  return (
    <>
      <PageHeader
        title="Movies"
        description="Manage movies, their prerequisites and what you've already watched."
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add movie
          </Button>
        }
      />

      <div className="grid gap-3">
        {notice && <Alert type={notice.type} message={notice.message} onDismiss={clear} />}
        {error && <Alert type="error" message={error} />}

        {loading ? (
          <LoadingState label="Loading movies…" />
        ) : movies.length === 0 && !error ? (
          <EmptyState
            icon={<Clapperboard className="h-8 w-8" />}
            title="No movies yet"
            description="Add your first movie to start building a rewatch plan."
          />
        ) : (
          movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} busy={pendingIds.has(movie.id)} onEdit={openEdit} onToggleWatched={toggleWatched} />
          ))
        )}
      </div>

      <MovieFormDialog open={dialogOpen} onOpenChange={setDialogOpen} movie={editing} allMovies={movies} onSaved={handleSaved} />
    </>
  );
}
