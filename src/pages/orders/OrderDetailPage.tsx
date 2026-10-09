import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductImage } from "../../components/products/ProductImage";
import { ErrorState } from "../../components/states/ErrorState";
import { LoadingState } from "../../components/states/LoadingState";
import { useAuth } from "../../hooks/useAuth";
import { getOrderById } from "../../services/orders.service";
import { ORDER_STATUS_LABELS, type CustomerOrder } from "../../types/order.types";
import { formatPrice } from "../../utils/formatPrice";

// Detalle del pedido: solo el dueño o una cuenta admin pueden ver los datos.
export function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const { user, profile } = useAuth();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getOrderById(orderId).then((data) => { if (active) setOrder(data); })
      .catch(() => { if (active) setError("No pudimos consultar este pedido."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  if (loading) return <LoadingState message="Cargando pedido…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!order || !profile || !user || (profile.role !== "admin" && order.userId !== user.uid)) {
    return <section className="py-12"><h1 className="text-2xl font-black">Pedido no disponible</h1><p className="mt-2 text-sm text-neutral-600">No existe o no tenés permiso para verlo.</p><Link to="/orders" className="mt-5 inline-block underline">Volver a mis pedidos</Link></section>;
  }
  return <section className="mx-auto max-w-3xl">
    <Link to="/orders" className="text-xs font-bold underline">← Mis pedidos</Link>
    <div className="mt-6 flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Detalle del pedido</p><h1 className="mt-2 text-3xl font-black">#{order.id.slice(0, 8).toUpperCase()}</h1><p className="mt-2 text-sm text-neutral-500">{order.createdAt?.toLocaleString("es-AR") ?? "Fecha pendiente"}</p></div>
      <span className="w-fit rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold">{ORDER_STATUS_LABELS[order.status]}</span>
    </div>
    <h2 className="mt-6 text-lg font-black">Artículos</h2>
    <ul className="mt-2 divide-y divide-neutral-200">{order.items.map((item) => <li key={item.productId} className="flex gap-4 py-4"><ProductImage source={item.image} alt={item.name} className="h-20 w-16 bg-stone-100 object-cover" /><div className="flex-1"><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-neutral-500">{formatPrice(item.unitPrice)} × {item.quantity}</p></div><p className="font-bold">{formatPrice(item.lineTotal)}</p></li>)}</ul>
    <div className="mt-5 flex justify-between border-t border-neutral-300 pt-5 text-lg font-black"><span>Total</span><span>{formatPrice(order.total)}</span></div>
    <div className="mt-7 rounded bg-stone-50 p-5"><h2 className="font-black">Entrega</h2><p className="mt-2 text-sm">{order.customerName}</p><p className="text-sm text-neutral-600">{order.email}</p><p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{order.shippingAddress}</p></div>
  </section>;
}
