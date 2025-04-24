import { add } from "./firebase/database.js"

export const handleCheckout = async ({ cart, selectedDeliveryCompany, selectedDeliveryType, notes, navigate }) => {
  const token = await auth.currentUser.getIdToken(); // Firebase auth
  try {
    const res = add("orders" , 
      {
        cart, // Pass the cart as part of the request body
        delivery: {
          type: selectedDeliveryType, // "standard" or "express"
          company: selectedDeliveryCompany,
        },
        notes: notes || null,
      });

    // Check if the response is valid JSON
    const data = await res.json().catch(() => null);

    if (res.ok && data) {
      alert("Order placed!");
      navigate("/orders");
    } else {
      alert("Failed: " + (data?.message || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
};

