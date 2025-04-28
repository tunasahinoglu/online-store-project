import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Homepage from './Homepage';

describe('Homepage tests', () => {

    test('renders the logo image', () => {
        render(
            <BrowserRouter>
                <Homepage />
            </BrowserRouter>
        );
        const logoImage = screen.getByAltText(/logo/i);
        expect(logoImage).toBeInTheDocument();
    });

    test('renders the search input', () => {
        render(
            <BrowserRouter>
                <Homepage />
            </BrowserRouter>
        );
        const searchInput = screen.getByPlaceholderText(/search products/i);
        expect(searchInput).toBeInTheDocument();
    });

    test('renders the save button', () => {
        render(
            <BrowserRouter>
                <Homepage />
            </BrowserRouter>
        );
        const saveButton = screen.getByText(/save/i);
        expect(saveButton).toBeInTheDocument();
    });

    test('renders the sort options dropdown', () => {
        render(
            <BrowserRouter>
                <Homepage />
            </BrowserRouter>
        );
        const selectDropdown = screen.getByRole('combobox');
        expect(selectDropdown).toBeInTheDocument();
    });

});
