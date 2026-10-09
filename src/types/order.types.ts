export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export type OrderItemSnapshot = {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CustomerOrder = {
  id: string;
  userId: string;
  customerName: string;
  email: string;
  shippingAddress: string;
  items: OrderItemSnapshot[];
  total: number;
  status: OrderStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En preparación",
  completed: "Completada",
  cancelled: "Cancelada",
};

export const ORDER_STATUSES: OrderStatus[] = ["pending", "processing", "completed", "cancelled"];
