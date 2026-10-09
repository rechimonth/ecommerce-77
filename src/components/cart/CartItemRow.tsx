import type { CartItem } from "../../types/cart.types";
import { formatPrice } from "../../utils/formatPrice";
import { ProductImage } from "../products/ProductImage";

type CartItemRowProps = {
  item: CartItem;
  onChangeQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
};

// Fila del carrito sin dependencias de Context para que sea fácil de testear y reutilizar.
export function CartItemRow({ item, onChangeQuantity, onRemove }: CartItemRowProps) {
  const { product, quantity } = item;
  return <li className="flex gap-3 py-4 sm:gap-4">
    <ProductImage source={product.image} alt={product.name} className="h-24 w-[72px] shrink-0 bg-stone-100 object-cover sm:h-28 sm:w-[84px]" />
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-sm font-bold">{product.name}</p>
      <p className="text-xs text-neutral-500">{formatPrice(product.price)} × {quantity}</p>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" aria-label={"Quitar una unidad de " + product.name} onClick={() => onChangeQuantity(product.id, quantity - 1)} className="h-8 w-8 rounded-sm bg-stone-100 transition hover:bg-stone-200">−</button>
        <span className="w-6 text-center text-sm">{quantity}</span>
        <button type="button" aria-label={"Agregar una unidad de " + product.name} onClick={() => onChangeQuantity(product.id, quantity + 1)} disabled={quantity >= product.stock} className="h-8 w-8 rounded-sm bg-stone-100 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40">+</button>
        <button type="button" onClick={() => onRemove(product.id)} className="ml-auto text-xs text-neutral-500 underline underline-offset-4 hover:text-black">Eliminar</button>
      </div>
    </div>
    <p className="shrink-0 text-sm font-bold">{formatPrice(product.price * quantity)}</p>
  </li>;
}
