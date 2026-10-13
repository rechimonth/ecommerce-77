import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(private readonly date: Date) {}
    toDate() { return this.date; }
  }
  return {
    firestore: {
      average: vi.fn((field: string) => ({ type: "average", field })),
      collection: vi.fn((_db: unknown, ...parts: string[]) => ({ path: parts.join("/") })),
      count: vi.fn(() => ({ type: "count" })),
      doc: vi.fn((_db: unknown, ...parts: string[]) => ({ path: parts.join("/") })),
      getAggregateFromServer: vi.fn(),
      getDoc: vi.fn(),
      getDocs: vi.fn(),
      limit: vi.fn((size: number) => ({ type: "limit", size })),
      orderBy: vi.fn((field: string, direction: string) => ({ type: "orderBy", field, direction })),
      query: vi.fn((...args: unknown[]) => ({ args })),
      serverTimestamp: vi.fn(() => "server-timestamp"),
      setDoc: vi.fn(),
      Timestamp: FakeTimestamp,
      updateDoc: vi.fn(),
    },
    auth: { currentUser: null as null | { uid: string } },
    db: { id: "test-db" },
  };
});

vi.mock("firebase/firestore", () => dependencies.firestore);
vi.mock("../config/firebase", () => ({ auth: dependencies.auth, db: dependencies.db }));

import {
  getMyProductReview,
  getProductReviewSummary,
  listProductReviews,
  saveProductReview,
} from "./reviews.service";

describe("reviews.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.auth.currentUser = null;
    dependencies.firestore.serverTimestamp.mockReturnValue("server-timestamp");
  });
  afterEach(() => {
    dependencies.auth.currentUser = null;
  });

  it("calcula el promedio y la cantidad mediante agregación de Firestore", async () => {
    dependencies.firestore.getAggregateFromServer.mockResolvedValue({
      data: () => ({ averageRating: 4.25, reviewCount: 4 }),
    });
    await expect(getProductReviewSummary("p1")).resolves.toEqual({ averageRating: 4.25, reviewCount: 4 });
    expect(dependencies.firestore.collection).toHaveBeenCalledWith(dependencies.db, "products", "p1", "reviews");
    expect(dependencies.firestore.average).toHaveBeenCalledWith("rating");
    expect(dependencies.firestore.count).toHaveBeenCalled();
  });

  it("normaliza una agregación vacía a cero", async () => {
    dependencies.firestore.getAggregateFromServer.mockResolvedValue({ data: () => ({}) });
    await expect(getProductReviewSummary("p1")).resolves.toEqual({ averageRating: 0, reviewCount: 0 });
  });

  it("lista reseñas recientes, convierte Timestamp y tolera documentos antiguos", async () => {
    const createdAt = new Date("2026-02-10T00:00:00.000Z");
    dependencies.firestore.getDocs.mockResolvedValue({
      docs: [
        { id: "user-1", data: () => ({
          userId: "user-1", rating: "5", comment: "Excelente", createdAt: new dependencies.firestore.Timestamp(createdAt),
        }) },
        { id: "user-2", data: () => ({ comment: null }) },
      ],
    });

    const reviews = await listProductReviews("p1", 3);

    expect(dependencies.firestore.limit).toHaveBeenCalledWith(3);
    expect(dependencies.firestore.orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(reviews[0]).toEqual({
      id: "user-1", userId: "user-1", rating: 5, comment: "Excelente", createdAt,
    });
    expect(reviews[1]).toEqual({ id: "user-2", userId: "", rating: 0, comment: "", createdAt: null });
  });

  it("devuelve una lista vacía cuando no hay reseñas", async () => {
    dependencies.firestore.getDocs.mockResolvedValue({ docs: [] });
    await expect(listProductReviews("p1")).resolves.toEqual([]);
    expect(dependencies.firestore.limit).toHaveBeenCalledWith(8);
  });

  it("no solicita una reseña propia cuando no existe usuario autenticado", async () => {
    await expect(getMyProductReview("p1")).resolves.toBeNull();
    expect(dependencies.firestore.getDoc).not.toHaveBeenCalled();
  });

  it("consulta la reseña propia por UID y devuelve null si falta", async () => {
    dependencies.auth.currentUser = { uid: "user-1" };
    dependencies.firestore.getDoc.mockResolvedValue({ exists: () => false });
    await expect(getMyProductReview("p1")).resolves.toBeNull();
    expect(dependencies.firestore.doc).toHaveBeenCalledWith(dependencies.db, "products", "p1", "reviews", "user-1");
  });

  it("mapea la reseña propia si existe", async () => {
    dependencies.auth.currentUser = { uid: "user-1" };
    const createdAt = new Date("2026-02-10T00:00:00.000Z");
    dependencies.firestore.getDoc.mockResolvedValue({
      exists: () => true,
      id: "user-1",
      data: () => ({ userId: "user-1", rating: 4, comment: "Bien", createdAt: new dependencies.firestore.Timestamp(createdAt) }),
    });
    await expect(getMyProductReview("p1")).resolves.toMatchObject({ id: "user-1", rating: 4, createdAt });
  });

  it("valida login, puntuación y longitud del comentario antes de escribir", async () => {
    await expect(saveProductReview("p1", 5, "Muy bueno")).rejects.toThrow(/iniciá sesión/i);
    dependencies.auth.currentUser = { uid: "user-1" };
    for (const rating of [0, 1.5, 6]) {
      await expect(saveProductReview("p1", rating, "Comentario válido")).rejects.toThrow(/puntuación/i);
    }
    await expect(saveProductReview("p1", 5, "ab")).rejects.toThrow(/3 y 500/i);
    await expect(saveProductReview("p1", 5, "x".repeat(501))).rejects.toThrow(/3 y 500/i);
    expect(dependencies.firestore.setDoc).not.toHaveBeenCalled();
    expect(dependencies.firestore.updateDoc).not.toHaveBeenCalled();
  });

  it("crea la primera reseña con UID y timestamps confiables", async () => {
    dependencies.auth.currentUser = { uid: "user-1" };
    dependencies.firestore.getDoc.mockResolvedValue({ exists: () => false });
    dependencies.firestore.setDoc.mockResolvedValue(undefined);

    await saveProductReview("p1", 5, "  Excelente producto  ");

    expect(dependencies.firestore.setDoc).toHaveBeenCalledWith(
      { path: "products/p1/reviews/user-1" },
      {
        userId: "user-1",
        rating: 5,
        comment: "Excelente producto",
        createdAt: "server-timestamp",
        updatedAt: "server-timestamp",
      },
    );
  });

  it("actualiza la reseña existente sin cambiar UID ni createdAt", async () => {
    dependencies.auth.currentUser = { uid: "user-1" };
    dependencies.firestore.getDoc.mockResolvedValue({ exists: () => true });
    dependencies.firestore.updateDoc.mockResolvedValue(undefined);

    await saveProductReview("p1", 3, "Comentario actualizado");

    expect(dependencies.firestore.updateDoc).toHaveBeenCalledWith(
      { path: "products/p1/reviews/user-1" },
      { rating: 3, comment: "Comentario actualizado", updatedAt: "server-timestamp" },
    );
    expect(dependencies.firestore.setDoc).not.toHaveBeenCalled();
  });
});
