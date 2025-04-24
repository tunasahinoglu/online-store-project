import React, { useState, useEffect } from 'react';
import './login.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from "../../services/firebase/connect.js"
import { signIn } from "../../services/firebase/auth.js"
import logo from '../../assets/teknosuLogo.jpg';
import NotificationDialog from '../../pages/notification/notification_dialog.jsx';
import { useCart } from '../../pages/cart/cart_context';

const LoginPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('default');
    const { cart, addToCart } = useCart();
    const [currentUser, setCurrentUser] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [unseenCount, setUnseenCount] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Check if user is already logged in
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                navigate('/'); // Redirect to home if already logged in
            }
        });
        return () => unsubscribe();
    }, [navigate]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            await signIn(auth, email, password);
            // Redirect happens automatically due to the onAuthStateChanged listener
        } catch (error) {
            console.error('Login error:', error);
            switch (error.code) {
                case 'auth/invalid-login-credentials':
                case 'auth/invalid-email':
                case 'auth/invalid-password':
                    setError('Invalid email or password');
                    break;
                case 'auth/too-many-requests':
                    setError('Account temporarily disabled due to too many failed attempts');
                    break;
                default:
                    setError('Failed to login. Please try again later.');
            }
        }
    };

    return (
        <div className="login-page">
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
            <div className="login-container">
                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Login</h2>
                    {error && <div className="error-message">{error}</div>}
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button">Login</button>
                    <Link to="/register">
                        <button type="button" className="register-button">Register</button>
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;