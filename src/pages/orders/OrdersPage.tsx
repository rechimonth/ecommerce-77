import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";
import { LoadingState } from "../../components/states/LoadingState";
import { useAuth } from "../../hooks/useAuth";
import { listUserOrders } from "../../services/orders.service";
import { ORDER_STATUS_LABELS, type CustomerOrder } from "../../types/order.types";
import { formatPrice } from "../../utils/formatPrice";

// Historial individual: consulta por UID y deja que las reglas de Firestore validen el acceso.
export function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga únicamente pedidos de la sesión actual; evita actualizar estado al desmontarse.
  useEffect(() => {
    let active = true;
    if (!user) {
      setLoading(false);
      return () => { active = false; };
    }
    listUserOrders(user.uid)
      .then((data) => { if (active) setOrders(data); })
      .catch(() => { if (active) setError("No pudimos cargar tus pedidos. Volvé a intentar."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  if (loading) return <LoadingState message="Cargando tus pedidos…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (orders.length === 0) {
    return <EmptyState
      title="Todavía no tenés pedidos"
      description="Cuando confirmes una compra, va a aparecer en este historial."
      action={{ label: "Explorar colección", onClick: () => navigate("/products") }}
    />;
  }

  return <section className="mx-auto max-w-4xl">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Tu cuenta</p>
    <h1 className="mt-2 text-3xl font-black">Mis pedidos</h1>
    <div className="mt-7 divide-y divide-neutral-200 border-y border-neutral-200">
      {orders.map((order) => <Link key={order.id} to={"/orders/" + order.id} className="flex flex-col gap-3 py-5 transition-colors hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between sm:px-3">
        <div><p className="font-bold">Pedido #{order.id.slice(0, 8).toUpperCase()}</p><p className="mt-1 text-xs text-neutral-500">{order.createdAt?.toLocaleDateString("es-AR") ?? "Fecha pendiente"} · {order.items.length} artículos</p></div>
        <div className="flex items-center gap-4"><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">{ORDER_STATUS_LABELS[order.status]}</span><span className="font-bold">{formatPrice(order.total)}</span></div>
      </Link>)}
    </div>
  </section>;
}
