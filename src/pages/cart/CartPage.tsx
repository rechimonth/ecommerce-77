import { useNavigate } from "react-router-dom";
import { CartItemRow } from "../../components/cart/CartItemRow";
import { CartSummary } from "../../components/cart/CartSummary";
import { EmptyState } from "../../components/states/EmptyState";
import { Button } from "../../components/ui/Button";
import { useCart } from "../../hooks/useCart";

// La página orquesta las acciones del carrito y lleva al checkout simulado.
export function CartPage() {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  if (items.length === 0) return <EmptyState title="Tu carrito está vacío" description="Descubrí piezas atemporales de inspiración rural." action={{ label: "Explorar colección", onClick: () => navigate("/products") }} />;
  return <section className="flex flex-col gap-6">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Tu selección</p><h1 className="mt-2 text-3xl font-black tracking-tight">Carrito</h1></div>
    <div className="grid gap-8 lg:grid-cols-3">
      <ul className="divide-y divide-neutral-200 lg:col-span-2">{items.map((item) => <CartItemRow key={item.product.id} item={item} onChangeQuantity={updateQuantity} onRemove={removeItem} />)}</ul>
      <div className="flex flex-col gap-3">
        <CartSummary itemCount={itemCount} total={total} onClear={clearCart} onContinue={() => navigate("/products")} />
        <Button variant="solid" fullWidth size="lg" onClick={() => navigate("/checkout")}>Continuar al checkout</Button>
        <p className="text-center text-xs leading-5 text-neutral-500">Pago simulado para el proyecto académico. No se realizará ningún cobro.</p>
      </div>
    </div>
  </section>;
}
