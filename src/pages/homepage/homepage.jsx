import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/TeknosaLogo.png';
import './homepage.css';

const products = [ // Temp database
    {
        id: 1,
        name: "iPhone 15",
        price: 1000,
        image: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111339_sp818-mbp13touch-space-select-202005.png",
    },
    {
        id: 2,
        name: "Macbook Pro",
        price: 2000,
        image: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111339_sp818-mbp13touch-space-select-202005.png",
    },
    {
        id: 3,
        name: "Samsung Galaxy S23",
        price: 1000,
        image: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111339_sp818-mbp13touch-space-select-202005.png",
    }
];

const categories = ['Electronics', 'Phones', 'Laptops', 'Accessories'];

function Homepage() {
    const navigate = useNavigate();

    return (
        <div className="homepage">
            <header className="app-bar">
                <img
                    src={logo}
                    alt="Logo"
                    className="app-bar-logo"
                    onClick={() => navigate('/')}
                />

                <div className="categories">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className="category-item"
                            onClick={() => navigate(`/category/${category.toLowerCase()}`)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <a href="./src/pages/auth/auth.html">
                        <button>Login/Register</button>
                    </a>
            </header>

            <main className="main-content">
                <section className="product-list">
                    {products.map((product) => (
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