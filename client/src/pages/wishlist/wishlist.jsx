import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, set } from '../../services/firebase/database';
import { auth } from '../../services/firebase/connect';
import './wishlist.css';
import logo from '../../assets/teknosuLogo.jpg';

function Wishlist() {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setCurrentUser(user);
                const userDataResponse = await get(`users/${user.uid}`);
                const userData = Array.isArray(userDataResponse)
                ? userDataResponse[0]?.[user.uid]
                : userDataResponse;

                const allProductsData = await get('products');
                const productsObj = Object.assign({}, ...allProductsData);

                const wishlist = userData?.wishlist || [];

                const filteredProducts = wishlist.map((productId) => ({
                    id: productId,
                    ...productsObj[productId],
                }));

                setWishlistItems(filteredProducts);
            } else {
                navigate('/login');
            }
        });

        return unsubscribe;
    }, [navigate]);

    const removeFromWishlist = async (productId) => {
        try {
            const userDataResponse = await get(`users/${currentUser.uid}`);
            const userData = Array.isArray(userDataResponse)
            ? userDataResponse[0]?.[currentUser.uid]
            : userDataResponse;

            const updatedWishlist = userData.wishlist.filter(id => id !== productId);


            const updatedUserData = {
                firstname: userData.firstname,
                lastname: userData.lastname,
                email: userData.email,
                active: userData.active,
                role: userData.role,
                country: userData.address.country,
                city: userData.address.city,
                address: userData.address.address
                ,
                wishlist: updatedWishlist
            };

            await set(`users/${currentUser.uid}`, updatedUserData);
            setWishlistItems(prev => prev.filter(item => item.id !== productId));
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    return (
        <div>
            <div className="app-bar">
                <img
                    src={logo}
                    alt="Logo"
                    className="app-bar-logo"
                    onClick={() => navigate('/')}
                />
            </div>

            <div className="wishlist-container">
                {wishlistItems.length === 0 ? (
                    <p>No products in wishlist.</p>
                ) : (
                    <div className="wishlist-grid">
                        {wishlistItems.map(product => (
                            <div key={product.id} className="wishlist-item">
                                <img src={product.image} alt={product.name} onClick={() => navigate(`/product/${product.id}`)} />
                                <h2>{product.name}</h2>
                                <p>${product.discount > 0
                                    ? (product.price - product.price * product.discount / 100).toFixed(2)
                                    : product.price}</p>
                                <button onClick={() => removeFromWishlist(product.id)}>Remove</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Wishlist;
