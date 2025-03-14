import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/card.jsx';
function Homepage() {
    const navigate = useNavigate();

    return (
        <div className="homepage">
            <header className="homepage-header">
                <h1>Welcome to Online Store</h1>
            </header>
            <main className="homepage-content">
                <section>
                    <p>Test</p>
                    <a href="./src/pages/auth/auth.html">
                        <button>Login or Register</button>
                    </a>
                    <Card />
                    <Card />
                </section>
            </main>
            <footer className="homepage-footer">
                <p>footer</p>
            </footer>
        </div>
    );
}

export default Homepage;