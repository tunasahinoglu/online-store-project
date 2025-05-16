import { render, screen } from '@testing-library/react';
import SimpleComponent from './SimpleComponent';

describe('SimpleComponent', () => {

    test('renders the name', () => {
        render(<SimpleComponent />);
        const name = screen.getByText(/Welcome to My Profile/i);
        expect(name).toBeInTheDocument();
    });

    test('renders the user email', () => {
        render(<SimpleComponent email="test@example.com" />);
        const emailElement = screen.getByText(/test@example.com/i);
        expect(emailElement).toBeInTheDocument();
    });

});