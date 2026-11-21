import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { BookingQuote } from "@/types";

export function BookingResult({ quote }: { quote: BookingQuote }) {
  if (!quote.possible) {
    return (
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-5">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-warning">Not Possible</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {quote.cinema.name} cannot seat exactly {quote.groupSize.toLocaleString()} people with bundles of{" "}
              {quote.cinema.bundleSizes.join(", ")} seats. Try a different group size or cinema.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-success/40 bg-success/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-semibold">Booking possible</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {quote.cinema.name} · Group of {quote.groupSize.toLocaleString()}
        </p>

        <p className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">Total Bundles</p>
        <p className="text-3xl font-semibold">{quote.totalBundles}</p>

        <ul className="mt-4 divide-y rounded-md border bg-background/40">
          {quote.bundles.map((b) => (
            <li key={b.size} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span>{b.size} Seats</span>
              <span className="font-medium">× {b.quantity}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm">
          Total Seats: <span className="font-semibold">{quote.totalSeats.toLocaleString()}</span>
        </p>
      </CardContent>
    </Card>
  );
}
