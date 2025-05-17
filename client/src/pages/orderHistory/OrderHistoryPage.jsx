
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrderHistory } from '../../services/firebase/api'; // API helper to fetch order history
import './OrderHistoryPage.css'; // Add CSS file for styling

const OrderHistoryPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await getOrderHistory();  // Fetch orders for the user
                setOrders(response.orders);
                setLoading(false);
            } catch (error) {
                setError('Failed to fetch orders');
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    function handleViewOrder(orderID) {
        navigate(`/order/${orderID}`); // Navigate to the OrderDetailPage
    }

    return (
        <div className="order-history-container">
            <h1>Your Order History</h1>
            {orders.length === 0 ? (
                <p>You have no orders yet.</p>
            ) : (
                <ul className="order-list">
                    {orders.map((order) => (
                        <li key={order.orderID} className="order-item">
                            <div className="order-item-details">
                                <h2>Order ID: {order.orderID}</h2>
                                <p>Status: {order.status}</p>
                                <p>Total: ${order.totalcost}</p>
                                <p>Ordered on: {new Date(order.date).toLocaleDateString()}</p>
                                <button className="view-order-details" onClick={() => handleViewOrder(order.orderID)}>
                                    View Details
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default OrderHistoryPage;
