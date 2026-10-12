import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

type HeaderProps = { cartCount: number };

// Cabecera responsive con confirmación explícita antes de cerrar sesión.
export function Header({ cartCount }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    "whitespace-nowrap text-xs font-bold uppercase tracking-[.1em] transition " +
    (isActive ? "text-amber-900" : "text-neutral-600 hover:text-black");

  function openSignOutDialog() {
    setSignOutError(null);
    setShowSignOutDialog(true);
  }

  function closeSignOutDialog() {
    if (isSigningOut) return;
    setShowSignOutDialog(false);
    setSignOutError(null);
  }

  useEffect(() => {
    if (!showSignOutDialog) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSigningOut) closeSignOutDialog();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSignOutDialog, isSigningOut]);

  async function confirmSignOut() {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      setShowSignOutDialog(false);
    } catch {
      setSignOutError("No se pudo cerrar la sesión. Intentá nuevamente.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="bg-[#28271f] px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[.18em] text-white sm:text-xs">
          Rural design, made for every season · Envíos internacionales
        </div>
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-9">
          <Link to="/" aria-label="Rural Edition, inicio" className="shrink-0 leading-none">
            <span className="block text-xl font-black tracking-[-.08em] sm:text-2xl">RURAL</span>
            <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[.35em] text-amber-900 sm:text-[9px]">Edition · Buenos Aires</span>
          </Link>
          <nav aria-label="Navegación principal" className="hidden items-center gap-5 lg:flex">
            <NavLink to="/" end className={navClass}>INICIO</NavLink>
            <NavLink to="/products?category=clothing" className={navClass}>Indumentaria</NavLink>
            <NavLink to="/products?category=shoes" className={navClass}>Calzado</NavLink>
            <NavLink to="/products?category=accessories" className={navClass}>Accesorios</NavLink>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="hidden text-right sm:block">
                <p className="max-w-36 truncate text-xs font-bold">{profile?.displayName || profile?.email}</p>
                <button type="button" onClick={openSignOutDialog} className="text-[10px] text-neutral-500 underline underline-offset-2">
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden text-xs font-bold sm:inline">Ingresar</Link>
            )}
            {user && <Link to="/orders" className="hidden text-xs font-bold md:inline">Mis pedidos</Link>}
            {profile?.role === "admin" && <Link to="/admin" className="hidden text-xs font-bold text-amber-900 md:inline">Admin</Link>}
            <Link to="/cart" aria-label={"Carrito, " + cartCount + " artículos"} className="flex items-center gap-2 rounded-sm border border-neutral-300 px-3 py-2 text-xs font-bold transition hover:border-black">
              Carrito <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[10px] text-white">{cartCount > 99 ? "99+" : cartCount}</span>
            </Link>
          </div>
        </div>
        <nav aria-label="Categorías para móvil" className="flex gap-5 overflow-x-auto border-t border-neutral-100 px-4 py-3 lg:hidden">
          <NavLink to="/" end className={navClass}>INICIO</NavLink>
          <NavLink to="/products?category=clothing" className={navClass}>Ropa</NavLink>
          <NavLink to="/products?category=shoes" className={navClass}>Calzado</NavLink>
          <NavLink to="/products?category=accessories" className={navClass}>Accesorios</NavLink>
          {!user && <Link to="/login" className="whitespace-nowrap text-xs font-bold uppercase tracking-[.1em]">Ingresar</Link>}
          {user && <Link to="/orders" className="whitespace-nowrap text-xs font-bold uppercase tracking-[.1em]">Pedidos</Link>}
          {user && <button type="button" onClick={openSignOutDialog} className="whitespace-nowrap text-xs font-bold uppercase tracking-[.1em]">Cerrar sesión</button>}
          {profile?.role === "admin" && <Link to="/admin" className="whitespace-nowrap text-xs font-bold uppercase tracking-[.1em] text-amber-900">Admin</Link>}
        </nav>
      </header>

      {showSignOutDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSignOutDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-dialog-title"
            aria-describedby="signout-dialog-description"
            className="w-full max-w-sm border border-neutral-200 bg-white p-6 shadow-xl sm:p-7"
          >
            <h2 id="signout-dialog-title" className="text-xl font-semibold tracking-tight text-neutral-950">
              ¿Desea cerrar sesión?
            </h2>
            <p id="signout-dialog-description" className="mt-2 text-sm leading-6 text-neutral-600">
              Si continúa, tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
            </p>
            {signOutError && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{signOutError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                disabled={isSigningOut}
                onClick={closeSignOutDialog}
                className="min-h-11 border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => void confirmSignOut()}
                className="min-h-11 bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isSigningOut ? "Cerrando…" : "Sí"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
