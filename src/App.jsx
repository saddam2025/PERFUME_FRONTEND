import { BrowserRouter, Routes, Route } from "react-router-dom";
import Collections from "./pages/Collections";
import About from "./pages/About";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import OrderSuccess from "./pages/OrderSuccess";
import AffiliateJoin from "./pages/AffiliateJoin";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerAnalytics from "./pages/ManagerAnalytics";
import UserProfile from "./pages/UserProfile";
import Promotions from "./pages/Promotions";

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/affiliate/join" element={<AffiliateJoin />} />
                <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
                <Route path="/admin" element={<ManagerDashboard />} />
                <Route path="/admin/promotions" element={<Promotions />} />
                <Route path="/admin/analytics" element={<ManagerAnalytics />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/return-policy" element={<ReturnPolicy />} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
