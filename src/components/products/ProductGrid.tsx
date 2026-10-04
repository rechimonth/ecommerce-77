import type { Product } from "../../types/product.types";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: Product[];
  onAdd: (product: Product) => void;
};

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} />
      ))}
    </div>
  );
}
