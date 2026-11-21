"use client";

import { FormEvent, useState } from "react";
import { Loader2, Ticket } from "lucide-react";
import { BookingResult } from "@/components/booking/booking-result";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { EmptyState, LoadingState } from "@/components/ui/state-views";
import { MAX_GROUP_SIZE, MIN_GROUP_SIZE } from "@/constants";
import { useCinemas } from "@/hooks/use-cinemas";
import { validateGroupSize } from "@/lib/validation";
import { cinemasService } from "@/services/cinemas.service";
import { getErrorMessage } from "@/services/api-client";
import type { BookingQuote } from "@/types";

export default function BookingPage() {
  const { cinemas, loading, error } = useCinemas();
  const [cinemaId, setCinemaId] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<BookingQuote | null>(null);

  const selected = cinemas.find((c) => c.id === cinemaId) ?? null;

  function selectCinema(id: string) {
    setCinemaId(id);
    setQuote(null); // a previous result belongs to another cinema
    setRequestError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !selected) return;

    const problem = validateGroupSize(groupSize);
    setFieldError(problem);
    if (problem) return;

    setSubmitting(true);
    setRequestError(null);
    try {
      setQuote(await cinemasService.booking(selected.id, Number(groupSize)));
    } catch (e) {
      setQuote(null);
      setRequestError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Booking" description="Find the fewest seat bundles that fit your group exactly." />

      <div className="grid gap-5">
        {error && <Alert type="error" message={error} />}

        {loading ? (
          <LoadingState label="Loading cinemas…" />
        ) : cinemas.length === 0 && !error ? (
          <EmptyState icon={<Ticket className="h-8 w-8" />} title="No cinemas available" description="Cinemas are created through the API (POST /api/cinemas) or the seed script." />
        ) : (
          <Card>
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} noValidate className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="cinema">Cinema</Label>
                  <Select id="cinema" value={cinemaId} onChange={(e) => selectCinema(e.target.value)}>
                    <option value="" disabled>
                      Select a cinema…
                    </option>
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {selected && (
                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Available bundles</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.bundleSizes.map((size) => (
                        <Badge key={size} variant="outline">
                          {size} Seats
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="groupSize">Group size</Label>
                  <Input
                    id="groupSize"
                    inputMode="numeric"
                    placeholder={`${MIN_GROUP_SIZE}–${MAX_GROUP_SIZE.toLocaleString()}`}
                    value={groupSize}
                    onChange={(e) => {
                      setGroupSize(e.target.value);
                      setFieldError(null);
                    }}
                    aria-invalid={!!fieldError}
                    disabled={!selected}
                  />
                  {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
                </div>

                <Button type="submit" disabled={!selected || submitting} className="sm:w-fit">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Get booking quote
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {requestError && <Alert type="error" message={requestError} />}
        {quote && <BookingResult quote={quote} />}
      </div>
    </>
  );
}
