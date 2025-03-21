import React, { useState } from 'react';
import './login.css';
import { Link } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Logging in with:', { email, password });
    };

    return (

        <div className="login-container">
            <a href="../../../">
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/85/Teknosa_logo.svg" alt="Login" className="login-image" /> {/*login image*/}
            </a>
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Login</h2>
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

                <button type="submit" className="login-button">Login</button>   {/*login button*/}
                <Link to="/register">
                    <button type="button" className="register-button">Register</button> {/*register button*/}
                </Link>
            </form>
            <footer>
                <p>&copy; Copyright 2025, CS308-Group32</p>
            </footer>
        </div>
    );
};

export default LoginPage;
