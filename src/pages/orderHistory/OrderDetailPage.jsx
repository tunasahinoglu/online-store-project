
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderDetails } from '../../services/firebase/api';  // API helper to fetch order details
import './OrderDetailPage.css';  // Add CSS file for styling

const OrderDetailPage = () => {
    const { orderID } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await getOrderDetails(orderID); // Fetch order details
                setOrder(response.order);
                setLoading(false);
            } catch (error) {
                setError('Failed to fetch order details');
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [orderID]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="order-detail-container">
            <h1>Order Details</h1>
            <div className="order-detail">
                <p><strong>Order ID:</strong> {order.orderID}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Total:</strong> ${order.totalcost}</p>
                <p><strong>Order Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                <h2>Products</h2>
                <ul>
                    {order.products.map((product) => (
                        <li key={product.productID}>
                            <p><strong>{product.name}</strong></p>
                            <p>Price: ${product.price}</p>
                            <p>Quantity: {product.count}</p>
                        </li>
                    ))}
                </ul>
                <h2>Shipping Address</h2>
                <p>{order.address.country}, {order.address.city}, {order.address.address}</p>
            </div>
        </div>
    );
};

export default OrderDetailPage;
