
import { get } from './database'; // Assuming you are using Firebase helper for data fetching

// Fetch order history for the logged-in user
export const getOrderHistory = async () => {
    const response = await get('orders'); // Fetch orders for the logged-in user
    return response;  // This should return orders in the correct format for the UI
};

// Fetch order details by orderID
export const getOrderDetails = async (orderID) => {
    const response = await get(`orders/${orderID}`);  // Fetch specific order details
    return response;  // Return order details
};
