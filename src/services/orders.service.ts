import {
  addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp,
  Timestamp, updateDoc, where,
} from "firebase/firestore";
import { db } from "../config/firebase";
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

// El checkout guarda una fotografía de los precios/nombres que tenía el carrito.
export async function createOrder(input: {
  userId: string; customerName: string; email: string; shippingAddress: string;
  items: CartItem[]; total: number;
}): Promise<string> {
  const { userId, customerName, email, shippingAddress, items, total } = input;
  const orderItems: OrderItemSnapshot[] = items.map(({ product, quantity }) => ({
    productId: product.id, name: product.name, image: product.image,
    unitPrice: product.price, quantity, lineTotal: Math.round(product.price * quantity * 100) / 100,
  }));
  const reference = await addDoc(collection(db, "orders"), {
    userId, customerName: customerName.trim(), email: email.trim(),
    shippingAddress: shippingAddress.trim(), items: orderItems, total,
    status: "pending", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return reference.id;
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
