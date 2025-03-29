import React, { useState, useEffect } from 'react';
import './login.css';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from "../../services/firebase/connect.js"
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const LoginPage = () => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
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
        <div className="login-container">
            <a href="/">
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/85/Teknosa_logo.svg"
                    alt="Login"
                    className="login-image"
                />
            </a>
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
            <footer>
                <p>&copy; Copyright 2025, CS308-Group32</p>
            </footer>
        </div>
    );
};

export default LoginPage;