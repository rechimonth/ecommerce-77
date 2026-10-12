import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCart } from "./useCart";

afterEach(() => vi.restoreAllMocks());

describe("useCart boundary", () => {
  it("falla con un mensaje claro cuando no existe CartProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useCart())).toThrow("useCart debe usarse dentro de CartProvider");
  });
});
