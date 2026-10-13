import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CartState } from "../types/cart.types";

const firestore = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(private readonly date: Date) {}
    toDate() { return this.date; }
  }
  return {
    doc: vi.fn((...parts: unknown[]) => ({ path: parts.slice(1).join("/") })),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(() => "server-timestamp"),
    Timestamp: FakeTimestamp,
  };
});

vi.mock("firebase/firestore", () => firestore);
vi.mock("../config/firebase", () => ({ db: { id: "test-db" } }));

import { getUserCart, saveUserCart } from "./cart.service";

const cartCreatedAt = new Date("2026-01-10T12:00:00.000Z");
const product = {
  id: "boots",
  name: "Botas",
  nameLower: "botas",
  image: "https://example.test/boots.jpg",
  description: "Botas de prueba",
  price: 49.95,
  stock: 5,
  categoryId: "shoes",
  createdAt: cartCreatedAt,
  updatedAt: "2026-01-11T12:00:00.000Z",
};

function snapshot(data: unknown, exists = true) {
  return { exists: () => exists, data: () => data };
}

describe("cart.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestore.doc.mockImplementation((...parts: unknown[]) => ({ path: parts.slice(1).join("/") }));
    firestore.serverTimestamp.mockReturnValue("server-timestamp");
  });

  it("devuelve null cuando el usuario todavía no tiene documento de carrito", async () => {
    firestore.getDoc.mockResolvedValue(snapshot({}, false));

    await expect(getUserCart("customer-1")).resolves.toBeNull();
    expect(firestore.doc).toHaveBeenCalledWith({ id: "test-db" }, "carts", "customer-1");
  });

  it("tolera un campo items que no sea un array", async () => {
    firestore.getDoc.mockResolvedValue(snapshot({ items: "corrupted" }));

    await expect(getUserCart("customer-1")).resolves.toEqual({ items: [], total: 0 });
  });

  it("restaura artículos válidos, convierte fechas y recalcula el total guardado", async () => {
    const itemCreatedAt = new Date("2026-01-01T00:00:00.000Z");
    firestore.getDoc.mockResolvedValue(snapshot({
      total: 999999,
      items: [{
        product: {
          ...product,
          createdAt: new firestore.Timestamp(itemCreatedAt),
          updatedAt: "2026-01-11T00:00:00.000Z",
        },
        quantity: "2",
        addedAt: "2026-01-12T00:00:00.000Z",
      }],
    }));

    const result = await getUserCart("customer-1");

    expect(result?.items).toHaveLength(1);
    expect(result?.items[0].quantity).toBe(2);
    expect(result?.items[0].product.createdAt).toEqual(itemCreatedAt);
    expect(result?.items[0].product.updatedAt).toEqual(new Date("2026-01-11T00:00:00.000Z"));
    expect(result?.items[0].addedAt).toEqual(new Date("2026-01-12T00:00:00.000Z"));
    expect(result?.total).toBe(99.9);
  });

  it("descarta entradas corruptas, categorías/precios inválidos y cantidades fuera de rango", async () => {
    firestore.getDoc.mockResolvedValue(snapshot({
      items: [
        null,
        [],
        { product: { ...product, categoryId: "weapons" }, quantity: 1 },
        { product: { ...product, price: -1 }, quantity: 1 },
        { product, quantity: 0 },
        { product, quantity: 1.5 },
        { product, quantity: 100 },
        { product, quantity: 1, addedAt: "fecha inválida" },
        { product: { ...product, createdAt: "fecha inválida", updatedAt: new Date("invalid") }, quantity: 1 },
      ],
    }));

    const result = await getUserCart("customer-1");

    expect(result?.items).toHaveLength(2);
    expect(result?.items[0].addedAt).toEqual(new Date(0));
    expect(result?.items[1].product.createdAt).toBeUndefined();
    expect(result?.items[1].product.updatedAt).toBeUndefined();
    expect(result?.total).toBe(99.9);
  });

  it("serializa solo los campos canónicos del producto y omite el total guardado", async () => {
    const cart: CartState = {
      items: [{
        product: { ...product, createdAt: undefined, updatedAt: undefined },
        quantity: 2,
        addedAt: cartCreatedAt,
      }],
      total: 123456,
    };
    firestore.setDoc.mockResolvedValue(undefined);

    await saveUserCart("customer-1", cart);

    expect(firestore.setDoc).toHaveBeenCalledWith(
      { path: "carts/customer-1" },
      {
        items: [{
          product: {
            id: "boots",
            name: "Botas",
            nameLower: "botas",
            image: "https://example.test/boots.jpg",
            description: "Botas de prueba",
            price: 49.95,
            stock: 5,
            categoryId: "shoes",
            createdAt: null,
            updatedAt: null,
          },
          quantity: 2,
          addedAt: cartCreatedAt,
        }],
        updatedAt: "server-timestamp",
      },
    );
  });
});
