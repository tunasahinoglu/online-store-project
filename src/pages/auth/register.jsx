import React, { useState } from 'react';
import './login.css';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!firstName || !email || !password || !confirmPassword) {
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

        setError('');
        console.log('Registering user with:', { firstName, lastName, email, password });

        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="login-container">
            <a href="../../../"> {/*what the f*/}
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/85/Teknosa_logo.svg"
                    alt="Register"
                    className="login-image"
                />
            </a>
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Register</h2>
                {error && <div className="error-message">{error}</div>}

                <div className="input-group">
                    <label htmlFor="name">name</label>
                    <input
                        type="text"
                        id="name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email:</label>
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

                <button type="submit" className="login-button">Register</button>
                <Link to="/login">
                    <button type="button" className="register-button">Already have an account? Login</button>
                </Link>
            </form>
            <footer>
                <p>&copy; Copyright 2025, CS308-Group32</p>
            </footer>
        </div>
    );
};

export default RegisterPage;
