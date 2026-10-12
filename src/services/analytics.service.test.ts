import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(readonly date: Date) {}
    toDate() { return this.date; }
    static fromDate(date: Date) { return new FakeTimestamp(date); }
  }
  const constraint = (type: string) => (field: string, operator?: string, value?: unknown) => ({ type, field, operator, value });
  return {
    firestore: {
      collection: vi.fn((_db: unknown, path: string) => ({ path })),
      count: vi.fn(() => ({ type: "count" })),
      getAggregateFromServer: vi.fn(),
      getCountFromServer: vi.fn(),
      getDocs: vi.fn(),
      limit: vi.fn((value: number) => ({ type: "limit", value })),
      orderBy: vi.fn((field: string, direction: string) => ({ type: "orderBy", field, direction })),
      query: vi.fn((base: unknown, ...constraints: unknown[]) => ({ base, constraints })),
      sum: vi.fn((field: string) => ({ type: "sum", field })),
      Timestamp: FakeTimestamp,
      where: constraint("where"),
    },
    db: { id: "test-db" },
  };
});

vi.mock("firebase/firestore", () => dependencies.firestore);
vi.mock("../config/firebase", () => ({ db: dependencies.db }));

import { getAdminAnalytics } from "./analytics.service";

function orderDoc(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}

describe("analytics.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let dailyIndex = 0;
    dependencies.firestore.getAggregateFromServer.mockImplementation(async (queryRef, _metrics) => {
      const candidate = queryRef as { constraints?: Array<{ field?: string }> };
      if (candidate.constraints?.some((item) => item.field === "createdAt")) {
        dailyIndex += 1;
        return { data: () => ({ revenue: dailyIndex * 10, orderCount: dailyIndex }) };
      }
      return { data: () => ({ revenue: 250, orderCount: 5 }) };
    });
    dependencies.firestore.getCountFromServer.mockImplementation(async (queryRef) => {
      const candidate = queryRef as { constraints?: Array<{ value?: unknown }> };
      return { data: () => ({ count: candidate.constraints ? 3 : 20 }) };
    });
    dependencies.firestore.getDocs.mockResolvedValue({
      docs: [
        orderDoc("o1", {
          items: [
            { productId: "p1", name: "Botas", quantity: 2, unitPrice: 20, lineTotal: 40 },
            { productId: "p2", name: "Abrigo", quantity: 1, unitPrice: 80, lineTotal: 80 },
          ],
        }),
        orderDoc("o2", {
          items: [
            { productId: "p1", name: "Botas", quantity: 1, unitPrice: 20 },
            { productId: "", name: "Inválido", quantity: 3, unitPrice: 5 },
            { productId: "p3", name: "Legacy", quantity: 0 },
          ],
        }),
      ],
    });
  });

  it("calcula las métricas globales, siete días y ranking por unidades", async () => {
    const result = await getAdminAnalytics();

    expect(result.productCount).toBe(20);
    expect(result.completedOrderCount).toBe(5);
    expect(result.completedRevenue).toBe(250);
    expect(result.pendingOrderCount).toBe(3);
    expect(result.dailyRevenue).toHaveLength(7);
    expect(result.dailyRevenue[0]).toMatchObject({ revenue: expect.any(Number), orderCount: expect.any(Number), date: expect.any(String) });
    expect(result.topSellingProducts[0]).toEqual({
      productId: "p1", name: "Botas", unitsSold: 3, revenue: 60,
    });
    expect(result.topSellingProducts[1]).toEqual({
      productId: "p2", name: "Abrigo", unitsSold: 1, revenue: 80,
    });
  });

  it("usa unitPrice cuando un artículo antiguo no contiene lineTotal", async () => {
    dependencies.firestore.getDocs.mockResolvedValue({
      docs: [orderDoc("o1", { items: [{ productId: "p1", name: "Botas", quantity: 2, unitPrice: 15 }] })],
    });
    const result = await getAdminAnalytics();
    expect(result.topSellingProducts[0]).toMatchObject({ productId: "p1", unitsSold: 2, revenue: 30 });
  });

  it("tolera orders sin artículos y valores vacíos en el ranking", async () => {
    dependencies.firestore.getDocs.mockResolvedValue({
      docs: [orderDoc("o1", { items: "legacy" }), orderDoc("o2", {})],
    });
    const result = await getAdminAnalytics();
    expect(result.topSellingProducts).toEqual([]);
  });
});
