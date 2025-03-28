import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    const addToCart = (product) => {
        const uniqueId = `${product.id}-${Date.now()}`; 
        setCart([...cart, { ...product, uniqueId }]); 
    };

    const removeFromCart = (uniqueId) => {
        setCart(cart.filter(item => item.uniqueId !== uniqueId));
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);