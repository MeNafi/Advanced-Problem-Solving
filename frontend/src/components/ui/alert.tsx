import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps {
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ type, message, onDismiss, className }: AlertProps) {
  const isError = type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3 text-sm",
        isError ? "border-destructive/40 bg-destructive/10 text-red-300" : "border-success/40 bg-success/10 text-emerald-300",
        className,
      )}
    >
      {isError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
