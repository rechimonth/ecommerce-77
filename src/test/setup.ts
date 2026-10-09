import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cada test deja el DOM limpio para que una prueba no contamine la siguiente.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
