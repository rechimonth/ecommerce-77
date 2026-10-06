import { ProductFilters } from "../../components/products/ProductFilters";
import { ProductGrid } from "../../components/products/ProductGrid";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";
import { LoadingState } from "../../components/states/LoadingState";
import { Button } from "../../components/ui/Button";
import { useProducts } from "../../contexts/products";

// Contenedor: obtiene datos y decide qué estado mostrar.
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

  const hasFilters = Boolean(searchText.trim() || categoryId);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-black tracking-tight">Catálogo</h1>

      <ProductFilters
        searchText={searchText}
        categoryId={categoryId}
        onSearchChange={setSearchText}
        onCategoryChange={setCategoryId}
      />

      {isLoading && <LoadingState message="Cargando productos…" />}

      {!isLoading && error && (
        <ErrorState message={error} onRetry={() => loadProducts({ reset: true })} />
      )}

      {!isLoading && !error && products.length === 0 && (
        <EmptyState
          title={hasFilters ? "No hay resultados" : "No hay productos"}
          description={
            hasFilters
              ? "Probá con otro término o cambiá la categoría."
              : "Todavía no hay productos en el catálogo."
          }
          action={hasFilters ? { label: "Limpiar filtros", onClick: resetFilters } : undefined}
        />
      )}

      {!isLoading && !error && products.length > 0 && (
        <>
          <ProductGrid products={products} />
          <div className="flex justify-center">
            <Button
              variant="solid"
              loading={isLoadingMore}
              disabled={!hasNextPage}
              onClick={() => loadProducts()}
            >
              {hasNextPage ? "Cargar más" : "No hay más productos"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
