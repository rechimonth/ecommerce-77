import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { getUserCart } from "./cart.service";

function snapshot(data: unknown, exists = true) {
  return { exists: () => exists, data: () => data };
}

describe("cart.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestore.doc.mockImplementation((...parts: unknown[]) => ({ path: parts.slice(1).join("/") }));
  });

  it("devuelve null cuando el usuario todavía no tiene documento de carrito", async () => {
    firestore.getDoc.mockResolvedValue(snapshot({}, false));

    await expect(getUserCart("customer-1")).resolves.toBeNull();
    expect(firestore.doc).toHaveBeenCalledWith({ id: "test-db" }, "carts", "customer-1");
  });
});
