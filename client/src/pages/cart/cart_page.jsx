import React, { useState, useEffect } from 'react';
import './cart_page.css';
import { useCart } from '../../pages/cart/cart_context';
import { useNavigate } from 'react-router-dom';
import { auth } from "../../services/firebase/connect.js";
import logo from '../../assets/teknosuLogo.jpg';
import { get, basketCheck } from '../../services/firebase/database.js';

const Cart = () => {
    const { cart, removeFromCart, clearCart, addToCart, isInitialized } = useCart();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [latestCart, setLatestCart] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const fetchLatestProducts = async () => {
            if (cart.length === 0) {
                setLatestCart([]);
                return;
            }

            try {
                const productIds = cart.map(item => item.id);
                const productsResponse = await get('products', null, [
                    ['__name__', 'in', productIds]
                ]);

                const mergedCart = cart.map(item => {
                    const productData = productsResponse.find(p => item.id in p)?.[item.id];
                    return productData ? {
                        ...item,
                        name: productData.name,
                        price: productData.price,
                        image: productData.image,
                        discount: productData.discount,
                        stock: productData.stock
                    } : null;
                }).filter(Boolean);

                setLatestCart(mergedCart);
            } catch (error) {
                console.error('Error fetching latest products:', error);
            }
        };

        fetchLatestProducts();
    }, [cart]);

    const calculatePrice = (product) => {
        if (product.discount && product.discount > 0) {
            return product.price * (1 - product.discount / 100);
        }
        return product.price;
    };

    const totalPrice = latestCart.reduce((sum, product) => {
        return sum + (calculatePrice(product) * product.quantity);
    }, 0);

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
                    {latestCart.length > 0 && (
                        <button
                            onClick={handleClearCart}
                            className="cart-clear-btn"
                            disabled={loading}
                        >
                            {loading ? 'Clearing...' : 'Clear Cart'}
                        </button>
                    )}
                </div>

                {latestCart.length === 0 ? (
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
                            {latestCart.map((product) => (
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
                                            <div className="price-container">
                                                {product.discount > 0 && (
                                                    <>
                                                        <span className="original-price">
                                                            ${product.price.toFixed(2)}
                                                        </span>
                                                        <span className="discount-percentage">
                                                            -{product.discount}%
                                                        </span>
                                                    </>
                                                )}
                                                <p className={`cart-item-price ${product.discount > 0 ? 'discounted' : ''}`}>
                                                    ${calculatePrice(product).toFixed(2)}
                                                </p>
                                            </div>
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
                                            disabled={loading || product.quantity >= product.stock}
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
                                <span>Subtotal ({latestCart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                <span>${latestCart.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}</span>
                            </div>

                            {(() => {
                                const originalSubtotal = latestCart.reduce((sum, p) => sum + (p.price * p.quantity), 0);
                                const discountedTotal = latestCart.reduce((sum, p) => sum + (calculatePrice(p) * p.quantity), 0);
                                const totalDiscount = originalSubtotal - discountedTotal;
                                const discountPercentage = (totalDiscount / originalSubtotal * 100).toFixed(1);

                                return totalDiscount > 0 && (
                                    <>
                                        <div className="cart-summary-row discount">
                                            <span>Total Discount</span>
                                            <span className="discount-text">-${totalDiscount.toFixed(2)}</span>
                                        </div>
                                        <div className="cart-summary-row discount-percent">
                                            <span>You Saved</span>
                                            <span className="discount-percent-text">
                                                {discountPercentage}%
                                            </span>
                                        </div>
                                    </>
                                );
                            })()}

                            <div className="cart-summary-row total">
                                <span>Total</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>

                            <button
                                className="cart-buy-btn"
                                onClick={async () => {
                                    if (!currentUser) {
                                        alert("Please login to proceed to payment.");
                                        navigate('/login');
                                        return;
                                    }

                                    try {
                                        const basket = await basketCheck(`users/${currentUser.uid}/basket-check`);
                                        if (basket === "Invalid") {
                                            return;
                                        }

                                        navigate('/payment');
                                    } catch (error) {
                                        console.error("Error fetching user or basket data:", error);
                                        alert("An error occurred while fetching data.");
                                    }
                                }}
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

