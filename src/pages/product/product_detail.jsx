import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './product_detail.css';
import { products } from '../../models/temp_product_db';
import { useCart } from '../../pages/cart/cart_context';
import logo from '../../assets/TeknosaLogo.png';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = products[id];

    const discountedPrice = product.price - (product.price * product.discount) / 100;

    const { cart, addToCart } = useCart();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

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
                        🛒 <span className="cart-count">{cart.length}</span>
                    </div>
                    <div>
                        <button onClick={() => navigate('/login')}>
                            Login/Register
                        </button>
                    </div>
                </div>
            </div>

            <div className="categories-bar">
                <div className="categories">
                    {['All', 'Electronics', 'Smartphones', 'Laptops', 'Headphones', 'Wearables', 'Cameras', 'TVs', 'Gaming'].map((category) => (
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
                        <span className="original-price">${product.price}</span>
                        <span className="discounted-price">${discountedPrice.toFixed(2)}</span>
                        <span className="discount">({product.discount}% off)</span>
                    </div>
                    <p className="description">{product.description}</p>
                    <div className="stock">
                        {product.stock > 0 ? (
                            <span className="in-stock">In Stock</span>
                        ) : (
                            <span className="out-of-stock">Out of Stock</span>
                        )}
                    </div>
                    <div className="warranty">
                        <span>Warranty: {product.warranty === -1 ? "Lifetime" : `${product.warranty} months`}</span>
                    </div>
                    <div className="distributor">
                        <span>Sold by: {product.distributername}</span>
                    </div>
                    {product.stock > 0 && (
                        <div className="buttons">
                            <button className="add-to-cart" onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                                alert('Product added to cart');
                            }}>
                                Add to Cart
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="product-specifications">
                <h2>Features</h2>
                <ul>
                    {Object.entries(product.features).map(([key, value]) => (
                        <li key={key}>
                            <strong>{key}:</strong> {value}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="product-comments">
                <h2>Comments</h2>
                <ul>
                    {product.comments.map((comment, index) => (
                        <li key={index}>{comment}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default ProductDetail;