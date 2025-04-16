import React, { useState, useEffect } from 'react';
import './cart_page.css';
import { useCart } from '../../pages/cart/cart_context';
import { useNavigate } from 'react-router-dom';
import { auth } from "../../services/firebase/connect.js";
import logo from '../../assets/TeknosaLogo.png';

const Cart = () => {
    const { cart, removeFromCart, clearCart, addToCart, isInitialized } = useCart();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const totalPrice = cart.reduce((sum, product) => sum + (product.price * product.quantity), 0);

    const handleClearCart = async () => {
        setLoading(true);
        try {
            await clearCart();
        } catch (error) {
            console.error("Error clearing cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromCart = async (productId) => {
        setLoading(true);
        try {
            await removeFromCart(productId);
        } catch (error) {
            console.error("Error removing item:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (product) => {
        setLoading(true);
        try {
            await addToCart(product);
        } catch (error) {
            console.error("Error adding item:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isInitialized || loading) {
        return (
            <div className="cart-loading-overlay">
                <div className="cart-loading-spinner"></div>
                <p>Loading your cart...</p>
            </div>
        );
    }

    return (
        <div> <div className="app-bar">
            <img
                src={logo}
                alt="Logo"
                className="app-bar-logo"
                onClick={() => navigate('/')}
            />
        </div>
            <div className="cart-page-container">

                <div className="cart-header">
                    <h1>Shopping Cart</h1>
                    {cart.length > 0 && (
                        <button
                            onClick={handleClearCart}
                            className="cart-clear-btn"
                            disabled={loading}
                        >
                            {loading ? 'Clearing...' : 'Clear Cart'}
                        </button>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div className="cart-empty">
                        <div className="cart-empty-icon">🛒</div>
                        <h2>Your cart is empty</h2>
                        <button
                            onClick={() => navigate('/')}
                            className="cart-continue-shopping-btn"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="cart-content">
                        <div className="cart-items-container">
                            {cart.map((product) => (
                                <div key={`${product.id}-${product.quantity}`} className="cart-item">
                                    <div className="cart-item-info" onClick={() => navigate(`/product/${product.id}`)}>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="cart-item-image"
                                            onError={(e) => e.target.src = '/default-product.png'}
                                        />
                                        <div className="cart-item-details">
                                            <h3 className="cart-item-name">{product.name}</h3>
                                            <p className="cart-item-price">${product.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="cart-quantity-selector">
                                        <button
                                            className="cart-quantity-btn decrease"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFromCart(product.id);
                                            }}
                                            disabled={loading}
                                        >
                                            −
                                        </button>
                                        <span className="cart-quantity-value">{product.quantity}</span>
                                        <button
                                            className="cart-quantity-btn increase"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToCart(product);
                                            }}
                                            disabled={loading}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-order-summary">
                            <h3>Order Summary</h3>
                            <div className="cart-summary-row">
                                <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>

                            <div className="cart-summary-row total">
                                <span>Total</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            <button
                                className="cart-buy-btn"
                                onClick={() => navigate('/payment')}
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cart;