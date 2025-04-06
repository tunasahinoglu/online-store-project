import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OrderHistoryPage from "../pages/orderHistory/OrderHistoryPage.jsx";  // import order history page
import OrderDetailPage from "../pages/orderHistory/OrderDetailPage.jsx";  // import order detail page
import Homepage from "../pages/homepage/homepage.jsx";
import ProductDetail from "../pages/product/product_detail.jsx";
import LoginPage from "../pages/auth/login.jsx";
import RegisterPage from "../pages/auth/register.jsx";
import Cart from "../pages/cart/cart_page.jsx";

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
  );
};

export default AppRouter;
