import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    // Cleanup: si el usuario sigue tipeando, se cancela el timer anterior.
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
