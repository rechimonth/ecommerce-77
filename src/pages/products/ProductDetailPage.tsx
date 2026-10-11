import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AddToCartButton } from "../../components/cart/AddToCartButton";
import { ProductImage } from "../../components/products/ProductImage";
import { ProductReviews } from "../../components/products/ProductReviews";
import { ErrorState } from "../../components/states/ErrorState";
import { LoadingState } from "../../components/states/LoadingState";
import { getProductById } from "../../services/products.service";
import type { Product } from "../../types/product.types";
import { CATEGORIES } from "../../utils/categories";
import { formatPrice } from "../../utils/formatPrice";

// Ficha de producto con galería protagonista, precio/disponibilidad y descripción estructurada.
export function ProductDetailPage() {
  const { productId = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProductById(productId)
      .then((result) => {
        if (active) setProduct(result);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar este producto. Revisá tu conexión e intentá de nuevo.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [productId]);

  if (loading) return <LoadingState message="Cargando producto…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!product) {
    return (
      <section className="py-12">
        <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
        <Link to="/products" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">Volver al catálogo</Link>
      </section>
    );
  }

  const categoryLabel = CATEGORIES.find((category) => category.id === product.categoryId)?.label ?? "Colección";

  return (
    <section className="space-y-12">
      <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
        <Link to="/products" className="hover:text-neutral-900">Colección</Link>
        <span aria-hidden="true">/</span>
        <span>{categoryLabel}</span>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-neutral-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] lg:gap-12">
        <div className="min-w-0">
          <div className="relative overflow-hidden bg-[#f2f0eb]">
            <div className="aspect-[3/4] max-h-[820px]">
              <ProductImage source={product.image} alt={product.name} className="h-full w-full object-cover" />
            </div>
            <span className="absolute left-3 top-3 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em]">
              Rural Edition
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-start lg:sticky lg:top-8 lg:self-start">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-neutral-500">Rural Edition · {categoryLabel}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-5 text-2xl font-bold tabular-nums">{formatPrice(product.price)}</p>
          <p className={`mt-3 text-xs font-medium ${product.stock > 0 ? "text-emerald-800" : "text-neutral-500"}`}>
            {product.stock > 0 ? (product.stock <= 3 ? `Últimas unidades · ${product.stock} disponibles` : `Disponible · ${product.stock} unidades`) : "Actualmente sin stock"}
          </p>
          <p className="mt-6 max-w-xl whitespace-pre-line text-sm leading-7 text-neutral-700">{product.description}</p>

          <div className="mt-7 w-full max-w-md">
            <AddToCartButton product={product} />
          </div>
          <p className="mt-3 text-[11px] leading-5 text-neutral-500">
            Checkout de demostración: este proyecto no procesa pagos reales.
          </p>

          <div className="mt-8 w-full border-y border-neutral-200">
            <details className="group border-b border-neutral-200 py-4" open>
              <summary className="cursor-pointer list-none text-sm font-semibold">
                Descripción del producto
                <span aria-hidden="true" className="float-right text-neutral-500 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-600">{product.description}</p>
            </details>
            <details className="group py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold">
                Detalles
                <span aria-hidden="true" className="float-right text-neutral-500 group-open:rotate-45">+</span>
              </summary>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-neutral-500">Categoría</dt><dd className="mt-1 font-medium">{categoryLabel}</dd></div>
                <div><dt className="text-neutral-500">Disponibilidad</dt><dd className="mt-1 font-medium">{product.stock > 0 ? "En stock" : "Agotado"}</dd></div>
                <div><dt className="text-neutral-500">Precio</dt><dd className="mt-1 font-medium">{formatPrice(product.price)}</dd></div>
                <div><dt className="text-neutral-500">Referencia</dt><dd className="mt-1 font-medium">{product.id}</dd></div>
              </dl>
            </details>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </section>
  );
}
