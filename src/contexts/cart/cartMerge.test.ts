import { describe, expect, it } from "vitest";
import type { CartItem, CartState } from "../../types/cart.types";
import type { Product } from "../../types/product.types";
import { mergeCartStates } from "./cartMerge";

const product: Product = {
  id: "p1",
  name: "Campera",
  nameLower: "campera",
  image: "",
  description: "",
  price: 50,
  stock: 10,
  categoryId: "clothing",
};
const item = (quantity: number, id = "p1"): CartItem => ({
  product: { ...product, id },
  quantity,
  addedAt: new Date("2026-01-01T00:00:00.000Z"),
});

describe("mergeCartStates", () => {
  it("conserva el carrito local cuando la cuenta no tiene todavía carrito remoto", () => {
    const local: CartState = { items: [item(2)], total: 100 };
    expect(mergeCartStates(local, null)).toEqual(local);
  });

  it("combina productos distintos sin duplicar un carrito repetido", () => {
    const local: CartState = { items: [item(2), item(1, "p2")], total: 150 };
    const cloud: CartState = { items: [item(2)], total: 100 };
    const merged = mergeCartStates(local, cloud);
    expect(merged.items).toHaveLength(2);
    expect(merged.items.find((value) => value.product.id === "p1")?.quantity).toBe(2);
    expect(merged.items.find((value) => value.product.id === "p2")?.quantity).toBe(1);
    expect(merged.total).toBe(150);
  });

  it("conserva la cantidad mayor del mismo producto entre local y nube", () => {
    const merged = mergeCartStates(
      { items: [item(4)], total: 200 },
      { items: [item(2)], total: 100 },
    );
    expect(merged.items[0].quantity).toBe(4);
    expect(merged.total).toBe(200);
  });
});
