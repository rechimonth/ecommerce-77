import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";
import { CartProvider } from "../contexts/cart";
import { useCart } from "./useCart";
import type { Product } from "../types/product.types";

const sampleProduct: Product = {
  id: "chaqueta-test", name: "Chaqueta de prueba", nameLower: "chaqueta de prueba",
  image: "https://example.test/chaqueta.jpg", description: "Producto de prueba",
  price: 100.5, stock: 4, categoryId: "clothing",
};
function wrapper({ children }: PropsWithChildren) {
  return <CartProvider>{children}</CartProvider>;
}

describe("useCart", () => {
  it("expone acciones y recalcula total/cantidad", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(sampleProduct));
    act(() => result.current.updateQuantity(sampleProduct.id, 2));
    expect(result.current.itemCount).toBe(2);
    expect(result.current.total).toBe(201);
    act(() => result.current.removeItem(sampleProduct.id));
    expect(result.current.items).toHaveLength(0);
  });
});
