import React from 'react';
import './cart_page.css';
import { useCart } from '../../pages/cart/cart_context';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
    const { cart, removeFromCart, clearCart } = useCart();
    const totalPrice = cart.reduce((sum, product) => sum + product.price, 0);
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
                            <div key={index} className="cart-item" onClick={() => navigate(`/product/${product.id}`)} >
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="cart-item-image"
                                />
                                <div className="cart-item-details">
                                    <h3>{product.name}</h3>
                                    <p>${product.price.toFixed(2)}</p>
                                </div>
                                <button
                                    className="remove-button"
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        removeFromCart(product.uniqueId);
                                    }}
                                >
                                    Remove
                                </button>
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