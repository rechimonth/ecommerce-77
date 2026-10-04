import { useCart } from "../../contexts/cart";
import { formatPrice } from "../../utils/formatPrice";
import { EmptyState } from "../states/EmptyState";
import { Button } from "../ui/Button";

export function CartView() {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Tu carrito está vacío"
        description="Agregá productos desde el catálogo para verlos acá."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-neutral-200">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-3 py-3">
            <img
              src={item.image}
              alt={item.name}
              className="h-20 w-16 rounded-sm object-cover"
            />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-bold">{item.name}</p>
              <p className="text-xs text-neutral-500">{formatPrice(item.price)}</p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  aria-label={`Quitar una unidad de ${item.name}`}
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="h-7 w-7 rounded-sm bg-neutral-100 hover:bg-neutral-200"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button
                  aria-label={`Agregar una unidad de ${item.name}`}
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="h-7 w-7 rounded-sm bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="ml-auto text-xs text-neutral-500 underline hover:text-black"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
        <span className="text-sm text-neutral-500">Total</span>
        <span className="text-lg font-bold">{formatPrice(totalPrice)}</span>
      </div>
      <Button variant="solid" size="sm" onClick={clearCart}>
        Vaciar carrito
      </Button>
    </div>
  );
}
