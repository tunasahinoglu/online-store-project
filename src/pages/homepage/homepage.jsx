import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/TeknosaLogo.png'; // Adjust the path to your image
import './homepage.css';

function Homepage() {
    const navigate = useNavigate();

    return (
        <div className="homepage">
            <header className="homepage-header">
                <h1>Welcome to Online Store</h1>
                <img
                    src={logo}
                    alt="Logo"
                    className="header-logo"
                />
            </header>
            <main className="homepage-content">
                <section>
                    <p>Test</p>
                    <a href="./src/pages/auth/auth.html">
                        <button>Login or Register</button>
                    </a>
                </section>
            </main>
            <footer className="homepage-footer">
                <p>footer</p>
            </footer>
        </div>
    );
}

export default Homepage;