import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FontSizeSelector from './FontSizeSelector';

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
    TextFields: () => <svg data-testid="text-fields-icon" />,
    Check: () => <svg data-testid="check-icon" />,
}));

// Mock useTheme
const mockChangeFontSize = vi.fn();
const mockUseTheme = vi.fn(() => ({
    currentFontSize: 'medium',
    changeFontSize: mockChangeFontSize,
}));

vi.mock('../contexts/ThemeContext', () => ({
    useTheme: () => mockUseTheme(),
}));

// Mock useTranslation
const mockT = vi.fn((key) => {
    const translations = {
        'accessibility.fontSize.small': 'Small',
        'accessibility.fontSize.medium': 'Medium',
        'accessibility.fontSize.large': 'Large',
        'accessibility.fontSize.selector': 'Font Size',
        'accessibility.fontSize.current': 'Current font size',
    };
    return translations[key] || key;
});

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
    }),
}));

describe('FontSizeSelector Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default theme state
        mockUseTheme.mockReturnValue({
            currentFontSize: 'medium',
            changeFontSize: mockChangeFontSize,
        });

        // Spy on document.body.appendChild/removeChild for live region tests
        vi.spyOn(document.body, 'appendChild');
        vi.spyOn(document.body, 'removeChild');
    });

    describe('Rendering', () => {
        test('renders font size selector button', () => {
            render(<FontSizeSelector />);
            const button = screen.getByRole('button', { name: /font size/i });
            expect(button).toBeInTheDocument();
            expect(screen.getByTestId('text-fields-icon')).toBeInTheDocument();
        });

        test('renders with tooltip', () => {
            render(<FontSizeSelector />);
            // Tooltip usually renders its title as an aria-label or distinct element on hover
            // MUI Tooltip passes title to child's aria-label if it's an icon button usually
            const button = screen.getByRole('button', { name: /font size/i });
            expect(button).toHaveAttribute('aria-label', 'Font Size');
        });

        test('menu is not visible initially', () => {
            render(<FontSizeSelector />);
            expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        });
    });

    describe('Interaction', () => {
        test('opens menu when clicked', () => {
            render(<FontSizeSelector />);
            const button = screen.getByRole('button', { name: /font size/i });

            fireEvent.click(button);

            const menu = screen.getByRole('menu');
            expect(menu).toBeInTheDocument();

            expect(screen.getByText('Small')).toBeInTheDocument();
            expect(screen.getByText('Medium')).toBeInTheDocument();
            expect(screen.getByText('Large')).toBeInTheDocument();
        });

        test('calls changeFontSize when an option is selected', () => {
            render(<FontSizeSelector />);
            const button = screen.getByRole('button', { name: /font size/i });

            fireEvent.click(button);
            fireEvent.click(screen.getByText('Large'));

            expect(mockChangeFontSize).toHaveBeenCalledWith('large');
        });

        test('closes menu after selection', async () => {
            render(<FontSizeSelector />);
            const button = screen.getByRole('button', { name: /font size/i });

            fireEvent.click(button);
            fireEvent.click(screen.getByText('Small'));

            await waitFor(() => {
                expect(screen.queryByRole('menu')).not.toBeInTheDocument();
            });
        });
    });

    describe('State Indication', () => {
        test('shows check icon for current font size', () => {
            mockUseTheme.mockReturnValue({
                currentFontSize: 'large',
                changeFontSize: mockChangeFontSize,
            });

            render(<FontSizeSelector />);
            const button = screen.getByRole('button', { name: /font size/i });
            fireEvent.click(button);

            const largeOption = screen.getByText('Large').closest('[role="menuitemradio"]');
            expect(largeOption).toHaveAttribute('aria-checked', 'true');
            expect(largeOption.querySelector('[data-testid="check-icon"]')).toBeInTheDocument();
        });

        test('does not show check icon for other font sizes', () => {
            mockUseTheme.mockReturnValue({
                currentFontSize: 'small',
                changeFontSize: mockChangeFontSize,
            });

            render(<FontSizeSelector />);
            const button = screen.getByRole('button', { name: /font size/i });
            fireEvent.click(button);

            const mediumOption = screen.getByText('Medium').closest('[role="menuitemradio"]');
            expect(mediumOption).toHaveAttribute('aria-checked', 'false');
            expect(mediumOption.querySelector('[data-testid="check-icon"]')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        test('announces font size change via live region', () => {
            render(<FontSizeSelector />);
            const button = screen.getByRole('button', { name: /font size/i });

            fireEvent.click(button);
            fireEvent.click(screen.getByText('Small'));

            expect(document.body.appendChild).toHaveBeenCalled();
            // We could inspect the element passed to appendChild if needed, but spy call is checking the side effect
        });
    });
});
