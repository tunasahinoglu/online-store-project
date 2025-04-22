import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

export const handleCheckout = async ({ cart, selectedDeliveryCompany, selectedDeliveryType, notes, navigate }) => {
  const auth = getAuth(); // Get Firebase auth instance
  const token = await auth.currentUser.getIdToken(); // Firebase auth
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        cart, // Pass the cart as part of the request body
        delivery: {
          type: selectedDeliveryType, // "standard" or "express"
          company: selectedDeliveryCompany,
        },
        notes: notes || null,
      }),
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

