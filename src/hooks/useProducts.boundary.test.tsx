import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProducts } from "../contexts/products/useProducts";

afterEach(() => vi.restoreAllMocks());

describe("useProducts boundary", () => {
  it("falla con un mensaje claro cuando falta ProductsProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useProducts())).toThrow("useProducts debe usarse dentro de <ProductsProvider>");
  });
});
