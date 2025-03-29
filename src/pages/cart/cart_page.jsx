import React from 'react';
import './cart_page.css';
import { useCart } from '../../pages/cart/cart_context';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
    const { cart, removeFromCart, clearCart, addToCart } = useCart();
    const totalPrice = cart.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const navigate = useNavigate();

    return (
        <div className="cart">
            <h2>Shopping Cart</h2>
            {cart.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    <div className="cart-items">
                        {cart.map((product, index) => (
                            <div key={index} className="cart-item">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="cart-item-image"
                                    onClick={() => navigate(`/product/${product.id}`)}
                                />
                                <div className="cart-item-details" onClick={() => navigate(`/product/${product.id}`)}>
                                    <h3>{product.name}</h3>
                                    <p>${product.price.toFixed(2)}</p>
                                </div>
                                <div className="quantity-controls">
                                    <button
                                        className="quantity-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromCart(product.id);
                                        }}
                                    >
                                        -
                                    </button>
                                    <span className="quantity">{product.quantity}</span>
                                    <button
                                        className="quantity-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(product);
                                        }}
                                    >
                                        +
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <h3>Total: ${totalPrice.toFixed(2)}</h3>
                        <button className="clear-button" onClick={clearCart}>
                            Clear Cart
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;