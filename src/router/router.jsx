import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OrderHistoryPage from "../pages/orderHistory/OrderHistoryPage.jsx";  // import order history page
import OrderDetailPage from "../pages/orderHistory/OrderDetailPage.jsx";  // import order detail page
import Homepage from "../pages/homepage/homepage.jsx";
import ProductDetail from "../pages/product/product_detail.jsx";
import LoginPage from "../pages/auth/login.jsx";
import RegisterPage from "../pages/auth/register.jsx";
import Cart from "../pages/cart/cart_page.jsx";
<<<<<<< HEAD

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-history" element={<OrderHistoryPage />} /> {/* New route for Order History */}
        <Route path="/order/:orderID" element={<OrderDetailPage />} /> {/* New route for Order Detail */}
      </Routes>
    </Router>
=======
import { CartProvider } from "../pages/cart/cart_context";
import Wishlist from "../pages/wishlist/wishlist.jsx";
import ProfilePage from "../pages/profile/profilepage.jsx";
import SettingsPage from "../pages/profile/settings.jsx";
import OrdersPage from "../pages/profile/orders.jsx";
import SalesManagerPage from "../pages/SalesManagerPage/SalesManagerPage.jsx"; // ✅ Add import

const AppRouter = () => {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/sales" element={<SalesManagerPage />} />
        </Routes>
      </Router>
    </CartProvider>
>>>>>>> ede81827309b35c5130d236f8a120efbb0af026c
  );
};

export default AppRouter;
