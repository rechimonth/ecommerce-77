import { Link, Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { useCart } from "../hooks/useCart";

// Estructura común de tienda: navegación global, contenido de ruta y pie de página.
export function MainLayout() {
  const { itemCount } = useCart();
  return <div className="min-h-screen bg-white text-[#191914]">
    <Header cartCount={itemCount} />
    <main className="mx-auto min-h-[65vh] max-w-[1440px] px-4 py-7 sm:px-6 sm:py-10 lg:px-9"><Outlet /></main>
    <footer className="mt-10 bg-[#28271f] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-9">
        <div><p className="text-lg font-black tracking-[-.06em]">RURAL EDITION</p><p className="mt-2 max-w-xs text-xs leading-5 text-stone-300">Una mirada contemporánea a la tradición ecuestre, el campo y los materiales nobles.</p></div>
        <div><p className="text-xs font-bold uppercase tracking-[.16em]">Explorar</p><div className="mt-3 flex flex-col items-start gap-2 text-sm text-stone-300"><Link to="/products" className="hover:text-white">Colección</Link><Link to="/cart" className="hover:text-white">Carrito</Link><Link to="/orders" className="hover:text-white">Mis pedidos</Link></div></div>
        <div><p className="text-xs font-bold uppercase tracking-[.16em]">Servicio</p><p className="mt-3 text-sm leading-6 text-stone-300">Checkout simulado con fines académicos. No se procesan pagos reales.</p></div>
      </div>
      <div className="border-t border-white/15 px-4 py-4 text-center text-[10px] uppercase tracking-[.15em] text-stone-400">© {new Date().getFullYear()} Rural Edition · Proyecto educativo</div>
    </footer>
  </div>;
}
