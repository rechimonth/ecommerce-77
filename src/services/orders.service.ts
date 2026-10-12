import {
  collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp,
  Timestamp, where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { CartItem } from "../types/cart.types";
import type { CustomerOrder, OrderItemSnapshot, OrderStatus } from "../types/order.types";

function toOrder(id: string, data: Record<string, unknown>): CustomerOrder {
  const date = (value: unknown) => value instanceof Timestamp ? value.toDate() : null;
  return {
    id, userId: String(data.userId ?? ""), customerName: String(data.customerName ?? ""),
    email: String(data.email ?? ""), shippingAddress: String(data.shippingAddress ?? ""),
    items: Array.isArray(data.items) ? data.items as OrderItemSnapshot[] : [],
    total: Number(data.total ?? 0), status: data.status as OrderStatus,
    createdAt: date(data.createdAt), updatedAt: date(data.updatedAt),
  };
}

// Crea la orden por la función serverless, que verifica el token y calcula el total
// usando los precios del catálogo de Firestore, nunca los importes del navegador.
export async function createOrder(input: {
  customerName: string;
  shippingAddress: string;
  items: CartItem[];
}): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Iniciá sesión para confirmar el pedido.");

  const idToken = await currentUser.getIdToken();
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      customerName: input.customerName,
      shippingAddress: input.shippingAddress,
      items: input.items.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
      })),
    }),
  });
  const payload = await response.json().catch(() => ({})) as {
    orderId?: string;
    error?: string;
  };
  if (!response.ok || typeof payload.orderId !== "string" || !payload.orderId) {
    throw new Error(payload.error ?? "No pudimos crear el pedido.");
  }
  return payload.orderId;
}

// Un cliente consulta únicamente sus pedidos; Firestore rules vuelve a validarlo.
export async function listUserOrders(userId: string): Promise<CustomerOrder[]> {
  const result = await getDocs(query(collection(db, "orders"),
    where("userId", "==", userId), orderBy("createdAt", "desc")));
  return result.docs.map((item) => toOrder(item.id, item.data()));
}

export async function getOrderById(orderId: string): Promise<CustomerOrder | null> {
  const snapshot = await getDoc(doc(db, "orders", orderId));
  return snapshot.exists() ? toOrder(snapshot.id, snapshot.data()) : null;
}

// El panel admin filtra y ve todos los pedidos; el permiso no depende del frontend.
export async function listAdminOrders(status?: OrderStatus | "all"): Promise<CustomerOrder[]> {
  const base = collection(db, "orders");
  const request = status && status !== "all"
    ? query(base, where("status", "==", status), orderBy("createdAt", "desc"))
    : query(base, orderBy("createdAt", "desc"));
  const result = await getDocs(request);
  return result.docs.map((item) => toOrder(item.id, item.data()));
}

// Cambia el estado del pedido en una transacción. Cancelar una orden abierta
// repone el stock de sus artículos exactamente una vez.
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) throw new Error("El pedido ya no existe.");

    const currentStatus = orderSnapshot.data().status as OrderStatus;
    if (currentStatus === status) return;

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["processing", "completed", "cancelled"],
      processing: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };
    if (!allowedTransitions[currentStatus]?.includes(status)) {
      throw new Error("No se puede cambiar un pedido que ya está completado o cancelado.");
    }

    const rawItems = Array.isArray(orderSnapshot.data().items)
      ? orderSnapshot.data().items as OrderItemSnapshot[]
      : [];
    const quantities = new Map<string, number>();
    if (status === "cancelled") {
      for (const item of rawItems) {
        if (typeof item.productId !== "string" || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
          throw new Error("El pedido contiene un artículo inválido; no se puede reponer el stock de forma segura.");
        }
        quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
      }
    }

    // Todas las lecturas de inventario deben ocurrir antes de escribir el pedido o los productos.
    const stockSnapshots = [];
    if (status === "cancelled") {
      for (const productId of quantities.keys()) {
        const productRef = doc(db, "products", productId);
        stockSnapshots.push({ productId, snapshot: await transaction.get(productRef) });
      }
    }

    for (const entry of stockSnapshots) {
      if (!entry.snapshot.exists()) continue;
      const stock = entry.snapshot.data().stock;
      const quantity = quantities.get(entry.productId) ?? 0;
      if (typeof stock !== "number" || !Number.isSafeInteger(stock) || stock < 0 || !Number.isSafeInteger(stock + quantity)) {
        throw new Error("El inventario de un producto es inválido; no se puede cancelar este pedido de forma segura.");
      }
      transaction.update(entry.snapshot.ref, {
        stock: stock + quantity,
        updatedAt: serverTimestamp(),
      });
    }

    transaction.update(orderRef, { status, updatedAt: serverTimestamp() });
  });
}
