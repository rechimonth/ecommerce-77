import { useState, type ReactNode } from "react";
import { CartView } from "../components/cart/CartView";
import { Header } from "../components/layout/Header";
import { Modal } from "../components/ui/Modal";
import { useCart } from "../contexts/cart";

export function MainLayout({ children }: { children: ReactNode }) {
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black">
      <Header cartCount={totalItems} onOpenCart={() => setIsCartOpen(true)} />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Tu carrito">
        <CartView />
      </Modal>
    </div>
  );
}
