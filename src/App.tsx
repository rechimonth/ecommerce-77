import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { CartPage } from "./pages/cart/CartPage";
import { OrderDetailPage } from "./pages/orders/OrderDetailPage";
import { OrdersPage } from "./pages/orders/OrdersPage";
import { ProductDetailPage } from "./pages/products/ProductDetailPage";
import { ProductsPage } from "./pages/products/ProductsPage";

// Rutas públicas, autenticadas y administrativas; el backend de Firestore también protege los datos.
export default function App() {
  return <Routes>
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
  </Routes>;
}
