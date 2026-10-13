import { beforeEach, describe, expect, it, vi } from "vitest";

const firestore = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(private readonly date: Date) {}
    toDate() { return this.date; }
  }
  const constraint = (type: string) => vi.fn((...args: unknown[]) => ({ type, args }));
  return {
    addDoc: vi.fn(),
    collection: vi.fn(() => "products-collection"),
    deleteDoc: vi.fn(),
    doc: vi.fn((...args: unknown[]) => ({ path: args.slice(1).join("/") })),
    endAt: constraint("endAt"),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn((count: number) => ({ type: "limit", count })),
    orderBy: vi.fn((field: string) => ({ type: "orderBy", field })),
    query: vi.fn((...args: unknown[]) => ({ args })),
    serverTimestamp: vi.fn(() => "server-timestamp"),
    startAfter: vi.fn((cursor: unknown) => ({ type: "startAfter", cursor })),
    startAt: constraint("startAt"),
    Timestamp: FakeTimestamp,
    updateDoc: vi.fn(),
    where: vi.fn((field: string, operator: string, value: unknown) => ({ type: "where", field, operator, value })),
  };
});

vi.mock("firebase/firestore", () => firestore);
vi.mock("../config/firebase", () => ({ db: { id: "test-db" } }));

import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
  type ProductInput,
} from "./products.service";

const productData = {
  name: "  Botas Sierra  ",
  nameLower: "botas sierra",
  image: "https://example.test/boots.jpg",
  description: "Botas de prueba",
  price: 120,
  stock: 4,
  categoryId: "shoes",
};

function document(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}

describe("products.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestore.collection.mockReturnValue("products-collection");
    firestore.doc.mockImplementation((...args: unknown[]) => ({ path: args.slice(1).join("/") }));
    firestore.query.mockImplementation((...args: unknown[]) => ({ args }));
    firestore.getDocs.mockResolvedValue({ docs: [] });
    firestore.serverTimestamp.mockReturnValue("server-timestamp");
  });

  it("lista con tamaño predeterminado y mapea datos básicos", async () => {
    const created = new Date("2026-01-01T00:00:00.000Z");
    const lastDoc = document("boots-1", { ...productData, name: "Botas Sierra", createdAt: new firestore.Timestamp(created) });
    firestore.getDocs.mockResolvedValue({ docs: [lastDoc] });

    const result = await listProducts();

    expect(firestore.limit).toHaveBeenCalledWith(20);
    expect(result.items[0]).toMatchObject({
      id: "boots-1",
      name: "Botas Sierra",
      price: 120,
      stock: 4,
      createdAt: created,
    });
    expect(result.lastDoc).toBe(lastDoc);
  });

  it("aplica categoría, búsqueda por prefijo, cursor y límite personalizado", async () => {
    const cursor = { id: "previous-page" };
    await listProducts({ categoryId: "shoes", searchPrefix: "bota", pageSize: 7, cursor: cursor as never });

    expect(firestore.where).toHaveBeenCalledWith("categoryId", "==", "shoes");
    expect(firestore.startAt).toHaveBeenCalledWith("bota");
    expect(firestore.endAt).toHaveBeenCalledWith("bota" + String.fromCharCode(0xf8ff));
    expect(firestore.startAfter).toHaveBeenCalledWith(cursor);
    expect(firestore.limit).toHaveBeenCalledWith(7);
    expect(firestore.query.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ type: "where" }));
  });

  it("ignora el prefijo si tiene menos de dos caracteres y devuelve cursor null en una lista vacía", async () => {
    const result = await listProducts({ searchPrefix: "b" });
    expect(firestore.startAt).not.toHaveBeenCalled();
    expect(firestore.endAt).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [], lastDoc: null });
  });

  it("normaliza valores faltantes al mapear documentos antiguos", async () => {
    firestore.getDocs.mockResolvedValue({ docs: [document("legacy", {})] });
    const result = await listProducts();
    expect(result.items[0]).toMatchObject({
      id: "legacy",
      name: "",
      nameLower: "",
      image: "",
      description: "",
      price: 0,
      stock: 0,
      createdAt: undefined,
      updatedAt: undefined,
    });
  });

  it("obtiene un producto existente y devuelve null cuando no existe", async () => {
    firestore.getDoc
      .mockResolvedValueOnce({ exists: () => true, id: "p1", data: () => productData })
      .mockResolvedValueOnce({ exists: () => false });

    await expect(getProductById("p1")).resolves.toMatchObject({ id: "p1", price: 120 });
    await expect(getProductById("missing")).resolves.toBeNull();
  });

  it("crea el producto normalizando el nombre y estampas de tiempo", async () => {
    firestore.addDoc.mockResolvedValue({ id: "new-product" });
    const id = await createProduct(productData as unknown as ProductInput);

    expect(id).toBe("new-product");
    expect(firestore.addDoc).toHaveBeenCalledWith(
      "products-collection",
      expect.objectContaining({
        name: "Botas Sierra",
        nameLower: "botas sierra",
        createdAt: "server-timestamp",
        updatedAt: "server-timestamp",
      }),
    );
  });

  it("actualiza un producto y normaliza el nombre", async () => {
    firestore.updateDoc.mockResolvedValue(undefined);
    await updateProduct("p1", productData as unknown as ProductInput);

    expect(firestore.doc).toHaveBeenCalledWith({ id: "test-db" }, "products", "p1");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      { path: "products/p1" },
      expect.objectContaining({ name: "Botas Sierra", nameLower: "botas sierra", updatedAt: "server-timestamp" }),
    );
  });

  it("elimina el documento solicitado", async () => {
    firestore.deleteDoc.mockResolvedValue(undefined);
    await deleteProduct("p1");
    expect(firestore.deleteDoc).toHaveBeenCalledWith({ path: "products/p1" });
  });
});
