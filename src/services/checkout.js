import { useNavigate } from 'react-router-dom';


export const handleCheckout = async () => {
    const navigate = useNavigate();
    const token = await auth.currentUser.getIdToken(); // Firebase auth
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        },
        body: JSON.stringify({
          delivery: {
            type: selectedDeliveryType, // "standard" or "express"
            company: selectedDeliveryCompanyId
          },
          notes: userNotes // optional
        })
      });
  
      const data = await res.json();
      if (res.ok) {
        alert("Order placed!");
        navigate("/orders"); // or show confirmation page
      } else {
        alert("Failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  };