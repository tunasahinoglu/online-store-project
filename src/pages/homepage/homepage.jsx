import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../../assets/TeknosaLogo.png';
import './homepage.css';
import { products } from '../../models/temp_product_db';
import { useCart } from '../../pages/cart/cart_context';
import { auth, database } from "../../services/firebase/connect.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";



import { add, set, del } from "../../services/firebase/database.js";
/*
const data = {
    count: 10
};
const p = set(`users/BAEfWIuIgvekkG1MCAnZdJuQZuJ2/basket/D0MXECdhAOAXu6MYaReT`, data);
const q = set(`users/BAEfWIuIgvekkG1MCAnZdJuQZuJ2/basket/JtVnOtp6Eqr94d8KIFbd`, data);
const r = set(`users/BAEfWIuIgvekkG1MCAnZdJuQZuJ2/basket/zXojb4bBPdxq7exqj1NO`, data);
console.log(p);
console.log(q);
console.log(r);
*/
/*
const data = {
    name: "x",
    costs: [5, 10],
    email: "x@x.x"
}
const q = add("deliverycompanies", data);
*/
/*
const data = {
    delivery: {
        company: "adlsWC6m4nlNTxS9h3Py",
        type: "express"
    }
}
const q = add("orders", data);
console.log(q);
*/

const data = {
    approved: false
}
const q = set("comments/wqAegkEQaCqQDJaVbq3Y", data);
console.log(q);

/*
const data = {
    request: "refund",
    order: "5Z3tGhFUYpKWVl4H7iV9"
}
const q = add("requests", data);
console.log(q);
*/
const categories = ['All', 'Electronics', 'Smartphones', 'Laptops', 'Headphones', 'Wearables', 'Cameras', 'TVs', 'Gaming'];

function Homepage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('default');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { cart, addToCart } = useCart();
    const [currentUser, setCurrentUser] = useState(null);

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
                        </select>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="cart-icon" onClick={() => navigate('/cart')}>
                        🛒
                        <span>{cart.reduce((total, product) => total + product.quantity, 0)}</span>
                    </div>
                    {currentUser ? (
                        <button onClick={handleLogout}>Logout</button>
                    ) : (
                        <button onClick={() => navigate('/login')}>Login/Register</button>
                    )}
                </div>
            </header>

            <div className="categories-bar">
                <div className="categories">
                    {categories.map((category) => (
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
                            <p>${product.price}</p>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                                alert('Product added to cart');
                            }}>Add to Cart</button>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}

export default Homepage;