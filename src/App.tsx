import { MainLayout } from "./layouts/MainLayout";
import { ProductsPage } from "./pages/products/ProductsPage";

export default function App() {
  return (
    <MainLayout>
      <ProductsPage />
    </MainLayout>
  );
}
