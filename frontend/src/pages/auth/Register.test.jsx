import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from './Register';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';

// Mock fetch API
window.fetch = vi.fn();

// Mock register function
const mockRegister = vi.fn();

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock('../../contexts/AuthContextUtils', () => ({
    useAuth: () => ({
        register: mockRegister,
    }),
}));

// Mock toast
vi.mock('react-toastify', async () => {
    const actual = await vi.importActual('react-toastify');
    return {
        ...actual,
        toast: {
            error: vi.fn(),
            success: vi.fn(),
        },
    };
});

// Mock ReCAPTCHA
vi.mock('react-google-recaptcha', () => ({
    __esModule: true,
    default: ({ onChange }) => {
        // Simulate verification immediately
        onChange('mock-token');
        return <div data-testid="mock-recaptcha" />;
    }
}));

const renderPage = () =>
    render(
        <BrowserRouter>
            <Register />
        </BrowserRouter>
    );

describe('Register Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup a successful response for fetch by default
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ token: 'fake-token' })
        });
    });

    it('renders all form fields and the sign-up button', () => {
        renderPage();
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/password/i);
        expect(passwordInput).toBeInTheDocument();
        expect(confirmPasswordInput).toBeInTheDocument();

        expect(screen.getByText(/i agree to the terms/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
    });

    it('shows error toast if user submits invalid form', async () => {
        renderPage();
      
        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
        fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'janedoe' } });
        fireEvent.change(screen.getByLabelText(/email address/i), {
          target: { value: 'invalidemail' },
        });
      
        const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/password/i);
        fireEvent.change(passwordInput, { target: { value: 'weak' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });
      
        fireEvent.click(screen.getByLabelText(/i agree to the terms/i));
      
        const button = screen.getByRole('button', { name: /sign up/i });
      
        // Form should be invalid → button stays disabled
        expect(button).toBeDisabled();
      
        // Simulate submit even though button is disabled
        fireEvent.submit(button.closest('form'));
      
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith(
            'Please complete all fields correctly.',
            expect.anything()
          );
        });
    });
      
    it('calls register and shows success toast on valid form submit', async () => {
        renderPage();

        // Fill in valid form data
        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'johndoe' } });
        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'john@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/location/i), {
            target: { value: 'New York' },
        });
        
        const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/password/i);
        fireEvent.change(passwordInput, { target: { value: 'StrongP@ss1' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss1' } });

        // Accept terms
        fireEvent.click(screen.getByLabelText(/i agree to the terms/i));

        // Wait for button to be enabled and click it
        let button;
        await waitFor(() => {
            button = screen.getByRole('button', { name: /sign up/i });
            expect(button).toBeEnabled();
        });
        
        fireEvent.click(button);

        // Verify the API is called correctly
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('johndoe')
                })
            );
        });

        // Verify the register function is called
        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalled();
        });
        
        // Verify the success toast and navigation
        expect(toast.success).toHaveBeenCalledWith(
            'Welcome to the community!',
            expect.anything()
        );
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
