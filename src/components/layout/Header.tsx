import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

type HeaderProps = { cartCount: number };

// Cabecera responsive: muestra los accesos relevantes según el estado de sesión.
export function Header({ cartCount }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const navClass = ({ isActive }: { isActive: boolean }) =>
    "whitespace-nowrap text-xs font-bold uppercase tracking-[.1em] transition " +
    (isActive ? "text-amber-900" : "text-neutral-600 hover:text-black");

  async function handleSignOut() {
    try { await signOut(); } catch { /* El proveedor ya expone el error de autenticación. */ }
  }

  return <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
    <div className="bg-[#28271f] px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[.18em] text-white sm:text-xs">
      Rural design, made for every season · Envíos internacionales
    </div>
    <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-9">
      <Link to="/products" aria-label="Rural Edition, inicio" className="shrink-0 leading-none">
        <span className="block text-xl font-black tracking-[-.08em] sm:text-2xl">RURAL</span>
        <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[.35em] text-amber-900 sm:text-[9px]">Edition · Buenos Aires</span>
      </Link>
      <nav aria-label="Navegación principal" className="hidden items-center gap-5 lg:flex">
        <NavLink to="/products" end className={navClass}>Nueva colección</NavLink>
        <NavLink to="/products?category=clothing" className={navClass}>Indumentaria</NavLink>
        <NavLink to="/products?category=shoes" className={navClass}>Calzado</NavLink>
        <NavLink to="/products?category=accessories" className={navClass}>Accesorios</NavLink>
      </nav>
      <div className="flex items-center gap-2 sm:gap-4">
        {user ? <div className="hidden text-right sm:block">
          <p className="max-w-36 truncate text-xs font-bold">{profile?.displayName || profile?.email}</p>
          <button type="button" onClick={() => void handleSignOut()} className="text-[10px] text-neutral-500 underline underline-offset-2">Cerrar sesión</button>
        </div> : <Link to="/login" className="hidden text-xs font-bold sm:inline">Ingresar</Link>}
        {user && <Link to="/orders" className="hidden text-xs font-bold md:inline">Mis pedidos</Link>}
        {profile?.role === "admin" && <Link to="/admin" className="hidden text-xs font-bold text-amber-900 md:inline">Admin</Link>}
        <Link to="/cart" aria-label={"Carrito, " + cartCount + " artículos"} className="flex items-center gap-2 rounded-sm border border-neutral-300 px-3 py-2 text-xs font-bold transition hover:border-black">
          Carrito <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[10px] text-white">{cartCount > 99 ? "99+" : cartCount}</span>
        </Link>
      </div>
    </div>
    <nav aria-label="Categorías para móvil" className="flex gap-5 overflow-x-auto border-t border-neutral-100 px-4 py-3 lg:hidden">
      <NavLink to="/products" end className={navClass}>Colección</NavLink>
      <NavLink to="/products?category=clothing" className={navClass}>Ropa</NavLink>
      <NavLink to="/products?category=shoes" className={navClass}>Calzado</NavLink>
      <NavLink to="/products?category=accessories" className={navClass}>Accesorios</NavLink>
      {!user && <Link to="/login" className="whitespace-nowrap text-xs font-bold uppercase tracking-[.1em]">Ingresar</Link>}
      {user && <Link to="/orders" className="whitespace-nowrap text-xs font-bold uppercase tracking-[.1em]">Pedidos</Link>}
      {user && <button type="button" onClick={() => void handleSignOut()} className="whitespace-nowrap text-xs font-bold uppercase tracking-[.1em]">Salir</button>}
      {profile?.role === "admin" && <Link to="/admin" className="whitespace-nowrap text-xs font-bold uppercase tracking-[.1em] text-amber-900">Admin</Link>}
    </nav>
  </header>;
}
