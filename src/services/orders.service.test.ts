import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartItem } from "../types/cart.types";

const dependencies = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(private readonly date: Date) {}
    toDate() { return this.date; }
  }
  return {
    firestore: {
      collection: vi.fn((_db: unknown, path: string) => ({ path })),
      doc: vi.fn((_db: unknown, ...parts: string[]) => ({ path: parts.join("/") })),
      getDoc: vi.fn(),
      getDocs: vi.fn(),
      orderBy: vi.fn((field: string, direction?: string) => ({ type: "orderBy", field, direction })),
      query: vi.fn((...args: unknown[]) => ({ args })),
      runTransaction: vi.fn(),
      serverTimestamp: vi.fn(() => "server-timestamp"),
      Timestamp: FakeTimestamp,
      where: vi.fn((field: string, operator: string, value: unknown) => ({ type: "where", field, operator, value })),
    },
    auth: {
      currentUser: null as null | { getIdToken: () => Promise<string> },
    },
    db: { id: "test-db" },
  };
});

vi.mock("firebase/firestore", () => dependencies.firestore);
vi.mock("../config/firebase", () => ({ auth: dependencies.auth, db: dependencies.db }));

import {
  createOrder,
  getOrderById,
  listAdminOrders,
  listUserOrders,
  updateOrderStatus,
} from "./orders.service";

