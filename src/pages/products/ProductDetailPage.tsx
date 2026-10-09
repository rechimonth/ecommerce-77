import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AddToCartButton } from "../../components/cart/AddToCartButton";
import { ErrorState } from "../../components/states/ErrorState";
import { LoadingState } from "../../components/states/LoadingState";
import { ProductImage } from "../../components/products/ProductImage";
import { getProductById } from "../../services/products.service";
import type { Product } from "../../types/product.types";
import { formatPrice } from "../../utils/formatPrice";

// La página obtiene un producto por ID y conserva los estados de carga/error.
export function ProductDetailPage() {
  const { productId = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProductById(productId).then((result) => {
      if (active) setProduct(result);
    }).catch(() => {
      if (active) setError("No pudimos cargar este producto. Probá de nuevo.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [productId]);

  if (loading) return <LoadingState message="Cargando producto…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!product) return <section className="py-12"><h1 className="text-2xl font-black">Producto no encontrado</h1><Link to="/products" className="mt-4 inline-block underline">Volver al catálogo</Link></section>;

  return (
    <section className="grid gap-8 md:grid-cols-2 md:gap-14">
      <ProductImage source={product.image} alt={product.name} className="aspect-[3/4] w-full bg-stone-100 object-cover" />
      <div className="flex flex-col items-start py-2 md:py-10">
        <Link to="/products" className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black">← Volver al catálogo</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[.22em] text-amber-800">Rural Edition · Colección permanente</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
        <p className="mt-5 text-2xl font-bold">{formatPrice(product.price)}</p>
        <p className="mt-6 max-w-xl text-sm leading-7 text-neutral-600">{product.description}</p>
        <p className="mt-6 text-xs text-neutral-500">{product.stock > 0 ? `Disponible · ${product.stock} unidades` : "Actualmente sin stock"}</p>
        <div className="mt-7 w-full max-w-sm"><AddToCartButton product={product} /></div>
        <div className="mt-8 border-t border-neutral-200 pt-5 text-xs leading-6 text-neutral-500">Diseño de inspiración ecuestre y materiales pensados para acompañarte temporada tras temporada.</div>
      </div>
    </section>
  );
}
