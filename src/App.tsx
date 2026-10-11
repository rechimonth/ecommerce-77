import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";

// Las páginas se cargan bajo demanda para evitar enviar el panel admin y el checkout
// al navegador antes de que el usuario los necesite.
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })),
);
const AdminOrdersPage = lazy(() =>
  import("./pages/admin/AdminOrdersPage").then((module) => ({ default: module.AdminOrdersPage })),
);
const AdminProductsPage = lazy(() =>
  import("./pages/admin/AdminProductsPage").then((module) => ({ default: module.AdminProductsPage })),
);
const CheckoutPage = lazy(() =>
  import("./pages/checkout/CheckoutPage").then((module) => ({ default: module.CheckoutPage })),
);
const LoginPage = lazy(() =>
  import("./pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/auth/RegisterPage").then((module) => ({ default: module.RegisterPage })),
);
const CartPage = lazy(() =>
  import("./pages/cart/CartPage").then((module) => ({ default: module.CartPage })),
);
const OrderDetailPage = lazy(() =>
  import("./pages/orders/OrderDetailPage").then((module) => ({ default: module.OrderDetailPage })),
);
const OrdersPage = lazy(() =>
  import("./pages/orders/OrdersPage").then((module) => ({ default: module.OrdersPage })),
);
const ProductDetailPage = lazy(() =>
  import("./pages/products/ProductDetailPage").then((module) => ({ default: module.ProductDetailPage })),
);
const ProductsPage = lazy(() =>
  import("./pages/products/ProductsPage").then((module) => ({ default: module.ProductsPage })),
);

function RouteLoading() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center px-4 text-sm font-medium text-neutral-600"
      role="status"
      aria-live="polite"
    >
      Cargando pantalla…
    </div>
  );
}

// Rutas públicas, autenticadas y administrativas; Firestore y las funciones también validan permisos.
export default function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        </Route>
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </Suspense>
  );
}
