"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_RUNTIME, MIN_RUNTIME } from "@/constants";
import { FormErrors, MovieFormValues, validateMovieForm } from "@/lib/validation";
import { getErrorMessage } from "@/services/api-client";
import { moviesService } from "@/services/movies.service";
import type { Movie } from "@/types";

interface MovieFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Movie being edited, or null when adding a new one */
  movie: Movie | null;
  allMovies: Movie[];
  onSaved: (message: string) => void;
}

const emptyValues: MovieFormValues = { title: "", releaseYear: "", runtime: "", watched: false, prerequisites: [] };

function toValues(movie: Movie | null): MovieFormValues {
  if (!movie) return emptyValues;
  return {
    title: movie.title,
    releaseYear: String(movie.releaseYear),
    runtime: String(movie.runtime),
    watched: movie.watched,
    prerequisites: movie.prerequisites.map((p) => p.id),
  };
}

export function MovieFormDialog({ open, onOpenChange, movie, allMovies, onSaved }: MovieFormDialogProps) {
  const [values, setValues] = useState<MovieFormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset the form every time the dialog opens
  useEffect(() => {
    if (open) {
      setValues(toValues(movie));
      setErrors({});
      setServerError(null);
      setSubmitting(false);
    }
  }, [open, movie]);

  // A movie can never be its own prerequisite
  const candidates = allMovies.filter((m) => m.id !== movie?.id);

  const togglePrerequisite = (id: string) =>
    setValues((v) => ({
      ...v,
      prerequisites: v.prerequisites.includes(id) ? v.prerequisites.filter((p) => p !== id) : [...v.prerequisites, id],
    }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return; // prevent duplicate submissions

    const found = validateMovieForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = {
      title: values.title.trim(),
      releaseYear: Number(values.releaseYear),
      runtime: Number(values.runtime),
      watched: values.watched,
      prerequisites: values.prerequisites,
    };

    setSubmitting(true);
    setServerError(null);
    try {
      if (movie) await moviesService.update(movie.id, payload);
      else await moviesService.create(payload);
      onOpenChange(false);
      onSaved(movie ? `“${payload.title}” was updated.` : `“${payload.title}” was added.`);
    } catch (e) {
      setServerError(getErrorMessage(e));
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{movie ? "Edit movie" : "Add movie"}</DialogTitle>
          <DialogDescription>Runtime is in minutes. Prerequisites are movies to watch first.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          {serverError && <Alert type="error" message={serverError} />}

          <div className="grid gap-2">
            <Label htmlFor="title">Movie title</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              aria-invalid={!!errors.title}
              placeholder="e.g. Iron Man"
            />
            {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="releaseYear">Release year</Label>
              <Input
                id="releaseYear"
                inputMode="numeric"
                value={values.releaseYear}
                onChange={(e) => setValues({ ...values, releaseYear: e.target.value })}
                aria-invalid={!!errors.releaseYear}
                placeholder="2008"
              />
              {errors.releaseYear && <p className="text-xs text-red-400">{errors.releaseYear}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="runtime">Runtime (minutes)</Label>
              <Input
                id="runtime"
                inputMode="numeric"
                value={values.runtime}
                onChange={(e) => setValues({ ...values, runtime: e.target.value })}
                aria-invalid={!!errors.runtime}
                placeholder={`${MIN_RUNTIME}–${MAX_RUNTIME}`}
              />
              {errors.runtime && <p className="text-xs text-red-400">{errors.runtime}</p>}
            </div>
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Prerequisites</legend>
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other movies available yet.</p>
            ) : (
              <div className="max-h-48 divide-y overflow-y-auto rounded-md border">
                {candidates.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-accent/50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-red-600"
                      checked={values.prerequisites.includes(m.id)}
                      onChange={() => togglePrerequisite(m.id)}
                    />
                    <span className="flex-1">{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.releaseYear}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-red-600"
              checked={values.watched}
              onChange={(e) => setValues({ ...values, watched: e.target.checked })}
            />
            Mark as watched
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {movie ? "Save changes" : "Add movie"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
