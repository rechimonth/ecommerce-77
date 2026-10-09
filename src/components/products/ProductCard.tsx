import { Link } from "react-router-dom";
import type { Product } from "../../types/product.types";
import { formatPrice } from "../../utils/formatPrice";
import { AddToCartButton } from "../cart/AddToCartButton";
import { ProductImage } from "./ProductImage";

// Tarjeta presentacional: lleva al detalle y expone precio/stock sin saturar la ficha.
export function ProductCard({ product }: { product: Product }) {
  const detailPath = "/products/" + product.id;
  return <article className="group flex min-w-0 flex-col">
    <Link to={detailPath} aria-label={"Ver " + product.name} className="relative block overflow-hidden bg-[#f2f0eb]">
      <div className="aspect-[3/4] overflow-hidden">
        <ProductImage source={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
      </div>
      <span className="absolute left-2 top-2 bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em]">Rural edit</span>
    </Link>
    <div className="mt-3 flex flex-1 flex-col gap-1">
      <Link to={detailPath} className="text-sm font-bold leading-5 underline-offset-4 hover:underline">{product.name}</Link>
      <p className="line-clamp-2 text-xs leading-5 text-neutral-500">{product.description}</p>
      <div className="mt-2 flex items-center justify-between gap-2"><p className="text-sm font-black">{formatPrice(product.price)}</p><p className="text-[10px] text-neutral-500">{product.stock <= 0 ? "Sin stock" : "Disponible"}</p></div>
    </div>
    <div className="mt-3"><AddToCartButton product={product} /></div>
  </article>;
}
