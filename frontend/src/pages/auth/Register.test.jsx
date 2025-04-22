import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from './Register';
import { BrowserRouter } from 'react-router-dom';

// ✅ Mock register function
const mockRegister = vi.fn(() => true);

vi.mock('../../contexts/AuthContextUtils', () => ({
    useAuth: () => ({
        register: mockRegister,
    }),
}));

// ✅ Mock toast
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

// ✅ Mock ReCAPTCHA
vi.mock('react-google-recaptcha', () => ({
    __esModule: true,
    default: ({ onChange }) => {
        React.useEffect(() => {
            onChange('mock-token');
        }, []);
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
        const { toast } = await import('react-toastify');
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
      
        // ❌ Form should be invalid → button stays disabled
        expect(button).toBeDisabled();
      
        // ✅ Simulate submit even though button is disabled
        fireEvent.submit(button.closest('form'));
      
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith(
            'Please complete all fields correctly.',
            expect.anything()
          );
        });
      });
      


    it('calls register and shows success toast on valid form submit', async () => {
        const { toast } = await import('react-toastify');
        renderPage();

        fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'johndoe' } });
        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'john@example.com' },
        });
        const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/password/i);
        fireEvent.change(passwordInput, { target: { value: 'StrongP@ss1' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss1' } });

        fireEvent.click(screen.getByLabelText(/i agree to the terms/i));

        const button = screen.getByRole('button', { name: /sign up/i });
        await waitFor(() => expect(button).toBeEnabled());

        fireEvent.click(button);

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith(
                'Welcome to the community!',
                expect.anything()
            );
        });
    });
});
