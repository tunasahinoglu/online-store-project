import { render, screen, fireEvent } from '@testing-library/react';
import Homepage from './Homepage';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../pages/cart/cart_context', () => ({
    useCart: () => ({
        cart: [],
        addToCart: jest.fn(),
    }),
}));

jest.mock("../../services/firebase/connect.js", () => ({
    auth: {
        onAuthStateChanged: jest.fn((callback) => callback(null)),
    },
    database: {},
}));

jest.mock("../../services/firebase/database.js", () => ({
    get: jest.fn(() => Promise.resolve({})),
}));

// Mock NotificationDialog
jest.mock('../../pages/notification/notification_dialog.jsx', () => () => <div>Mock NotificationDialog</div>);

// Needed because you import a logo
jest.mock('../../assets/teknosuLogo.jpg', () => 'logo.jpg');

describe('Homepage Component (very light tests)', () => {

    it('renders without crashing', () => {
        render(
            <BrowserRouter>
                <Homepage />
            </BrowserRouter>
        );
        expect(screen.getByAltText('Logo')).toBeInTheDocument();
    });

    it('shows search input field', () => {
        render(
            <BrowserRouter>
                <Homepage />
            </BrowserRouter>
        );
        expect(screen.getByPlaceholderText('Search products')).toBeInTheDocument();
    });

    it('shows "Login/Register" button if no user logged in', () => {
        render(
            <BrowserRouter>
                <Homepage />
            </BrowserRouter>
        );
        expect(screen.getByText('Login/Register')).toBeInTheDocument();
    });

    it('search bar updates value on typing', () => {
        render(
            <BrowserRouter>
                <Homepage />
            </BrowserRouter>
        );
        const searchInput = screen.getByPlaceholderText('Search products');
        fireEvent.change(searchInput, { target: { value: 'Laptop' } });
        expect(searchInput.value).toBe('Laptop');
    });

    it('renders sort dropdown', () => {
        render(
            <BrowserRouter>
                <Homepage />
            </BrowserRouter>
        );
        expect(screen.getByDisplayValue('Default')).toBeInTheDocument();
    });

});