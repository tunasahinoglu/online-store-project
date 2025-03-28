import React, { useState } from 'react';
import './login.css';
import { Link, useNavigate } from 'react-router-dom';
import { auth, database } from "../../services/firebase/connect.js"
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const RegisterPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!firstName || !lastName || !email || !password || !confirmPassword || !country || !city || !address) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(database, "users", user.uid), {
                firstname: firstName,
                lastname: lastName,
                email: email,
                role: "customer",
                address: {
                    country: country,
                    city: city,
                    address: address,
                },
                wishlist: [],
                createdAt: new Date()
            });

            navigate('/');
        } catch (error) {
            let errorMessage = 'Registration failed. Please try again.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters';
                    break;
            }
            setError(errorMessage);
            if (auth.currentUser) {
                try {
                    await auth.currentUser.delete();
                } catch (deleteError) {
                    console.error('Failed to delete auth user:', deleteError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <a href="/">
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/85/Teknosa_logo.svg"
                    alt="Register"
                    className="login-image"
                />
            </a>
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Register</h2>
                {error && <div className="error-message">{error}</div>}

                <div className="name-fields">
                    <div className="input-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>
                </div>

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

                <div className="input-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="double-fields">
                    <div className="input-group">
                        <label htmlFor="country">Country</label>
                        <input
                            type="text"
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="city">City</label>
                        <input
                            type="text"
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="address">Address</label>
                    <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                >
                    {loading ? 'Creating account...' : 'Register'}
                </button>
                <Link to="/login">
                    <button type="button" className="register-button">
                        Already have an account? Login
                    </button>
                </Link>
            </form>
            <footer>
                <p>&copy; Copyright 2025, CS308-Group32</p>
            </footer>
        </div>
    );
};

export default RegisterPage;