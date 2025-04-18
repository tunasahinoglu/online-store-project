import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './product_detail.css';
import { useCart } from '../../pages/cart/cart_context';
import logo from '../../assets/teknosuLogo.jpg';
import { get, set, add } from '../../services/firebase/database';
import { auth, database } from "../../services/firebase/connect.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import NotificationDialog from '../../pages/notification/notification_dialog.jsx';


function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cart, addToCart } = useCart();
    const [currentUser, setCurrentUser] = useState(null);
    const [product, setProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [dynamicCategories, setDynamicCategories] = useState(['All']);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [unseenCount, setUnseenCount] = useState(0);
    const [comments, setComments] = useState([]);
    const [userComment, setUserComment] = useState('');
    const [userRating, setUserRating] = useState(5);
    const [hasPurchasedAndDelivered, setHasPurchasedAndDelivered] = useState(false);
    const [matchedOrderId, setMatchedOrderId] = useState(null);


    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const productsData = await get('products');

                const productsObj = Object.assign({}, ...productsData);

                const allCategories = new Set(['All']);

                Object.values(productsObj).forEach(product => {
                    if (product.category) allCategories.add(product.category);
                    if (product.subcategory) allCategories.add(product.subcategory);
                });

                setDynamicCategories(Array.from(allCategories));

            } catch (error) {
                console.error('Error fetching products:', error);

                setDynamicCategories(['All']);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const productsData = await get('products');
                const productsObj = Object.assign({}, ...productsData);
                const selectedProduct = productsObj[id];

                if (selectedProduct) {
                    setProduct({
                        ...selectedProduct,
                        id: id
                    });
                } else {
                    console.error("Product not found.");
                    navigate('/');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        };

        fetchProduct();
    }, [id, navigate]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
        });
        return unsubscribe;
    }, []);

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
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedCategory !== 'All') params.set('category', selectedCategory);
        navigate(`/?${params.toString()}`);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (category !== 'All') params.set('category', category);
        navigate(`/?${params.toString()}`);
    };

    const addToWishlist = async (productId) => {
        try {
            const userDataResponse = await get(`users/${currentUser.uid}`);
            const userData = Array.isArray(userDataResponse) && userDataResponse[0]?.undefined
                ? userDataResponse[0].undefined
                : userDataResponse;

            if (!userData) {
                throw new Error("User data not found");
            }

            let updatedWishlist;

            if (userData.wishlist && userData.wishlist.includes(productId)) {
                updatedWishlist = userData.wishlist.filter(id => id !== productId);
                setIsInWishlist(false);
                alert('Product removed from your wishlist.');
            } else {
                updatedWishlist = userData.wishlist
                    ? [...userData.wishlist, productId]
                    : [productId];
                setIsInWishlist(true);
                alert('Product added to your wishlist!');
            }

            const updatedUserData = {
                firstname: userData.firstname,
                lastname: userData.lastname,
                email: userData.email,
                active: userData.active,
                role: userData.role,
                country: userData.address.country,
                city: userData.address.city,
                address: userData.address.address,
                wishlist: updatedWishlist
            };


            await set(`users/${currentUser.uid}`, updatedUserData);
        } catch (error) {
            console.error('Wishlist error:', error);
            alert('Error: ' + error.message);
        }
    };

    useEffect(() => {
        const checkWishlist = async () => {
            if (currentUser) {
                const userDataResponse = await get(`users/${currentUser.uid}`);
                const userData = Array.isArray(userDataResponse) && userDataResponse[0]?.undefined
                    ? userDataResponse[0].undefined
                    : userDataResponse;

                if (userData?.wishlist?.includes(id)) {
                    setIsInWishlist(true);
                } else {
                    setIsInWishlist(false);
                }
            }
        };

        checkWishlist();
    }, [currentUser, id]);

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
        const checkOrderStatus = async () => {
            if (!currentUser) return;

            try {
                const userOrders = await get("orders", null, [
                    ["user", "==", currentUser.uid]
                ]);

                let found = false;
                let matchedId = null;

                for (const order of userOrders) {
                    const orderId = Object.keys(order)[0];
                    const orderData = order[orderId];

                    if (orderData.status !== "delivered") continue;

                    const productsInOrder = await get(`orders/${orderId}/products`);
                    const productMap = productsInOrder?.[0] || {};

                    const containsProduct = Object.keys(productMap).includes(id);

                    if (containsProduct) {
                        found = true;
                        matchedId = orderId;
                        break;
                    }
                }

                setHasPurchasedAndDelivered(found);
                setMatchedOrderId(matchedId);
            } catch (err) {
                console.error("Order check failed:", err);
            }
        };

        checkOrderStatus();
    }, [currentUser, id]);



    const handleSubmitComment = async () => {
        if (!userComment.trim()) {
            alert("Comment cannot be empty.");
            return;
        }

        const newComment = {
            order: matchedOrderId,
            product: id,
            rate: userRating,
            comment: userComment,
        };

        try {
            await add("comments", newComment);
            alert("Your comment has been submitted and pending approval.");
            setUserComment('');
            setUserRating(10);
            fetchComments();
        } catch (error) {
            console.error("Failed to submit comment:", error);
            alert("Failed to submit comment.");
        }
    };

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const data = await get("comments", null, [
                    ["approved", "==", true],
                    ["product", "==", id]
                ]);

                const allComments = Object.values(Object.assign({}, ...data));
                setComments(allComments);
            } catch (error) {
                console.error("Error fetching comments:", error);
            }
        };

        fetchComments();
    }, [id]);


    if (!product) {
        return <div className="loading">Loading...</div>;
    }

    const discountedPrice = product.price - (product.price * product.discount) / 100;

    return (
        <div className="product-detail-container">
            <div className="app-bar">
                <img
                    src={logo}
                    alt="Logo"
                    className="app-bar-logo"
                    onClick={() => navigate('/')}
                />

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                    />
                </div>

                <div className="header-actions">
                    {currentUser ? (
                        <div className="user-actions">
                            <div className="wishlist-icon" onClick={() => navigate('/wishlist')}>
                                ❤️
                                {currentUser?.wishlist?.length > 0 && (
                                    <span>{currentUser.wishlist.length}</span>
                                )}
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
            </div>

            <div className="categories-bar">
                <div className="categories">
                    {dynamicCategories.map((category) => (
                        <button
                            key={category}
                            className={`category-item ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="product-detail">
                <div className="product-image">
                    <img src={product.image} alt={product.name} />
                </div>
                <div className="product-info">
                    <h1>{product.name}</h1>
                    <div className="category">
                        <span>{product.category} &gt; {product.subcategory}</span>
                    </div>
                    <div className="price">
                        {product.discount > 0 ? (
                            <>
                                <span className="original-price">${product.price}</span>
                                <span className="discounted-price">${discountedPrice.toFixed(2)}</span>
                                <span className="discount">({product.discount}% off)</span>
                            </>
                        ) : (
                            <span className="discounted-price">${product.price}</span>
                        )}
                    </div>

                    <p className="description">{product.description}</p>
                    <div className="stock">
                        {product.stock > 0 ? (
                            <span className="in-stock">{product.stock} stock left</span>
                        ) : (
                            <span className="out-of-stock">Out of Stock</span>
                        )}
                    </div>
                    <div className="warranty">
                        <span>Warranty: {product.warranty === -1 ? "Lifetime" : `${product.warranty} months`}</span>
                    </div>
                    <div className="distributor">
                        <span>Sold by: {product.distributorname}</span>
                    </div>
                    {product.stock > 0 && (
                        <div className="buttons">
                            <button className="add-to-cart" onClick={(e) => {
                                e.stopPropagation();
                                addToCart({
                                    id: product.id,
                                    name: product.name,
                                    price: product.discount > 0
                                        ? discountedPrice
                                        : product.price,
                                    image: product.image,
                                    quantity: 1
                                });
                                alert('Product added to cart');
                            }}
                            >
                                Add to Cart
                            </button>
                            {currentUser && (
                                <button
                                    className={`add-to-wishlist ${isInWishlist ? 'red' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToWishlist(id);
                                    }}
                                    title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                    ❤️
                                </button>

                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="product-specifications">
                <h2>Features</h2>
                <ul>
                    {product.features && Object.entries(product.features).map(([key, value]) => (
                        <li key={key}>
                            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="product-comments">
                <h2>Comments</h2>

                {comments.length === 0 && <p>No comments yet.</p>}

                <ul>
                    {comments.map((c, i) => (
                        <li key={i}>
                            <strong>{c.firstname} {c.lastname}</strong> ({c.rate}/10):<br />
                            <span>{c.comment}</span>
                        </li>
                    ))}
                </ul>

                {currentUser && hasPurchasedAndDelivered && (
                    <div className="comment-form">
                        <h3>Leave a Comment</h3>
                        <label>
                            Rating:
                            <select value={userRating} onChange={(e) => setUserRating(Number(e.target.value))}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                    <option key={star} value={star}>{star}</option>
                                ))}
                            </select>
                        </label>
                        <textarea
                            placeholder="Write your comment..."
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                        />
                        <button onClick={handleSubmitComment}>Submit Comment</button>
                    </div>
                )}


                {!currentUser && <p><em>Login to comment.</em></p>}
                {currentUser && !hasPurchasedAndDelivered && <p><em>You can comment only after the product is delivered.</em></p>}
            </div>

        </div>
    );
}

export default ProductDetail;
