import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../../assets/teknosuLogo.jpg';
import './homepage.css';
import { useCart } from '../../pages/cart/cart_context';
import { auth, database } from "../../services/firebase/connect.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { get } from '../../services/firebase/database.js';
import NotificationDialog from '../../pages/notification/notification_dialog.jsx';

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


    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const productsData = await get('products', ["category", "subcategory"]);
                const productsObj = Object.assign({}, ...productsData);
                setFirestoreProducts(productsObj);

                const allCategories = new Set(['All']);

                Object.values(productsObj).forEach(product => {
                    if (product.category) allCategories.add(product.category.charAt(0).toUpperCase() + product.category.slice(1));
                    if (product.subcategory) allCategories.add(product.subcategory.charAt(0).toUpperCase() + product.subcategory.slice(1));
                });

                setDynamicCategories(Array.from(allCategories));
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
        });
        return unsubscribe;
    }, []);

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

    const productList = Object.entries(firestoreProducts).map(([id, product]) => ({
        ...product,
        id: id
    }));

    const filteredProducts = productList.filter(product => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch =
            product.name.toLowerCase().includes(searchTermLower) ||
            product.description.toLowerCase().includes(searchTermLower);
        const matchesCategory = selectedCategory === 'All' ||
            product.category === selectedCategory ||
            product.subcategory === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortOption === 'priceHighToLow') {
            return b.price - a.price;
        } else if (sortOption === 'priceLowToHigh') {
            return a.price - b.price;
        }
        else if (sortOption === 'popularity') {
            return (b.popularity || 0) - (a.popularity || 0);
        }
        else {
            return 0;
        }
    });

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

            <main className="main-content">
                <section className="product-list">
                    {sortedProducts.map((product) => (
                        <div
                            key={product.id}
                            className="product-card"
                            onClick={() => navigate(`/product/${product.id}`)}
                        >
                            <img src={product.image} alt={product.name} className="product-image" />
                            <h3>{product.name}</h3>
                            {product.discount > 0 ? (
                                <p>
                                    <span className="discounted-price">
                                        <span className="original-price">${product.price}</span>
                                        ${(product.price * (1 - product.discount / 100))}
                                    </span>
                                </p>
                            ) : (
                                <p>${product.price}</p>
                            )}

                            {product.stock > 0 ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const finalPrice = product.discount > 0
                                            ? product.price * (1 - product.discount / 100)
                                            : product.price;

                                        addToCart({
                                            id: product.id,
                                            name: product.name,
                                            price: finalPrice,
                                            image: product.image
                                        });
                                        alert('Product added to cart');
                                    }}
                                >
                                    Add to Cart
                                </button>
                            ) : (
                                <button
                                    className="out-of-stock-btn"
                                    disabled
                                >
                                    Out of Stock
                                </button>
                            )}
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}

export default Homepage;