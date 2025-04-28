import React, { useState, useEffect, use } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../../assets/teknosuLogo.jpg';
import { useCart } from '../../pages/cart/cart_context';
import { auth, database } from "../../services/firebase/connect.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { get, set } from '../../services/firebase/database.js';
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
    const [FirstnameSave, setFirstnameSave] = useState('');
    const [LastnameSave, setLastnameSave] = useState('');
    const [CountrySave, setCountrySave] = useState('');
    const [CitySave, setCitySave] = useState('');
    const [AddressSave, setAddressSave] = useState('');



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

    const handleSave = async () => {
        if (!currentUser || !userID) return;
        try {
            await set(`users/${userID}`, { firstname: FirstnameSave, lastname: LastnameSave, country: CountrySave, city: CitySave, address: AddressSave, wishlist: [] })
            alert('Address saved successfully!');
        } catch (error) {
            console.error('Error saving address:', error);
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
                    {INFOuser[userID]?.role === 'salesmanager' && (
                        <button onClick={() => navigate('/sales')}>Sales Page</button>
                    )}
                    {INFOuser[userID]?.role === 'productmanager' && (
                        <button onClick={() => navigate('/productmanager')}>Product Page</button>
                    )}
                    {INFOuser[userID]?.role === 'admin' && (
                        <button onClick={() => navigate('/admin')}>Admin Page</button>
                    )}
                </div>
                <div className="profile-container">
                    <div className='names'>
                        <div className='input-group'>
                            <h3>First Name </h3>
                            <input
                                type="text"
                                placeholder={INFOuser[userID]?.firstname || "loading"}
                                onChange={(e) => setFirstnameSave(e.target.value)}
                                className="disabled-input"
                            />
                        </div>
                        <div className='input-group'>
                            <h3>Last Name </h3>
                            <input
                                type="text"
                                placeholder={INFOuser[userID]?.lastname || "loading"}
                                onChange={(e) => setLastnameSave(e.target.value)}
                                className="disabled-input"
                            />
                        </div>
                        <div className='input-group'>
                            <h3>Country</h3>
                            <input
                                type="text"
                                placeholder={INFOuser[userID]?.address.country || "loading"}
                                onChange={(e) => setCountrySave(e.target.value)}
                                className="disabled-input"
                            />
                        </div>
                        <div className='input-group'>
                            <h3>City</h3>
                            <input
                                type="text"
                                placeholder={INFOuser[userID]?.address.city}
                                onChange={(e) => setCitySave(e.target.value)}
                                className="disabled-input"
                            />
                        </div>
                        <div className='input-group'>
                            <h3>Address</h3>
                            <input
                                type="text"
                                placeholder={INFOuser[userID]?.address.address || "loading"}
                                onChange={(e) => setAddressSave(e.target.value)}
                                className="disabled-input"
                            />
                        </div>
                        <button onClick={handleSave} className="save-button">
                            Save
                        </button>

                    </div>

                </div>

            </main>
        </div>
    );
}

export default Homepage;