import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../../assets/teknosuLogo.jpg';
import { useCart } from '../../pages/cart/cart_context';
import { auth, database } from "../../services/firebase/connect.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { get } from '../../services/firebase/database.js';
import NotificationDialog from '../../pages/notification/notification_dialog.jsx';
import './profilepage.css';

function Homepage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('default');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { cart, addToCart } = useCart();
    const [currentUser, setCurrentUser] = useState(null);
    const [firestoreProducts, setFirestoreProducts] = useState({});
    const [dynamicCategories, setDynamicCategories] = useState(['All']);
    const [openDialog, setOpenDialog] = useState(false);
    const [unseenCount, setUnseenCount] = useState(0);
    const [INFOuser, setUserinfo] = useState({});



    useEffect(() => {
        const search = searchParams.get('search') || '';
        const sort = searchParams.get('sort') || 'default';
        const category = searchParams.get('category') || 'All';

        setSearchTerm(search);
        setSortOption(sort);
        setSelectedCategory(category);
    }, [searchParams]);

    const updateURLParams = (newSearchTerm = searchTerm, newSortOption = sortOption, newCategory = selectedCategory) => {
        const params = new URLSearchParams();
        if (newSearchTerm.trim()) params.set('search', newSearchTerm.trim());
        else params.delete('search');

        if (newSortOption !== 'default') params.set('sort', newSortOption);
        else params.delete('sort');

        if (newCategory !== 'All') params.set('category', newCategory);
        else params.delete('category');

        setSearchParams(params);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const trimmedSearch = searchTerm.trim();
        setSelectedCategory('All');
        if (trimmedSearch) {
            updateURLParams(trimmedSearch, sortOption, 'All');
        } else {
            if (searchParams.get('search')) {
                updateURLParams('', sortOption, 'All');
            }
        }
    };

    const handleSortChange = (e) => {
        const newSortOption = e.target.value;
        setSortOption(newSortOption);
        updateURLParams(searchTerm, newSortOption);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setSearchTerm('');
        updateURLParams('', sortOption, category);
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            if (user) {
                const data = await get(`users/${user.uid}/notifications`);

                let merged = {};
                if (Array.isArray(data)) {
                    data.forEach(obj => {
                        if (typeof obj === 'object') {
                            merged = { ...merged, ...obj };
                        }
                    });
                } else {
                    merged = data;
                }

                const notificationsArray = Object.entries(merged || {}).map(([id, notif]) => ({
                    id,
                    ...notif,
                }));

                const unseen = notificationsArray.filter(notif => !notif.seen);
                setUnseenCount(unseen.length);
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const Myuser = auth.onAuthStateChanged(async (user) => {
            if (Myuser) {
                const data = await get(`users/${user.uid}`);
                console.log("Full user data:", data);

                const values = Object.values(data);
                const userInfo = values[0];
                setUserinfo(userInfo);
                console.log('userinfo', userInfo.undefined.firstname); // Debugging line
            }
        });
        return Myuser;
    }, []);


    return (
        <div className="homepage">
            <header className="app-bar">
                <img
                    src={logo}
                    alt="Logo"
                    className="app-bar-logo"
                    onClick={() => navigate('/')}
                />

                <div className="search-and-sort">
                    <form className="search-bar" onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            placeholder="Search products"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                    <div className="sort-options">
                        <select value={sortOption} onChange={handleSortChange}>
                            <option value="default">Default</option>
                            <option value="priceHighToLow">High to Low</option>
                            <option value="priceLowToHigh">Low to High</option>
                            <option value="popularity">Popular</option>
                        </select>
                    </div>
                </div>

                <div className="header-actions">
                    {currentUser ? (
                        <div className="user-actions">
                            <div className="wishlist-icon" onClick={() => navigate('/wishlist')}>
                                ❤️
                            </div>
                        </div>
                    ) : null}
                    <div className="cart-icon" onClick={() => navigate('/cart')}>
                        🛒
                        <span>{cart.reduce((total, product) => total + product.quantity, 0)}</span>
                    </div>
                    {currentUser ? (
                        <div className="user-actions">
                            <div className="notification-icon" onClick={() => setOpenDialog(true)}>
                                <span role="img" aria-label="bell" className="notification-bell-icon">
                                    🔔
                                </span>
                                {unseenCount > 0 && (
                                    <span className="notification-count">{unseenCount}</span>
                                )}
                            </div>


                            <NotificationDialog open={openDialog} onClose={() => setOpenDialog(false)} />
                            <button
                                className="profile-button"
                                onClick={() => navigate('/profile')}
                            >
                                👤 {currentUser.email}
                            </button>
                            <button
                                className="logout-button"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => navigate('/login')}>Login/Register</button>
                    )}
                </div>
            </header>

            <main className="main-content2">
                <h1>{INFOuser?.undefined?.firstname || "loading"}  {INFOuser?.undefined?.lastname || "loading"}</h1>
                <div className='profile-tabs'>
                    <button onClick={() => navigate('/profile')}>Account</button>
                    <button onClick={() => navigate('/orders')}>Orders</button>
                    <button onClick={() => navigate('/settings')}>Settings</button>
                </div>
                <div className="profile-container">
                    <div className='names'>
                        <div className='input-group'>
                            <h3>Adress </h3>
                            <input
                                type="text"
                                value={INFOuser?.undefined?.address.address || "loading"}
                                disabled
                            />
                        </div>
                        <div className='input-group'>
                            <h3>Email </h3>
                            <input
                                type="text"
                                value={INFOuser?.undefined?.email || "loading"}
                                disabled
                            />
                        </div>
                        <div className='input-group'>
                            <h3>Account Status</h3>
                            <input
                                type="text"
                                value={INFOuser?.undefined?.active ? "Active" : "Inactive"}
                                disabled
                            />
                        </div>
                        <div className='input-group'>
                            <h3>City</h3>
                            <input
                                type="text"
                                value={INFOuser?.undefined?.address.city}
                                disabled
                            />
                        </div>
                        <div className='input-group'>
                            <h3>Country</h3>
                            <input
                                type="text"
                                value={INFOuser?.undefined?.address.country}
                                disabled
                            />
                        </div>
                        
                    </div>

                </div>

            </main>
        </div>
    );
}

export default Homepage;