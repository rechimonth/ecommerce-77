import { useCallback, useEffect, useState } from "react";
import { LoadingState } from "../../components/states/LoadingState";
import { listAdminOrders, updateOrderStatus } from "../../services/orders.service";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type CustomerOrder, type OrderStatus } from "../../types/order.types";
import { formatPrice } from "../../utils/formatPrice";

// Una única vista para consultar pedidos y cambiar sus estados permitidos.
export function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Actualiza el listado aplicando el filtro de estado actual.
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setOrders(await listAdminOrders(status)); }
    catch { setError("No pudimos leer los pedidos. Comprobá el rol admin y las reglas de Firestore."); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  // Persiste el estado elegido por el administrador y vuelve a consultar los pedidos.
  async function changeStatus(orderId: string, nextStatus: OrderStatus) {
    setSavingId(orderId);
    setError(null);
    try {
      await updateOrderStatus(orderId, nextStatus);
      await loadOrders();
    } catch {
      setError("No se pudo cambiar el estado. La base de datos debe confirmar el rol de administrador.");
    } finally { setSavingId(null); }
  }

  return <section>
    <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Operaciones</p>
    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <h1 className="text-3xl font-black">Pedidos</h1>
      <label className="grid gap-1 text-xs font-bold">Filtrar por estado
        <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "all")} className="h-10 rounded border border-neutral-300 px-3 text-sm font-normal">
          <option value="all">Todos los estados</option>
          {ORDER_STATUSES.map((item) => <option key={item} value={item}>{ORDER_STATUS_LABELS[item]}</option>)}
        </select>
      </label>
    </div>
    {error && <div className="mt-4"><p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p><button className="mt-2 text-sm font-bold underline" onClick={() => void loadOrders()}>Reintentar</button></div>}
    {loading ? <LoadingState message="Cargando pedidos…" /> : orders.length === 0 ? <p className="mt-8 border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">Todavía no hay pedidos para este filtro.</p> : <div className="mt-6 space-y-3">
      {orders.map((order) => <article key={order.id} className="grid gap-3 border border-neutral-200 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><p className="font-black">#{order.id.slice(0, 8).toUpperCase()} · {formatPrice(order.total)}</p><p className="mt-1 text-sm">{order.customerName} <span className="text-neutral-400">·</span> {order.email}</p><p className="mt-1 text-xs text-neutral-500">{order.createdAt?.toLocaleString("es-AR") ?? "Fecha pendiente"} · {order.items.length} artículos</p><p className="mt-2 whitespace-pre-wrap text-xs text-neutral-500">{order.shippingAddress}</p></div>
        <label className="grid gap-1 text-xs font-bold">Estado del pedido
          <select disabled={savingId === order.id} value={order.status} onChange={(event) => void changeStatus(order.id, event.target.value as OrderStatus)} className="h-10 rounded border border-neutral-300 px-3 text-sm font-normal disabled:opacity-50">
            {ORDER_STATUSES.map((item) => <option key={item} value={item}>{ORDER_STATUS_LABELS[item]}</option>)}
          </select>
          {savingId === order.id && <span className="text-neutral-500">Guardando…</span>}
        </label>
      </article>)}
    </div>}
  </section>;
}
