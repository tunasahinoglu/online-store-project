import React from 'react';
import { useCart } from '../../pages/cart/cart_context';
import './purchase_page.css';
import { handleCheckout } from '../../services/checkout.js'
import { useEffect, useState } from "react";
import axios from "axios";

const Checkout = () => {
  const { cart, removeFromCart, clearCart, addToCart, isInitialized } = useCart();
  const [deliveryCompanies, setDeliveryCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const totalPrice = cart.reduce((sum, product) => sum + (product.price * product.quantity), 0);

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    const fetchDelivery = async () => {
      try {
        const deliveryRes = await axios.get("/api/deliveryCompanies", {
          headers: { Authorization: token },
        });
  
        setDeliveryCompanies(deliveryRes.data);
  
        if (deliveryRes.data.length > 0) {
          setSelectedCompany(deliveryRes.data[0].id);
        }
  
        setLoading(false);
      } catch (err) {
        console.error("Error loading delivery companies:", err);
        setLoading(false);
      }
    };
  
    fetchDelivery();
  }, []);
  

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        "/api/orders",
        {
          delivery: {
            company: selectedCompany,
          },
          notes: null,
        },
        {
          headers: { Authorization: token },
        }
      );
      alert("Order placed successfully!");
    } catch (err) {
      console.error("Order placement failed:", err);
      alert("Failed to place order.");
    }
  };

  if (loading) return <p>Loading checkout...</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Cart Summary</h3>

        <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
          <span>Total:</span>
          <span>${totalPrice}</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Delivery Company</h3>
        {deliveryCompanies.map((company) => (
          <label key={company.id} className="block mb-1">
            <input
              type="radio"
              name="deliveryCompany"
              value={company.id}
              checked={selectedCompany === company.id}
              onChange={() => setSelectedCompany(company.id)}
              className="mr-2"
            />
            {company.name}
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Place Order
      </button>
    </div>
  );
};

export default Checkout;
