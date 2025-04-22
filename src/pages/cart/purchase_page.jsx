import React, { useEffect, useState } from 'react';
import { useCart } from '../../pages/cart/cart_context';
import './purchase_page.css';
import { handleCheckout } from '../../services/checkout.js';
import { get } from '../../services/firebase/database.js';

const Checkout = () => {
  const { cart } = useCart();
  const [deliveryCompanies, setDeliveryCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null); // { companyId, type, price }

  const totalPrice = cart.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );
  const deliveryFee = selectedOption?.price || 0;
  const total = totalPrice + deliveryFee;

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const [deliveryRes] = await Promise.all([
          get("deliverycompanies")
        ]);
        console.log(deliveryRes)
        const deliveryItems = deliveryRes.map((doc) => {
          const id = Object.keys(doc)[0];
          return { id, ...doc[id] };
        });

        setDeliveryCompanies(deliveryItems);

        if (deliveryItems.length > 0) {
          setSelectedCompany(deliveryItems[0].id);
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
    try {
      await handleCheckout({ delivery: { company: selectedCompany }, notes: null });
      alert("Order placed successfully!");
    } catch (err) {
      console.error("Order placement failed:", err);
      alert("Failed to place order.");
    }
  };

  if (loading) return <p>Loading checkout...</p>;
  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">Checkout</h2>

      <div>
        <h3 className="text-lg font-semibold mb-2">Cart Summary</h3>
        <div className="flex justify-between">
          <span>Items Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Delivery Company</h3>
        {deliveryCompanies.map((company) => (
          <div
            key={company.id}
            className="flex justify-between items-center border rounded p-3 mb-3 bg-neutral-100 dark:bg-neutral-800"
          >
            <span className="font-medium">{company.name}</span>
            <div className="space-x-2">
              <button
                className={`px-3 py-1 rounded border ${
                  selectedOption?.companyId === company.id && selectedOption.type === "standard"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-neutral-700 text-black dark:text-white"
                }`}
                onClick={() =>
                  setSelectedOption({
                    companyId: company.id,
                    type: "standard",
                    price: company.costs[0],
                  })
                }
              >
                ${company.costs[0]} Standard
              </button>
              <button
                className={`px-3 py-1 rounded border ${
                  selectedOption?.companyId === company.id && selectedOption.type === "express"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-neutral-700 text-black dark:text-white"
                }`}
                onClick={() =>
                  setSelectedOption({
                    companyId: company.id,
                    type: "express",
                    price: company.costs[1],
                  })
                }
              >
                ${company.costs[1]} Express
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedOption && (
        <div className="border-t pt-3">
          <div className="flex justify-between">
            <span>Delivery Fee:</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        disabled={!selectedOption}
        onClick={() => alert("Order placed!")}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        Place Order
      </button>
    </div>
  );
};

export default Checkout;