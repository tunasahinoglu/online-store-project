import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "../pages/homepage/homepage.jsx";
import ProductDetail from "../pages/product/product_detail.jsx";
import LoginPage from "../pages/auth/login.jsx";
import RegisterPage from "../pages/auth/register.jsx";
import Cart from "../pages/cart/cart_page.jsx";
import { CartProvider } from "../pages/cart/cart_context";
import Wishlist from "../pages/wishlist/wishlist.jsx";
import ProfilePage from "../pages/profile/profilepage.jsx";

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
        </Routes>
      </Router>
    </CartProvider>
  );
};

export default AppRouter;