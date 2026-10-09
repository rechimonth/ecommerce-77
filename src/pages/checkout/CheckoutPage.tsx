import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartItemRow } from "../../components/cart/CartItemRow";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { createOrder } from "../../services/orders.service";
import { formatPrice } from "../../utils/formatPrice";

// Checkout de demostración: no cobra dinero, crea una orden pendiente en Firestore.
export function CheckoutPage() {
  const { user, profile } = useAuth();
  const { items, total, clearCart, updateQuantity, removeItem } = useCart();
  const [address, setAddress] = useState("");
  const [name, setName] = useState(profile?.displayName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Crea el pedido simulado y solo vacía el carrito después de confirmar que Firestore lo guardó.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const orderId = await createOrder({
        userId: user.uid, customerName: name, email: user.email ?? "",
        shippingAddress: address, items, total,
      });
      clearCart();
      navigate(`/orders/${orderId}`, { replace: true });
    } catch {
      setError("No pudimos crear el pedido. Tu carrito sigue guardado; revisá la conexión y probá otra vez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return <section className="mx-auto max-w-xl py-12"><h1 className="text-2xl font-black">Tu carrito está vacío</h1><p className="mt-2 text-sm text-neutral-600">Agregá al menos un producto para continuar.</p><Link to="/products" className="mt-5 inline-block font-bold underline">Volver al catálogo</Link></section>;
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_.8fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Finalizar compra · Simulación</p>
        <h1 className="mt-3 text-3xl font-black">Datos de entrega</h1>
        <p className="mt-2 text-sm text-neutral-600">No se realizará ningún cobro. Al confirmar, la orden quedará como pendiente.</p>
        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <label className="grid gap-1 text-sm font-semibold">Nombre completo
            <input required minLength={2} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded border border-neutral-300 px-3 font-normal focus:border-black focus:outline-none" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">Dirección de entrega
            <textarea required minLength={8} autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} rows={3} className="rounded border border-neutral-300 px-3 py-3 font-normal focus:border-black focus:outline-none" />
          </label>
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Pago simulado para el proyecto académico; no ingreses datos bancarios.</div>
          {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <Button variant="solid" type="submit" fullWidth loading={submitting}>Confirmar pedido · {formatPrice(total)}</Button>
        </form>
      </div>
      <aside className="h-fit rounded bg-stone-50 p-5">
        <h2 className="text-lg font-black">Resumen del pedido</h2>
        <ul className="mt-3 divide-y divide-neutral-200">
          {items.map((item) => <CartItemRow key={item.product.id} item={item} onChangeQuantity={updateQuantity} onRemove={removeItem} />)}
        </ul>
        <div className="flex justify-between border-t border-neutral-300 pt-4 text-lg font-black"><span>Total</span><span>{formatPrice(total)}</span></div>
      </aside>
    </section>
  );
}
