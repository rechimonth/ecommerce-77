import { Link } from "react-router-dom";
import type { Product } from "../../types/product.types";
import { formatPrice } from "../../utils/formatPrice";
import { CATEGORIES } from "../../utils/categories";
import { AddToCartButton } from "../cart/AddToCartButton";
import { ProductImage } from "./ProductImage";

// Tarjeta de catálogo: fotografía protagonista, marca/categoría, nombre, precio y stock.
export function ProductCard({ product }: { product: Product }) {
  const detailPath = "/products/" + product.id;
  const categoryLabel = CATEGORIES.find((category) => category.id === product.categoryId)?.label ?? "Colección";

  return (
    <article className="group flex min-w-0 flex-col">
      <Link
        to={detailPath}
        aria-label={"Ver detalle de " + product.name}
        className="relative block overflow-hidden bg-[#f2f0eb]"
      >
        <div className="aspect-[3/4] overflow-hidden">
          <ProductImage
            source={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
          />
        </div>
        <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-neutral-800">
          {categoryLabel}
        </span>
        {product.stock <= 0 && (
          <span className="absolute bottom-2 left-2 bg-neutral-900 px-2 py-1 text-[9px] font-semibold uppercase tracking-[.1em] text-white">
            Sin stock
          </span>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-neutral-500">Rural Edition</p>
        <Link
          to={detailPath}
          className="mt-1 text-sm font-semibold leading-5 text-neutral-900 underline-offset-4 hover:underline"
        >
          {product.name}
        </Link>
        {product.description.trim() && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">{product.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <p className="text-sm font-bold tabular-nums text-neutral-950">{formatPrice(product.price)}</p>
          <p className={`text-[10px] ${product.stock <= 0 ? "text-neutral-500" : "text-neutral-600"}`}>
            {product.stock <= 0 ? "No disponible" : product.stock <= 3 ? "Últimas unidades" : "Disponible"}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
