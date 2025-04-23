import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../pages/cart/cart_context';
import './purchase_page.css';
import { handleCheckout} from '../../services/checkout.js';
import { get } from '../../services/firebase/database.js';
import { auth } from "../../services/firebase/connect.js";

const Checkout = () => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const [deliveryCompanies, setDeliveryCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null); // { companyId, type, price }
  const [processing, setProcessing] = useState(false);

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cvv: '',
    expirationDate: '',
  });

  const totalPrice = cart.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );
  const deliveryFee = selectedOption?.price || 0;
  const total = totalPrice + deliveryFee;

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const [deliveryRes] = await Promise.all([get("deliverycompanies")]);
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
      setProcessing(true);
      await handleCheckout({ 
        cart: cart, 
        selectedDeliveryCompany: selectedCompany.companyId, // Ensure correct delivery company is passed
        selectedDeliveryType: selectedCompany.type, // Add the delivery type here
        notes: null, 
        navigate // Pass navigate as a parameter to handleCheckout,
      });
    } catch (err) {
      console.error("Order placement failed:", err);
      alert("Failed to place order.");
    }
    finally{
      setProcessing(false);
    }
  };

  if (loading) return <p>Loading checkout...</p>;
  return (
    <div className="checkout-container">
      
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>
  
      <div className="checkout-summary">
        <h3 className="text-lg font-semibold">Cart Summary</h3>
        <div className="flex justify-between font-medium">
          <span>Items Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>
  
      <div className="checkout-summary">
        <h3 className="text-lg font-semibold">Choose Delivery Company</h3>
        {deliveryCompanies.map((company) => (
          <div key={company.id} className="delivery-company">
            <span className="delivery-company-name">{company.name}</span>
            <div className="delivery-options">
              <button
                className={`delivery-option-btn ${selectedCompany?.companyId === company.id && selectedCompany.type === "standard" ? "selected" : ""}`}
                onClick={() => setSelectedCompany({
                  companyId: company.id,
                  type: "standard",
                  price: company.costs[0],
                })}
              >
                ${company.costs[0]} Standard
              </button>
              <button
                className={`delivery-option-btn ${selectedCompany?.companyId === company.id && selectedCompany.type === "express" ? "selected" : ""}`}
                onClick={() => setSelectedCompany({
                  companyId: company.id,
                  type: "express",
                  price: company.costs[1],
                })}
              >
                ${company.costs[1]} Express
              </button>
            </div>
          </div>
        ))}
      </div>
  
      {selectedCompany && (
        <div className="checkout-payment">
          <h3 className="text-lg font-semibold">Order Summary</h3>
          <div className="checkout-totals">
            <span>Delivery Fee:</span>
            <span>${selectedCompany.price ? selectedCompany.price.toFixed(2) : "0.00"}</span>
          </div>
          <div className="checkout-totals font-semibold text-lg">
            <span>Total:</span>
            <span>${selectedCompany.price ? ((totalPrice + selectedCompany.price).toFixed(2)) : totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}
      <div className="payment-section">
        <h3 className="text-lg font-semibold">Payment Method</h3>
        <input
          type="text"
          placeholder="Card Number"
          value={cardDetails.cardNumber}
          onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
          className="input-field"
          disabled={processing}
        />
        <input
          type="text"
          placeholder="CVV"
          value={cardDetails.cvv}
          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
          className="input-field"
          disabled={processing}
        />
        <input
          type="text"
          placeholder="Expiration Date (MM/YY)"
          value={cardDetails.expirationDate}
          onChange={(e) => setCardDetails({ ...cardDetails, expirationDate: e.target.value })}
          className="input-field"
          disabled={processing}
        />
      </div>

      <button
        disabled={!selectedCompany?.price || !cardDetails.cardNumber || !cardDetails.cvv || !cardDetails.expirationDate || processing}
        onClick={handleSubmit} // Call handleSubmit directly here
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        Place Order
      </button>
      {processing && (
        <div className="overlay">
          <div className="popup">
            <h2>Processing Your Order</h2>
            <p>Please wait patiently while we finalize your order.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
