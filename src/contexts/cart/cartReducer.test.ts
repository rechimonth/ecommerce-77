import { describe, expect, it } from "vitest";
import type { CartState } from "../../types/cart.types";
import type { Product } from "../../types/product.types";
import { cartReducer } from "./cartReducer";

const mockProduct: Product = {
  id: "p1",
  name: "Producto test",
  nameLower: "producto test",
  price: 100,
  stock: 10,
  description: "",
  image: "",
  categoryId: "clothing",
};

const emptyState: CartState = { items: [], total: 0 };

describe("cartReducer", () => {
  it("ADD_ITEM agrega un producto nuevo con cantidad 1", () => {
    const next = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(1);
    expect(next.total).toBe(100);
  });

  it("ADD_ITEM incrementa la cantidad si el producto ya existe", () => {
    const withItem = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });
    const next = cartReducer(withItem, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });

    expect(next.items).toHaveLength(1); // sigue siendo 1 fila, no 2
    expect(next.items[0].quantity).toBe(2);
    expect(next.total).toBe(200);
  });

  it("REMOVE_ITEM elimina el producto del carrito", () => {
    const withItem = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });
    const next = cartReducer(withItem, { type: "REMOVE_ITEM", payload: "p1" });

    expect(next.items).toHaveLength(0);
    expect(next.total).toBe(0);
  });

  it("UPDATE_QUANTITY actualiza la cantidad y el total", () => {
    const withItem = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });
    const next = cartReducer(withItem, {
      type: "UPDATE_QUANTITY",
      payload: { productId: "p1", quantity: 3 },
    });

    expect(next.items[0].quantity).toBe(3);
    expect(next.total).toBe(300);
  });

  it("UPDATE_QUANTITY con cantidad 0 elimina el item", () => {
    const withItem = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });
    const next = cartReducer(withItem, {
      type: "UPDATE_QUANTITY",
      payload: { productId: "p1", quantity: 0 },
    });

    expect(next.items).toHaveLength(0);
    expect(next.total).toBe(0);
  });

  it("CLEAR_CART vacía el carrito", () => {
    const withItem = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });
    const next = cartReducer(withItem, { type: "CLEAR_CART" });

    expect(next.items).toHaveLength(0);
    expect(next.total).toBe(0);
  });

  it("calcula correctamente el total con múltiples productos", () => {
    const product2 = { ...mockProduct, id: "p2", price: 50 };

    let state = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });
    state = cartReducer(state, { type: "ADD_ITEM", payload: { product: product2, addedAt: new Date("2026-01-01T00:00:00Z") } });
    state = cartReducer(state, { type: "ADD_ITEM", payload: { product: product2, addedAt: new Date("2026-01-01T00:00:00Z") } });

    expect(state.total).toBe(200); // 100*1 + 50*2
  });

  it("no muta el estado original", () => {
    const state: CartState = {
      items: [{ product: mockProduct, quantity: 1, addedAt: new Date("2026-01-01") }],
      total: 100,
    };
    const originalItems = state.items;

    const next = cartReducer(state, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });

    expect(next).not.toBe(state); // objeto distinto en memoria
    expect(next.items).not.toBe(originalItems); // array distinto en memoria
    expect(state.items[0].quantity).toBe(1); // el original no cambió
    expect(next.items[0].quantity).toBe(2); // el nuevo estado sí
  });

  // ---- Casos edge (paso 3 de la clase) ----

  it("REMOVE_ITEM con un id inexistente deja el carrito igual (doble click en eliminar)", () => {
    const withItem = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });
    const next = cartReducer(withItem, { type: "REMOVE_ITEM", payload: "no-existe" });

    expect(next.items).toHaveLength(1);
    expect(next.total).toBe(100);
  });

  it("UPDATE_QUANTITY con productId inexistente no altera items ni total", () => {
    const withItem = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });
    const next = cartReducer(withItem, {
      type: "UPDATE_QUANTITY",
      payload: { productId: "no-existe", quantity: 5 },
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(1);
    expect(next.total).toBe(100);
  });

  it("UPDATE_QUANTITY con cantidad negativa se trata igual que 0", () => {
    const withItem = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: mockProduct, addedAt: new Date("2026-01-01T00:00:00Z") } });
    const next = cartReducer(withItem, {
      type: "UPDATE_QUANTITY",
      payload: { productId: "p1", quantity: -2 },
    });

    expect(next.items).toHaveLength(0);
    expect(next.total).toBe(0);
  });

  it("un producto con price 0 suma 0 al total", () => {
    const free = { ...mockProduct, id: "free", price: 0 };
    const next = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: free, addedAt: new Date("2026-01-01T00:00:00Z") } });

    expect(next.items).toHaveLength(1);
    expect(next.total).toBe(0);
  });

  it("redondea los decimales: 10.1 + 20.2 da 30.3, no 30.299999999999997", () => {
    const a = { ...mockProduct, id: "a", price: 10.1 };
    const b = { ...mockProduct, id: "b", price: 20.2 };

    let state = cartReducer(emptyState, { type: "ADD_ITEM", payload: { product: a, addedAt: new Date("2026-01-01T00:00:00Z") } });
    state = cartReducer(state, { type: "ADD_ITEM", payload: { product: b, addedAt: new Date("2026-01-01T00:00:00Z") } });

    expect(state.total).toBe(30.3);
  });
});
