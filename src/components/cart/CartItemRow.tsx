import type { CartItem } from "../../types/cart.types";
import { formatPrice } from "../../utils/formatPrice";

type CartItemRowProps = {
  item: CartItem;
  onChangeQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
};

// Presentacional: recibe datos y callbacks, no conoce el context.
export function CartItemRow({ item, onChangeQuantity, onRemove }: CartItemRowProps) {
  const { product, quantity } = item;

  return (
    <li className="flex gap-3 py-4">
      <img
        src={product.image}
        alt={product.name}
        className="h-24 w-[72px] shrink-0 rounded-sm bg-neutral-100 object-cover"
      />
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-bold">{product.name}</p>
        <p className="text-xs text-neutral-500">
          {formatPrice(product.price)} × {quantity}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <button
            aria-label={`Quitar una unidad de ${product.name}`}
            onClick={() => onChangeQuantity(product.id, quantity - 1)}
            className="h-8 w-8 rounded-sm bg-neutral-100 transition-colors hover:bg-neutral-200"
          >
            −
          </button>
          <span className="w-6 text-center text-sm">{quantity}</span>
          <button
            aria-label={`Agregar una unidad de ${product.name}`}
            onClick={() => onChangeQuantity(product.id, quantity + 1)}
            disabled={quantity >= product.stock}
            className="h-8 w-8 rounded-sm bg-neutral-100 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
          <button
            onClick={() => onRemove(product.id)}
            className="ml-auto text-xs text-neutral-500 underline underline-offset-4 hover:text-black"
          >
            Eliminar
          </button>
        </div>
      </div>
      <p className="text-sm font-bold">{formatPrice(product.price * quantity)}</p>
    </li>
  );
}
