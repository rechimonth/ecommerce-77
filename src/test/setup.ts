import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cada test deja el DOM limpio para evitar que una prueba contamine la siguiente.
afterEach(() => {
  cleanup();
  // Algunos tests reemplazan localStorage con un mock que no implementa clear().
  // La limpieza debe ser tolerante para que el mock nunca cause falsos fallos del suite.
  try {
    window.localStorage.clear();
  } catch {
    // La persistencia se prueba con un almacenamiento simulado independiente.
  }
});
