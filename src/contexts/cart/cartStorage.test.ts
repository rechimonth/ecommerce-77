import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartState } from "../../types/cart.types";
import type { Product } from "../../types/product.types";
import {
  CART_STORAGE_KEY,
  loadCartFromStorage,
  saveCartToStorage,
} from "./cartStorage";

const product: Product = {
  id: "p1",
  name: "Chaqueta",
  nameLower: "chaqueta",
  price: 100,
  stock: 5,
  description: "",
  image: "",
  categoryId: "clothing",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

// localStorage falso en memoria: los tests no dependen del navegador.
function stubLocalStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  });
  return data;
}

describe("cartStorage", () => {
  let data: Map<string, string>;

  beforeEach(() => {
    data = stubLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devuelve un carrito vacío si no hay nada guardado", () => {
    expect(loadCartFromStorage()).toEqual({ items: [], total: 0 });
  });

  it("devuelve un carrito vacío si el JSON está corrupto", () => {
    data.set(CART_STORAGE_KEY, "{esto no es json");
    expect(loadCartFromStorage()).toEqual({ items: [], total: 0 });
  });

  it("restaura addedAt como Date y vuelve a calcular el total", () => {
    const state: CartState = {
      items: [{ product, quantity: 2, addedAt: new Date("2026-02-01T00:00:00Z") }],
      total: 99999, // total viejo/corrupto: no debe usarse
    };
    saveCartToStorage(state);

    const loaded = loadCartFromStorage();

    expect(loaded.items[0].addedAt).toBeInstanceOf(Date);
    expect(loaded.items[0].product.createdAt).toBeInstanceOf(Date);
    expect(loaded.total).toBe(200);
  });

  it("descarta los items con estructura inválida", () => {
    data.set(
      CART_STORAGE_KEY,
      JSON.stringify({ items: [{ nope: true }, { product: { id: "x", price: 1 }, quantity: 0 }] }),
    );
    expect(loadCartFromStorage()).toEqual({ items: [], total: 0 });
  });
});
