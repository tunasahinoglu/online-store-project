import { add } from "./firebase/database.js"
import { auth } from "./firebase/connect.js";

export const handleCheckout = async ({ cart, selectedDeliveryCompany, selectedDeliveryType, notes, navigate }) => {
  const token = await auth.currentUser.getIdToken(); // Firebase auth
  try {
    const message = await add("orders" , 
      {
        cart, // Pass the cart as part of the request body
        delivery: {
          type: selectedDeliveryType, // "standard" or "express"
          company: selectedDeliveryCompany,
        },
        notes: notes || null,
      });


    if (message=="Successfully added") {
      alert("Order placed!");
      navigate("/orders");
    } else {
      alert("Failed: " + message);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
};

