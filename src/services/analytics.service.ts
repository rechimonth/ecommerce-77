import {
  collection,
  count,
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  sum,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { OrderItemSnapshot } from "../types/order.types";

export type DailyRevenue = {
  date: string;
  label: string;
  revenue: number;
  orderCount: number;
};

export type TopSellingProduct = {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
};

export type AdminAnalytics = {
  productCount: number;
  completedOrderCount: number;
  completedRevenue: number;
  pendingOrderCount: number;
  dailyRevenue: DailyRevenue[];
  topSellingProducts: TopSellingProduct[];
};

function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

// Las métricas globales se calculan con agregaciones de Firestore; no se descarga
// la colección entera de pedidos para sumar importes en el navegador.
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const orders = collection(db, "orders");
  const completedOrders = query(orders, where("status", "==", "completed"));
  const pendingOrders = query(orders, where("status", "==", "pending"));

  const now = new Date();
  const dayStarts = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  const dailyRequests = dayStarts.map(async (start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const dailyQuery = query(
      orders,
      where("status", "==", "completed"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<", Timestamp.fromDate(end)),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getAggregateFromServer(dailyQuery, {
      revenue: sum("total"),
      orderCount: count(),
    });
    const values = snapshot.data();
    return {
      date: localDateKey(start),
      label: new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(start).replace(".", ""),
      revenue: Number(values.revenue ?? 0),
      orderCount: Number(values.orderCount ?? 0),
    };
  });

  const [products, completed, pending, recentCompleted, dailyRevenue] = await Promise.all([
    getCountFromServer(collection(db, "products")),
    getAggregateFromServer(completedOrders, { orderCount: count(), revenue: sum("total") }),
    getCountFromServer(pendingOrders),
    getDocs(query(orders, where("status", "==", "completed"), orderBy("createdAt", "desc"), limit(100))),
    Promise.all(dailyRequests),
  ]);

  const totals = completed.data();
  const sales = new Map<string, TopSellingProduct>();
  for (const orderSnapshot of recentCompleted.docs) {
    const data = orderSnapshot.data();
    const items: OrderItemSnapshot[] = Array.isArray(data.items) ? data.items as OrderItemSnapshot[] : [];
    for (const item of items) {
      const productId = String(item.productId ?? "");
      const unitsSold = Number(item.quantity ?? 0);
      if (!productId || !Number.isFinite(unitsSold) || unitsSold <= 0) continue;
      const current = sales.get(productId) ?? {
        productId,
        name: String(item.name ?? "Producto"),
        unitsSold: 0,
        revenue: 0,
      };
      current.unitsSold += unitsSold;
      const lineRevenue = Number(item.lineTotal);
      const unitPrice = Number(item.unitPrice);
      current.revenue += Number.isFinite(lineRevenue) ? lineRevenue : (Number.isFinite(unitPrice) ? unitPrice * unitsSold : 0);
      sales.set(productId, current);
    }
  }

  return {
    productCount: products.data().count,
    completedOrderCount: Number(totals.orderCount ?? 0),
    completedRevenue: Number(totals.revenue ?? 0),
    pendingOrderCount: pending.data().count,
    dailyRevenue,
    topSellingProducts: [...sales.values()].sort((left, right) => right.unitsSold - left.unitsSold).slice(0, 5),
  };
}
