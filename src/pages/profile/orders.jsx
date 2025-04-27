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
    const [openDialog, setOpenDialog] = useState(false);
    const [unseenCount, setUnseenCount] = useState(0);
    const [INFOuser, setUserinfo] = useState({});
    const [orders, setOrders] = useState([]);
    const [userID, setUserID] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');





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
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const data = await get(`users/${user.uid}`);
                    const userInfo = data[0];
                    setUserID(user.uid);
                    setUserinfo(userInfo);
                    console.log(userInfo);
                } catch (error) {
                    console.error("Error fetching user info:", error);
                }
            } else {
                console.error("No user is logged in.");
            }
        });

        return unsubscribe;
    }, []);


    //const orders = await get("orders", null, [["user", "==", user.uid]]);

    useEffect(() => {
        async function fetchOrders() {
            if (!userID) return;

            try {
                const fetchedOrders = await get("orders", null, [["user", "==", userID]]);
                if (fetchedOrders) {
                    const ordersArray = Object.entries(fetchedOrders).map(([id, order]) => ({
                        id,
                        ...order
                    }));
                    setOrders(ordersArray);
                    console.log(ordersArray);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            }
        }

        fetchOrders();
    }, [userID]);



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
                <h1>{INFOuser[userID]?.firstname ?? "loading"} {INFOuser[userID]?.lastname ?? "loading"}</h1>
                <div className='profile-tabs'>
                    <button onClick={() => navigate('/profile')}>Account</button>
                    <button onClick={() => navigate('/orders')}>Orders</button>
                    <button onClick={() => navigate('/settings')}>Settings</button>
                </div>
                <div className="profile-container">
                    <h2>Orders</h2>
                    <div className="order-filters">
                        <button onClick={() => setSelectedStatus('processing')}>Processing</button>
                        <button onClick={() => setSelectedStatus('in transit')}>In Transit</button>
                        <button onClick={() => setSelectedStatus('delivered')}>Delivered</button>
                    </div>
                    <div className="orders-list">
                        {(() => {
                            const filteredOrders = (selectedStatus === 'All'
                                ? orders
                                : orders.filter(order => {
                                    const orderKey = Object.keys(order)[1];
                                    const orderData = order[orderKey];
                                    return orderData.status?.toLowerCase() === selectedStatus.toLowerCase();
                                })
                            ).sort((a, b) => {
                                const aKey = Object.keys(a)[1];
                                const bKey = Object.keys(b)[1];
                                const aDate = new Date(a[aKey].date);
                                const bDate = new Date(b[bKey].date);
                                return bDate - aDate; // Newest first (descending)
                            });

                            return filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => {
                                    const orderKey = Object.keys(order)[1];
                                    const orderData = order[orderKey];

                                    return (
                                        <div key={order.id} className="order-card">
                                            <h3>Order Number: {parseInt(order.id, 10) + 1}</h3>
                                            <div className="order-info">
                                                <div>
                                                    <p><span>Name:</span> {orderData.firstname} {orderData.lastname}</p>
                                                    <p><span>Status:</span> {orderData.status}</p>
                                                    <p><span>Total Cost:</span> {orderData.totalcost}₺</p>
                                                    <p><span>Date:</span> {new Date(orderData.date).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p><span>Delivery City:</span> {orderData.address?.city ?? 'No Delivery City'}</p>
                                                    <p><span>Billing City:</span> {orderData.billingaddress?.city ?? 'No Billing City'}</p>
                                                    <p><span>Delivery Company:</span> {orderData.delivery?.company ?? 'No Delivery Company'}</p>
                                                    <p><span>Delivery Type:</span> {orderData.delivery?.type ?? 'No Delivery Type'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>No orders found for "{selectedStatus}".</p>
                            );
                        })()}
                    </div>
                </div>

            </main>
        </div>
    );
}

export default Homepage;