import { useEffect, useState } from "react";

// Retrasa la actualización de un valor para no lanzar una consulta por cada tecla.
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    // Si el valor cambia antes de tiempo, se cancela el temporizador anterior.
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
