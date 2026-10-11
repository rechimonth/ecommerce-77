import {
  collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp,
  Timestamp, updateDoc, where,
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

// Solo una cuenta con rol admin puede actualizar el estado según las reglas de Firestore.
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), { status, updatedAt: serverTimestamp() });
}
