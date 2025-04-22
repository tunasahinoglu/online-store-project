import React from 'react';
import { useCart } from '../../pages/cart/cart_context';
import './purchase_page.css';
import handleCheckout from '../../services/checkout.js'
import { useEffect, useState } from "react";
import axios from "axios";

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [deliveryCompanies, setDeliveryCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchCartAndDelivery = async () => {
      try {
        const [cartRes, deliveryRes] = await Promise.all([
          axios.get("/api/cart", {
            headers: { Authorization: token },
          }),
          axios.get("/api/deliveryCompanies", {
            headers: { Authorization: token },
          }),
        ]);

        setCart(cartRes.data);
        setDeliveryCompanies(deliveryRes.data);

        if (deliveryRes.data.length > 0) {
          setSelectedCompany(deliveryRes.data[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading cart or delivery companies:", err);
        setLoading(false);
      }
    };

    fetchCartAndDelivery();
  }, []);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2);
  };

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
        {cart.map((item) => (
          <div key={item.product.id} className="flex justify-between py-1">
            <span>
              {item.product.name} × {item.quantity}
            </span>
            <span>${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
          <span>Total:</span>
          <span>${calculateTotal()}</span>
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
