import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/TeknosaLogo.png';
import './homepage.css';
import { products } from '../../models/temp_product_db';
import { Link } from 'react-router-dom';

const categories = ['All', 'Electronics', 'Smartphones', 'Laptops', 'Headphones', 'Wearables', 'Cameras', 'TVs', 'Gaming'];

function Homepage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('default');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const productList = Object.values(products).map(product => ({
        ...product,
        id: Object.keys(products).find(key => products[key] === product)
    }));

    const filteredProducts = productList.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
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
        } else {
            return 0;
        }
    });

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
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search products"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="sort-options">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="default">Default</option>
                            <option value="priceHighToLow">High to Low</option>
                            <option value="priceLowToHigh">Low to High</option>
                        </select>
                    </div>
                </div>

                <a href="./src/pages/auth/auth.html">
                    <Link to="/login">
                        <button>Login/Register</button>
                    </Link>
                </a>
            </header>

            <div className="categories-bar">
                <div className="categories">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`category-item ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category)}
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
                            <p>${product.price}</p>
                        </div>
                    ))}
                </section>
            </main>

            <footer className="homepage-footer">
                <p></p>
            </footer>
        </div>
    );
}

export default Homepage;