function snapshot(data: Record<string, unknown>, exists = true, ref?: { path: string }) {
  return { exists: () => exists, data: () => data, ref };
}
function orderDocument(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}
function item(productId = "p1", quantity = 2): CartItem {
  return {
    product: {
      id: productId, name: "Botas", nameLower: "botas", image: "https://example.test/boots.jpg",
      description: "Producto de prueba", price: 20, stock: 8, categoryId: "shoes",
    },
    quantity,
    addedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}
function transactionFor(
  entries: Record<string, ReturnType<typeof snapshot>>,
) {
  const transaction = {
    get: vi.fn(async (ref: { path: string }) => entries[ref.path] ?? snapshot({}, false, ref)),
    update: vi.fn(),
  };
  dependencies.firestore.runTransaction.mockImplementation(async (_db, callback) => (
    await (callback as (value: typeof transaction) => unknown)(transaction)
  ));
  return transaction;
}

describe("orders.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.auth.currentUser = null;
    dependencies.firestore.doc.mockImplementation((_db: unknown, ...parts: string[]) => ({ path: parts.join("/") }));
    dependencies.firestore.collection.mockImplementation((_db: unknown, path: string) => ({ path }));
    dependencies.firestore.serverTimestamp.mockReturnValue("server-timestamp");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    dependencies.auth.currentUser = null;
  });

  it("rechaza crear órdenes cuando no existe un usuario autenticado", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(createOrder({
      customerName: "Cliente",
      shippingAddress: "Av. Ejemplo 123, Buenos Aires",
      items: [item()],
    })).rejects.toThrow(/iniciá sesión/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envía solo identidad de producto y cantidades junto con el token Firebase", async () => {
    dependencies.auth.currentUser = { getIdToken: vi.fn(async () => "id-token") };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ orderId: "order-123" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createOrder({
      customerName: " Cliente ",
      shippingAddress: "Av. Ejemplo 123, Buenos Aires",
      items: [item("p1", 2)],
    })).resolves.toBe("order-123");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/orders");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer id-token");
    expect(JSON.parse(String(init.body))).toEqual({
      customerName: " Cliente ",
      shippingAddress: "Av. Ejemplo 123, Buenos Aires",
      items: [{ productId: "p1", quantity: 2 }],
    });
  });

  it("conserva el mensaje del servidor cuando una orden es rechazada", async () => {
    dependencies.auth.currentUser = { getIdToken: async () => "id-token" };
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: "Stock insuficiente" }),
    })));

    await expect(createOrder({
      customerName: "Cliente",
      shippingAddress: "Avenida Ejemplo 123",
      items: [item()],
    })).rejects.toThrow("Stock insuficiente");
  });

  it("tolera respuestas no JSON y respuestas exitosas sin orderId", async () => {
    dependencies.auth.currentUser = { getIdToken: async () => "id-token" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => { throw new Error("invalid json"); } })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const input = { customerName: "Cliente", shippingAddress: "Avenida Ejemplo 123", items: [item()] };
    await expect(createOrder(input)).rejects.toThrow("No pudimos crear el pedido.");
    await expect(createOrder(input)).rejects.toThrow("No pudimos crear el pedido.");
  });

  it("mapea órdenes del usuario y tolera fechas o artículos antiguos", async () => {
    const createdAt = new Date("2026-02-01T00:00:00.000Z");
    dependencies.firestore.getDocs.mockResolvedValue({
      docs: [
        orderDocument("o1", {
          userId: "customer-a",
          customerName: "Cliente",
          email: "cliente@example.test",
          shippingAddress: "Calle 123",
          items: [{ productId: "p1", quantity: 1 }],
          total: "25",
          status: "pending",
          createdAt: new dependencies.firestore.Timestamp(createdAt),
          updatedAt: new Date("2026-02-02T00:00:00.000Z"),
        }),
        orderDocument("o2", { items: "legacy", total: undefined }),
      ],
    });

    const result = await listUserOrders("customer-a");

    expect(dependencies.firestore.where).toHaveBeenCalledWith("userId", "==", "customer-a");
    expect(result[0]).toMatchObject({
      id: "o1", userId: "customer-a", total: 25, status: "pending",
      createdAt, updatedAt: null,
    });
    expect(result[1]).toMatchObject({ id: "o2", userId: "", items: [], total: 0, createdAt: null });
  });

  it("devuelve null cuando no encuentra el pedido", async () => {
    dependencies.firestore.getDoc.mockResolvedValue({ exists: () => false });
    await expect(getOrderById("missing")).resolves.toBeNull();
  });

  it("mapea un pedido individual existente", async () => {
    dependencies.firestore.getDoc.mockResolvedValue({
      exists: () => true,
      id: "o1",
      data: () => ({ userId: "customer-a", status: "processing", total: 75, items: [] }),
    });
    await expect(getOrderById("o1")).resolves.toMatchObject({
      id: "o1", userId: "customer-a", status: "processing", total: 75,
    });
  });

  it("consulta todos los pedidos de administración o filtra por estado", async () => {
    dependencies.firestore.getDocs.mockResolvedValue({ docs: [orderDocument("o1", { status: "pending" })] });

    await listAdminOrders();
    expect(dependencies.firestore.where).not.toHaveBeenCalled();

    await listAdminOrders("pending");
    expect(dependencies.firestore.where).toHaveBeenCalledWith("status", "==", "pending");

    await listAdminOrders("all");
    expect(dependencies.firestore.orderBy).toHaveBeenCalledWith("createdAt", "desc");
  });

  it("cambia pending a processing con una transacción", async () => {
    const transaction = transactionFor({
      "orders/o1": snapshot({ status: "pending", items: [] }, true, { path: "orders/o1" }),
    });

    await updateOrderStatus("o1", "processing");

    expect(transaction.update).toHaveBeenCalledWith(
      { path: "orders/o1" },
      { status: "processing", updatedAt: "server-timestamp" },
    );
  });

  it("no escribe si el pedido ya está en el estado solicitado", async () => {
    const transaction = transactionFor({
      "orders/o1": snapshot({ status: "processing", items: [] }, true, { path: "orders/o1" }),
    });

    await updateOrderStatus("o1", "processing");
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it("rechaza pedidos inexistentes y transiciones desde un estado terminal", async () => {
    transactionFor({});
    await expect(updateOrderStatus("missing", "processing")).rejects.toThrow("El pedido ya no existe.");

    transactionFor({
      "orders/o2": snapshot({ status: "completed", items: [] }, true, { path: "orders/o2" }),
    });
    await expect(updateOrderStatus("o2", "cancelled")).rejects.toThrow(/no se puede cambiar/i);
  });

  it("al cancelar agrega el stock de cada línea y evita escribir productos inexistentes", async () => {
    const transaction = transactionFor({
      "orders/o1": snapshot({
        status: "pending",
        items: [
          { productId: "p1", quantity: 1 },
          { productId: "p1", quantity: 2 },
          { productId: "deleted-product", quantity: 1 },
        ],
      }, true, { path: "orders/o1" }),
      "products/p1": snapshot({ stock: 4 }, true, { path: "products/p1" }),
      "products/deleted-product": snapshot({}, false, { path: "products/deleted-product" }),
    });

    await updateOrderStatus("o1", "cancelled");

    expect(transaction.update).toHaveBeenCalledWith(
      { path: "products/p1" },
      { stock: 7, updatedAt: "server-timestamp" },
    );
    expect(transaction.update).toHaveBeenCalledWith(
      { path: "orders/o1" },
      { status: "cancelled", updatedAt: "server-timestamp" },
    );
    expect(transaction.update).toHaveBeenCalledTimes(2);
  });

  it("rechaza reponer stock si una línea contiene cantidad o ID inválido", async () => {
    transactionFor({
      "orders/o1": snapshot({
        status: "pending",
        items: [{ productId: "", quantity: 0 }],
      }, true, { path: "orders/o1" }),
    });

    await expect(updateOrderStatus("o1", "cancelled")).rejects.toThrow(/artículo inválido/i);
  });

  it("rechaza cancelar cuando el inventario guardado es inválido", async () => {
    transactionFor({
      "orders/o1": snapshot({
        status: "pending",
        items: [{ productId: "p1", quantity: 1 }],
      }, true, { path: "orders/o1" }),
      "products/p1": snapshot({ stock: -1 }, true, { path: "products/p1" }),
    });

    await expect(updateOrderStatus("o1", "cancelled")).rejects.toThrow(/inventario.*inválido/i);
  });
});
