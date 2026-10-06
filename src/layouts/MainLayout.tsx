import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { useCart } from "../hooks/useCart";

export function MainLayout() {
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-white text-black">
      <Header cartCount={itemCount} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
