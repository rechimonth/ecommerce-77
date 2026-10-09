import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// El área admin tiene navegación y tono propios, separado de la experiencia de tienda.
export function AdminLayout() {
  const { profile } = useAuth();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm font-semibold ${isActive ? "bg-black text-white" : "hover:bg-stone-100"}`;

  return <div className="min-h-screen bg-stone-50">
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Rural Edition</p><p className="font-black">Panel de administración</p></div>
        <div className="text-right"><p className="text-xs text-neutral-500">Sesión admin</p><p className="text-sm font-semibold">{profile?.displayName || profile?.email}</p></div>
      </div>
    </header>
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
      <aside className="flex gap-2 overflow-x-auto md:flex-col">
        <NavLink end to="/admin" className={linkClass}>Resumen</NavLink>
        <NavLink to="/admin/products" className={linkClass}>Productos</NavLink>
        <NavLink to="/admin/orders" className={linkClass}>Pedidos</NavLink>
        <NavLink to="/products" className={linkClass}>← Volver a la tienda</NavLink>
      </aside>
      <main className="min-w-0 rounded bg-white p-4 shadow-sm sm:p-6"><Outlet /></main>
    </div>
  </div>;
}
