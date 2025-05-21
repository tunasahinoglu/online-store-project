import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../../assets/teknosuLogo.jpg';
import { useCart } from '../../pages/cart/cart_context';
import { auth, database } from "../../services/firebase/connect.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { get, set, add } from '../../services/firebase/database.js';
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
    const [requests, setRequests] = useState([]);
    const [userID, setUserID] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [modalOrder, setModalOrder] = useState(null);
    const [orderData1, setOrderData] = useState(null);
    const [ordernum, setOrderNum] = useState(null);



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

    const handleCancelOrder = async (orderId) => {
        try {
            const response = await set(`orders/${orderId}`, { status: "cancelled" })
            console.log(response);

            console.log(`Order ${orderId} cancelled successfully.`);
            alert('Your order has been cancelled successfully');
            window.location.reload();
        } catch (error) {
            alert('Your order cannot be cancelled');
            console.error('Error cancelling order:', error);
        }
    };

    const [deliveryCompanies, setDeliveryCompanies] = useState({});

    useEffect(() => {
        async function fetchDeliveryCompanies() {
            try {
                const companiesData = await get('deliverycompanies');
                setDeliveryCompanies(companiesData);
                console.log("Delivery companies fetched:", companiesData);
            } catch (error) {
                console.error("Error fetching delivery companies:", error);
            }
        }

        fetchDeliveryCompanies();
    }, []);


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

            try {
                const fetchedRequests = await get("requests", null, [["user", "==", userID]])
                if (fetchedRequests) {
                    const requestsArray = Object.entries(fetchedRequests).map(([id, request]) => ({
                        id,
                        ...request
                    }));
                    setRequests(requestsArray);
                    console.log(requestsArray);
                }
            } catch (error) {
                console.error('Error fetching requests:', error)
            }
        }

        fetchOrders();
    }, [userID]);



    function OrderDetailsModal({ order, onClose, deliveryCompanies }) {
        if (!order) return null;
        const orderKey = Object.keys(order)[1];
        setOrderNum(orderKey);
        console.log("order key", orderKey);
        const orderData = order[orderKey];
        setOrderData(orderData);
        const deliveryCompanyId = orderData.delivery?.company;

        // deliveryCompanies may be an object or array, normalize to object
        let companiesObj = deliveryCompanies;
        if (Array.isArray(deliveryCompanies)) {
            companiesObj = {};
            deliveryCompanies.forEach(obj => {
                const id = Object.keys(obj)[0];
                companiesObj[id] = obj[id];
            });
        }

        let deliveryCompanyName = 'Unknown Company';
        if (companiesObj && deliveryCompanyId && companiesObj[deliveryCompanyId]?.name) {
            deliveryCompanyName = companiesObj[deliveryCompanyId].name;
        }

        let refundAvailable = false;
        if (orderData.date && orderData.deliverydate) {
            const orderDate = new Date();
            const deliveryDate = new Date(orderData.deliverydate);
            console.log("delivery date", deliveryDate);
            const diffDays = Math.floor((orderDate - deliveryDate) / (1000 * 60 * 60 * 24));
            console.log("diff days", diffDays);
            refundAvailable = diffDays <= 30 && !(requests?.some(req => Object.values(req).some(entry => entry.order === orderKey)));
        }

        const handleRefund = async () => {
            try {
                await add("requests", { request: "refund", order: ordernum })
                alert('Refund requested!');
                window.location.reload();
            } catch (error) {
                console.error('Error sending refund request:', error);
                alert('Error requesting refund.');
            }
        };

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>X</button>
                    <h3>Order Number: {orderKey}</h3>
                    <div>
                        <p><span>Name: </span> {orderData.firstname} {orderData.lastname}</p>
                        <p><span>Status: </span> {orderData.status}</p>
                        <p><span>Total Cost: </span> {orderData.totaldiscountedcost}$</p>
                        <p><span>Order Date: </span> {new Date(orderData.date).toLocaleString()}</p>
                        {orderData.deliverydate && (
                            <p><span>Delivery Date: </span> {new Date(orderData.deliverydate).toLocaleString()}</p>
                        )}
                        <p><span>Delivery Address: </span> {orderData.address ? `${orderData.address.address ?? ''}, ${orderData.address.city ?? ''}, ${orderData.address.country ?? ''}` : 'No Delivery Address'}</p>
                        <p><span>Billing Address: </span> {orderData.billingaddress ? `${orderData.billingaddress.address ?? ''}, ${orderData.billingaddress.city ?? ''}, ${orderData.billingaddress.country ?? ''}` : 'No Billing Address'}</p>
                        <p><span>Delivery Company: </span>{orderData.delivery?.name ?? 'No Delivery Company Name'}</p>
                        <p><span>Delivery Type:</span> {orderData.delivery?.type ?? 'No Delivery Type'}</p>
                        {/* Removed Items Bought section */}
                        {orderData.status?.toLowerCase() === 'processing' && (
                            <button
                                className="cancel-order-button"
                                style={{
                                    backgroundColor: 'red',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5em 1em',
                                    borderRadius: '4px',
                                    marginTop: '1em',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    onClose();
                                    handleCancelOrder(orderKey);
                                }}
                            >
                                Cancel Order
                            </button>
                        )}
                        {/* Refund button, only if 30 days between order and delivery */}
                        {refundAvailable && (
                            <button
                                className="refund-order-button"
                                style={{
                                    backgroundColor: 'black',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5em 1em',
                                    borderRadius: '4px',
                                    marginTop: '1em',
                                    marginLeft: '1em',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    onClose();
                                    handleRefund();
                                }}
                            >
                                Request Refund
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

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
                </div>
                <div className="order-container">
                    <h2>Orders</h2>
                    <div className="order-filters">
                        <button onClick={() => setSelectedStatus('All')}>All</button>
                        <button onClick={() => setSelectedStatus('processing')}>Processing</button>
                        <button onClick={() => setSelectedStatus('in-transit')}>In-Transit</button>
                        <button onClick={() => setSelectedStatus('delivered')}>Delivered</button>
                        <button onClick={() => setSelectedStatus('cancelled')}>Cancelled</button>
                        <button onClick={() => setSelectedStatus('refunded')}>Refunded</button>

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
                                return bDate - aDate;
                            });

                            return filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => {
                                    const orderKey = Object.keys(order)[1];
                                    const orderData = order[orderKey];
                                    return (
                                        <div
                                            key={order.id}
                                            className="order-card"
                                            onClick={() => setModalOrder(order)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <h3>Order Number: {orderKey}</h3>
                                            <div className="order-info">
                                                <div>
                                                    <p><span>Status: </span> {orderData.status}</p>
                                                    <p><span>Total Cost: </span> {orderData.totaldiscountedcost}₺</p>
                                                    <p><span>Date: </span> {new Date(orderData.date).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>
                                    {selectedStatus === 'All'
                                        ? 'No orders found.'
                                        : `No orders found for "${selectedStatus}".`}
                                </p>
                            );
                        })()}
                        <OrderDetailsModal
                            order={modalOrder}
                            onClose={() => setModalOrder(null)}
                            deliveryCompanies={deliveryCompanies}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Homepage;