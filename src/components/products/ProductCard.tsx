import type { Product } from "../../types/product.types";
import { formatPrice } from "../../utils/formatPrice";
import { AddToCartButton } from "../cart/AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col">
      <div className="aspect-[3/4] overflow-hidden rounded-sm bg-neutral-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <h3 className="text-sm font-bold">{product.name}</h3>
        <p className="line-clamp-2 text-xs text-neutral-500">{product.description}</p>
        <p className="mt-1 text-sm font-bold">{formatPrice(product.price)}</p>
        <p className="text-xs text-neutral-500">
          {product.stock <= 0 ? "Sin stock" : `${product.stock} disponibles`}
        </p>
      </div>
      <div className="mt-3">
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
