import React, { useState, useEffect, use } from 'react';
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
    const [openDialog, setOpenDialog] = useState(false);
    const [unseenCount, setUnseenCount] = useState(0);
    const [INFOuser, setUserinfo] = useState([]);
    const [userID, setUserID] = useState('');
    const [userRole, setUserRole] = useState(null);


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
        if (newSortOption !== 'default') params.set('sort', newSortOption);
        if (newCategory !== 'All') params.set('category', newCategory);

        navigate({
            pathname: '/',
            search: `?${params.toString()}`
        });
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

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            if (user) {
                const userData = await get(`users/${user.uid}`);

                if (userData && Array.isArray(userData) && userData.length > 0) {
                    const userKey = Object.keys(userData[0])[0];
                    const userInfo = userData[0][userKey];

                    if (userInfo && userInfo.role) {
                        setUserRole(userInfo.role);
                    }
                }

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
            else {
                navigate('/login');
            }

        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const Myuser = auth.onAuthStateChanged(async (user) => {
            if (Myuser) {
                const data = await get(`users/${user.uid}`);
                setUserID(user.uid);
                console.log("User ID:", user.uid);

                const values = Object.values(data);
                const userInfo = values[0];
                setUserinfo(userInfo);
                console.log("Full user data:", userInfo);
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
                    {currentUser && userRole && (
                        <div className="role-specific-buttons">
                            {userRole === 'admin' && (
                                <button onClick={() => navigate('/admin')}>👨‍💻 Admin</button>
                            )}
                            {userRole === 'productmanager' && (
                                <button onClick={() => navigate('/productmanager')}>🛒 Product Manager</button>
                            )}
                            {userRole === 'salesmanager' && (
                                <button onClick={() => navigate('/sales')}>💼 Sales Manager</button>
                            )}
                        </div>
                    )}
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


                            <NotificationDialog
                                open={openDialog}
                                onClose={() => setOpenDialog(false)}
                                onSeen={(newUnseenCount) => setUnseenCount(newUnseenCount)}
                            />
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
                <h2>{INFOuser[userID]?.firstname ?? "loading"} {INFOuser[userID]?.lastname ?? "loading"}</h2>
                <div className='profile-tabs'>
                    <button onClick={() => navigate('/profile')}>Account</button>
                    <button onClick={() => navigate('/orders')}>Orders</button>
                    <button onClick={() => navigate('/settings')}>Settings</button>
                </div>
                <div className="profile-container">
                    <div className='names'>
                        <div className='input-group'>
                            <h3>Email </h3>
                            <input
                                type="text"
                                value={INFOuser[userID]?.email || "loading"}
                                disabled
                            />
                        </div>
                        <div className='input-group'>
                            <h3>Account Status</h3>
                            <input
                                type="text"
                                value={INFOuser[userID]?.active ? "Active" : "Inactive"}
                                disabled
                            />
                        </div>
                        <div className='input-group'>
                            <h3>Adress </h3>
                            <input
                                type="text"
                                value={INFOuser[userID]?.address.address || "loading"}
                                disabled
                            />
                        </div>
                        <div className='input-group'>
                            <h3>City</h3>
                            <input
                                type="text"
                                value={INFOuser[userID]?.address.city}
                                disabled
                            />
                        </div>
                        <div className='input-group'>
                            <h3>Country</h3>
                            <input
                                type="text"
                                value={INFOuser[userID]?.address.country}
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