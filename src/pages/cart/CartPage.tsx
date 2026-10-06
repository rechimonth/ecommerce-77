import { useNavigate } from "react-router-dom";
import { CartItemRow } from "../../components/cart/CartItemRow";
import { CartSummary } from "../../components/cart/CartSummary";
import { EmptyState } from "../../components/states/EmptyState";
import { useCart } from "../../hooks/useCart";

// Contenedor: lee el context y decide qué mostrar.
export function CartPage() {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Tu carrito está vacío"
        description="Agregá productos desde el catálogo para verlos acá."
        action={{ label: "Ver catálogo", onClick: () => navigate("/products") }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-black tracking-tight">Tu carrito</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <ul className="divide-y divide-neutral-200 lg:col-span-2">
          {items.map((item) => (
            <CartItemRow
              key={item.product.id}
              item={item}
              onChangeQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </ul>
        <CartSummary
          itemCount={itemCount}
          total={total}
          onClear={clearCart}
          onContinue={() => navigate("/products")}
        />
      </div>
    </section>
  );
}
