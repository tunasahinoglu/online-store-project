import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "../pages/homepage/homepage.jsx";
import ProductDetail from "../pages/product/product_detail.jsx";


const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;