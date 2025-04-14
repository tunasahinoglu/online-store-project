import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './product_detail.css';
import { useCart } from '../../pages/cart/cart_context';
import logo from '../../assets/TeknosaLogo.png';
import { get } from '../../services/firebase/database';
import { auth, database } from "../../services/firebase/connect.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cart, addToCart } = useCart();
    const [currentUser, setCurrentUser] = useState(null);
    const [product, setProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [dynamicCategories, setDynamicCategories] = useState(['All']);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categoriesData = await get('categories');
                setDynamicCategories(['All', ...categoriesData]);
            } catch (error) {
                console.error('Error fetching categories:', error);

                const productsData = await get('products');
                const productsObj = Object.assign({}, ...productsData);

                const allCategories = new Set(['All']);
                Object.values(productsObj).forEach(product => {
                    if (product.category) allCategories.add(product.category);
                    if (product.subcategory) allCategories.add(product.subcategory);
                });

                setDynamicCategories(Array.from(allCategories));
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
                    <div className="cart-icon" onClick={() => navigate('/cart')}>
                        🛒
                        <span>{cart.reduce((total, product) => total + product.quantity, 0)}</span>
                    </div>
                    {currentUser ? (
                        <div className="user-actions">
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
                                alert('Ürün sepete eklendi');
                            }}
                        >
                            Add to Cart
                        </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="product-specifications">
                <h2>Features</h2>
                <ul>
                    {product.features && Object.entries(product.features).map(([key, value]) => (
                        <li key={key}>
                            <strong>{key}:</strong> {value}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="product-comments">
                <h2>Comments</h2>
                <ul>
                    {product.comments?.map((comment, index) => (
                        <li key={index}>{comment}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default ProductDetail;
