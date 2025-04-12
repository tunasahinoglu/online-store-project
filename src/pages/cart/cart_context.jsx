import React, { useState, useEffect, createContext, useContext } from 'react';
import { add, set, get, del } from '../../services/firebase/database.js';
import { auth } from '../../services/firebase/connect.js';

const CART_LOCAL_STORAGE_KEY = 'guest_cart';
const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            try {
                if (user) {
                    await loadUserCart(user.uid);
                    await mergeGuestCart(user.uid);
                } else {
                    await loadGuestCart(); 
                }
            } catch (error) {
                console.error("Error initializing cart:", error);
            } finally {
                setIsInitialized(true); 
            }
        });
        return unsubscribe;
    }, []);

    const loadUserCart = async (userId) => {
        try {
            const basketData = await get(`users/${userId}/basket`);
            if (!basketData || basketData.length === 0) {
                setCart([]);
                return [];
            }
    
            const productIds = basketData.map(doc => Object.keys(doc)[0]);
    
            const productsResponse = await get('products', null, [
                ['__name__', 'in', productIds]
            ]);
    
            const mergedCart = basketData.map(basketDoc => {
                const productId = Object.keys(basketDoc)[0];
                const quantity = basketDoc[productId].count;
                
                const productInfo = productsResponse.find(p => p[productId])?.[productId];
                
                return productInfo ? {
                    id: productId,
                    quantity: quantity,
                    name: productInfo.name,
                    price: productInfo.price,
                    image: productInfo.image
                } : null;
            }).filter(Boolean);
    
            setCart(mergedCart);
            return mergedCart;
        } catch (error) {
            console.error("Error loading user cart:", error);
            setCart([]);
            return [];
        }
    };

    const loadGuestCart = async () => {
        const savedCart = localStorage.getItem(CART_LOCAL_STORAGE_KEY);
        if (!savedCart) {
            setCart([]);
            return;
        }
    
        const guestCart = JSON.parse(savedCart);
        if (guestCart.length === 0) {
            setCart([]);
            return;
        }
    
        try {
            const productIds = guestCart.map(item => item.id);
            const productsResponse = await get('products', null, [
                ['__name__', 'in', productIds]
            ]);
    
            const mergedCart = guestCart.map(item => {
                const productInfo = productsResponse.find(p => p[item.id])?.[item.id];
                return productInfo ? {
                    ...item,
                    name: productInfo.name,
                    price: productInfo.price,
                    image: productInfo.image
                } : null;
            }).filter(Boolean);
    
            setCart(mergedCart);
        } catch (error) {
            console.error("Error loading guest cart:", error);
            setCart([]);
        }
    };

    const mergeGuestCart = async (userId) => {
        const guestCart = JSON.parse(localStorage.getItem(CART_LOCAL_STORAGE_KEY)) || [];
        if (guestCart.length === 0) return;

        try {
            for (const item of guestCart) {
                await set(`users/${userId}/basket/${item.id}`, {
                    count: item.quantity,
                    name: item.name,
                    price: item.price,
                    image: item.image
                });
            }

            setCart(prevCart => {
                const mergedCart = [...prevCart];
                guestCart.forEach(guestItem => {
                    const existingItem = mergedCart.find(item => item.id === guestItem.id);
                    if (existingItem) {
                        existingItem.quantity += guestItem.quantity;
                    } else {
                        mergedCart.push(guestItem);
                    }
                });
                return mergedCart;
            });

            localStorage.removeItem(CART_LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error("Error merging carts:", error);
        }
    };

    const addToCart = async (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            const newCart = existingItem
                ? prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
                : [...prevCart, {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                }];
            
            if (currentUser) {
                set(`users/${currentUser.uid}/basket/${product.id}`, {
                    count: existingItem ? existingItem.quantity + 1 : 1,
                    name: product.name,
                    price: product.price,
                    image: product.image
                }).catch(console.error);
            } else {
                localStorage.setItem(CART_LOCAL_STORAGE_KEY, JSON.stringify(newCart));
            }
            
            return newCart;
        });
    };

    const removeFromCart = async (productId) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === productId);
            let newCart;
            
            if (existingItem && existingItem.quantity > 1) {
                newCart = prevCart.map(item =>
                    item.id === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
                
                if (currentUser) {
                    set(`users/${currentUser.uid}/basket/${productId}`, {
                        count: existingItem.quantity - 1,
                        name: existingItem.name,
                        price: existingItem.price,
                        image: existingItem.image
                    }).catch(console.error);
                }
            } else {
                newCart = prevCart.filter(item => item.id !== productId);
                
                if (currentUser) {
                    del(`users/${currentUser.uid}/basket/${productId}`).catch(console.error);
                }
            }
            
            if (!currentUser) {
                localStorage.setItem(CART_LOCAL_STORAGE_KEY, JSON.stringify(newCart));
            }
            
            return newCart;
        });
    };

    const clearCart = async () => {
        if (currentUser) {
            for (const item of cart) {
                try {
                    await del(`users/${currentUser.uid}/basket/${item.id}`);
                } catch (error) {
                    console.error(`Error deleting item ${item.id}:`, error);
                }
            }
        } else {
            localStorage.removeItem(CART_LOCAL_STORAGE_KEY);
        }
        setCart([]);
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            isInitialized
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('Error');
    }
    return context;
};