import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoadingState } from "../../components/states/LoadingState";
import { getAdminAnalytics, type AdminAnalytics, type DailyRevenue } from "../../services/analytics.service";
import { formatPrice } from "../../utils/formatPrice";

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-t-2 border-neutral-900 py-4 pr-4">
      <p className="text-xs font-semibold text-neutral-600">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-neutral-950">{value}</p>
      <p className="mt-2 text-[11px] leading-5 text-neutral-500">{detail}</p>
    </div>
  );
}

function compactMoney(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function RevenueChart({ points }: { points: DailyRevenue[] }) {
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 0);
  const baseline = 148;

  return (
    <div>
      <svg
        viewBox="0 0 540 190"
        role="img"
        aria-label="Gráfico de ingresos de pedidos completados durante los últimos siete días"
        className="mt-3 h-auto w-full overflow-visible"
      >
        <line x1="18" y1={baseline} x2="522" y2={baseline} stroke="#d6d3d1" strokeWidth="1" />
        {points.map((point, index) => {
          const barHeight = maxRevenue > 0 && point.revenue > 0 ? Math.max(4, (point.revenue / maxRevenue) * 94) : 0;
          const x = 30 + index * 72;
          const y = baseline - barHeight;
          return (
            <g key={point.date}>
              <rect x={x} y={y} width="34" height={barHeight} fill="#5e6046" rx="1" />
              <text x={x + 17} y={barHeight ? y - 7 : baseline - 8} textAnchor="middle" fontSize="9" fill="#57534e">
                {compactMoney(point.revenue)}
              </text>
              <text x={x + 17} y="171" textAnchor="middle" fontSize="10" fill="#78716c">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
      {maxRevenue === 0 && <p className="mt-1 text-sm text-neutral-500">Todavía no hay ingresos de pedidos completados en este período.</p>}
    </div>
  );
}

function TopProducts({ analytics }: { analytics: AdminAnalytics }) {
  const products = analytics.topSellingProducts;
  const maxUnits = Math.max(...products.map((product) => product.unitsSold), 1);

  if (products.length === 0) {
    return <p className="mt-4 text-sm leading-6 text-neutral-500">Todavía no hay pedidos completados con artículos para comparar.</p>;
  }

  return (
    <ol className="mt-4 divide-y divide-neutral-200">
      {products.map((product, index) => (
        <li key={product.productId} className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">#{index + 1}</p>
              <p className="mt-1 break-words text-sm font-semibold text-neutral-900">{product.name}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">{product.unitsSold} u.</p>
              <p className="mt-1 text-[11px] text-neutral-500">{formatPrice(product.revenue)}</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full bg-neutral-200">
            <div className="h-full bg-[#5e6046]" style={{ width: `${Math.max(4, (product.unitsSold / maxUnits) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

// Dashboard administrativo. Los ingresos globales usan agregaciones y el ranking
// declara explícitamente que observa los 100 pedidos completados más recientes.
export function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAnalytics(await getAdminAnalytics());
    } catch {
      setError("No pudimos cargar las métricas. Verificá tu rol admin, las reglas de Firestore y los índices de pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-neutral-500">Rural Edition · Administración</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Analytics de ventas</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Seguimiento de pedidos e ingresos reales. Solo se contabilizan los pedidos completados como ventas.
          </p>
        </div>
        <nav aria-label="Accesos de administración" className="flex flex-wrap gap-4 text-xs font-semibold">
          <Link to="/admin/products" className="underline underline-offset-4 hover:text-neutral-600">Administrar productos</Link>
          <Link to="/admin/orders" className="underline underline-offset-4 hover:text-neutral-600">Gestionar pedidos</Link>
        </nav>
      </header>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="font-semibold underline underline-offset-4">Reintentar</button>
        </div>
      )}
      {loading && <LoadingState message="Calculando métricas del negocio…" />}

      {!loading && !error && analytics && (
        <>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Ingresos totales" value={formatPrice(analytics.completedRevenue)} detail="Solo pedidos completados · histórico" />
            <Metric label="Ventas completadas" value={analytics.completedOrderCount.toLocaleString("es-AR")} detail="Pedidos marcados como completados" />
            <Metric label="Pedidos pendientes" value={analytics.pendingOrderCount.toLocaleString("es-AR")} detail="Aún no suman a los ingresos" />
            <Metric label="Productos en catálogo" value={analytics.productCount.toLocaleString("es-AR")} detail="Total de documentos de productos" />
          </div>

          <div className="grid gap-8 border-t border-neutral-200 pt-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
            <section aria-labelledby="revenue-heading" className="min-w-0">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 id="revenue-heading" className="text-xl font-semibold tracking-tight">Ingresos por día</h2>
                <p className="text-[11px] text-neutral-500">Últimos 7 días · USD</p>
              </div>
              <RevenueChart points={analytics.dailyRevenue} />
            </section>

            <section aria-labelledby="top-products-heading" className="min-w-0">
              <h2 id="top-products-heading" className="text-xl font-semibold tracking-tight">Productos más vendidos</h2>
              <p className="mt-2 text-[11px] leading-5 text-neutral-500">Ranking por unidades en los 100 pedidos completados más recientes.</p>
              <TopProducts analytics={analytics} />
            </section>
          </div>
        </>
      )}
    </section>
  );
}
