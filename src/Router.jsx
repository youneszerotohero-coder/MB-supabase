import { Routes, Route } from "react-router-dom";

// Layouts
import ShopLayout from "./layouts/shopLayout";
import AdminLayout from "./layouts/adminLayout";

// Context
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Shop pages
import Home from "./pages/shop/Home";
import Products from "./pages/shop/Products";
import Product from "./pages/shop/Product";
import Thankyou from "./pages/shop/Thankyou";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import POS from "./pages/admin/POS";
import Campaigns from "./pages/admin/Campaigns";
import AProducts from "./pages/admin/AProducts";
import LoginPage from "./pages/admin/Login";

// Shared
import NotFound from "./pages/NotFound";

export default function Router() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Shop Routes */}
        <Route element={<ShopLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/thankyou" element={<Thankyou />} />
        </Route>

        {/* Admin Routes - Protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AProducts />} />
          <Route path="orders" element={<Orders />} />
          <Route path="pos" element={<POS />} />
          <Route path="campaigns" element={<Campaigns />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
