"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Notice {
  type: "success" | "error";
  message: string;
}

/** A single dismissible status message; success notices clear themselves. */
export function useNotice(autoHideMs = 4000) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setNotice(null);
  }, []);

  const show = useCallback(
    (type: Notice["type"], message: string) => {
      if (timer.current) clearTimeout(timer.current);
      setNotice({ type, message });
      if (type === "success") timer.current = setTimeout(() => setNotice(null), autoHideMs);
    },
    [autoHideMs],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { notice, show, clear };
}
