import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductFilters } from "../../components/products/ProductFilters";
import { ProductGrid } from "../../components/products/ProductGrid";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";
import { LoadingState } from "../../components/states/LoadingState";
import { Button } from "../../components/ui/Button";
import { useProducts } from "../../contexts/products";

// Catálogo directo y navegable, con filtros visibles y carga incremental por cursor.
export function ProductsPage() {
  const {
    products,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    searchText,
    categoryId,
    loadProducts,
    setSearchText,
    setCategoryId,
    resetFilters,
  } = useProducts();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  useEffect(() => {
    if (categoryFromUrl === "clothing" || categoryFromUrl === "shoes" || categoryFromUrl === "accessories") {
      setCategoryId(categoryFromUrl);
    }
  }, [categoryFromUrl, setCategoryId]);

  const hasFilters = Boolean(searchText.trim() || categoryId);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-neutral-500">Rural Edition · Colección permanente</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Ropa de hombre</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Piezas para el campo y la ciudad, elegidas por su funcionalidad, carácter y diseño atemporal.
          </p>
        </div>
        <p className="shrink-0 text-xs text-neutral-500" aria-live="polite">
          <span className="font-semibold text-neutral-900">{products.length}</span> productos cargados
        </p>
      </header>

      <div id="catalogo" className="scroll-mt-28">
        <ProductFilters
          searchText={searchText}
          categoryId={categoryId}
          onSearchChange={setSearchText}
          onCategoryChange={setCategoryId}
        />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
          <p className="text-xs font-semibold text-neutral-800">
            {hasFilters ? "Resultados filtrados" : "Toda la colección"}
          </p>
          <p className="text-[11px] text-neutral-500">Precios en USD · Orden alfabético</p>
        </div>

        {isLoading && <LoadingState message="Cargando productos de la colección…" />}
        {!isLoading && error && <ErrorState message={error} onRetry={() => void loadProducts({ reset: true })} />}
        {!isLoading && !error && products.length === 0 && (
          <EmptyState
            title={hasFilters ? "No encontramos esa pieza" : "La colección todavía está vacía"}
            description={hasFilters ? "Probá otro término o elegí una categoría diferente." : "Volvé más tarde para descubrir nuevas piezas."}
            action={hasFilters ? { label: "Limpiar filtros", onClick: resetFilters } : undefined}
          />
        )}

        {!isLoading && !error && products.length > 0 && (
          <>
            <div className="mt-5"><ProductGrid products={products} /></div>
            <div className="mt-10 flex flex-col items-center gap-2 border-t border-neutral-200 pt-7">
              <p className="text-xs text-neutral-500">
                {hasNextPage ? "Hay más productos para descubrir." : "Llegaste al final de la colección."}
              </p>
              <Button
                variant="solid"
                size="md"
                loading={isLoadingMore}
                disabled={!hasNextPage}
                onClick={() => void loadProducts()}
              >
                {hasNextPage ? "Cargar más productos" : "Colección completa"}
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
