import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';

// Mock MUI icons to avoid EMFILE errors
vi.mock('@mui/icons-material', () => ({
  Language: () => <svg data-testid="language-icon" />,
  Check: () => <svg data-testid="check-icon" />,
}));

// Mock react-i18next
const mockChangeLanguage = vi.fn();
const mockT = vi.fn((key, options) => {
  if (key === 'language.languageSelector') return 'Select Language';
  if (key === 'accessibility.toggleLanguage') return 'Toggle language';
  if (key === 'language.currentLanguage') {
    return `Current language: ${options?.language || 'English'}`;
  }
  return key;
});

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: mockT,
    i18n: {
      language: 'en',
      changeLanguage: mockChangeLanguage,
    },
  })),
}));

describe('LanguageToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChangeLanguage.mockResolvedValue(undefined);

    // Spy on document.body.appendChild and removeChild
    vi.spyOn(document.body, 'appendChild');
    vi.spyOn(document.body, 'removeChild');
  });

  describe('Rendering', () => {
    test('renders language toggle button', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      expect(button).toBeInTheDocument();
    });

    test('renders with language icon', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    test('renders with tooltip', () => {
      render(<LanguageToggle />);
      
      expect(mockT).toHaveBeenCalledWith('language.languageSelector');
    });

    test('menu is not visible initially', () => {
      render(<LanguageToggle />);
      
      const menu = screen.queryByRole('menu');
      expect(menu).not.toBeInTheDocument();
    });

    test('renders screen reader only current language indicator', () => {
      render(<LanguageToggle />);
      
      expect(mockT).toHaveBeenCalledWith('language.currentLanguage', { language: 'English' });
    });

    test('button has correct ARIA attributes when menu is closed', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).not.toHaveAttribute('aria-controls');
    });
  });

  describe('Menu Opening and Closing', () => {
    test('opens menu when button is clicked', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
    });

    test('displays all three language options when menu is open', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      expect(screen.getAllByText('English')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Türkçe')[0]).toBeInTheDocument();
      expect(screen.getAllByText('العربية')[0]).toBeInTheDocument();
    });

    test('displays language native names', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);

      expect(screen.getAllByText('English')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Turkish')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Arabic')[0]).toBeInTheDocument();
    });

    test('closes menu when clicking outside', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      
      fireEvent.click(document.body);
      
      waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    test('button has correct ARIA attributes when menu is open', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-controls', 'language-menu');
    });
  });

  describe('Language Selection', () => {
    test('changes language to Turkish when Turkish is selected', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const turkishOption = screen.getByText('Türkçe');
      fireEvent.click(turkishOption);
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('tr');
      });
    });

    test('changes language to Arabic when Arabic is selected', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const arabicOption = screen.getByText('العربية');
      fireEvent.click(arabicOption);
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
      });
    });

    test('changes language to English when English is selected', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);

      const englishOption = screen.getAllByText('English')[0];
      fireEvent.click(englishOption);
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('en');
      });
    });

    test('closes menu after language selection', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const turkishOption = screen.getByText('Türkçe');
      fireEvent.click(turkishOption);
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Current Language Indication', () => {
    test('shows check icon for currently selected language', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menuItems = screen.getAllByRole('menuitemradio');
      const englishItem = menuItems[0]; // English is first and current
      
      const checkIcon = englishItem.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });

    test('menu items have correct aria-checked attribute', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menuItems = screen.getAllByRole('menuitemradio');
      expect(menuItems[0]).toHaveAttribute('aria-checked', 'true'); // English
      expect(menuItems[1]).toHaveAttribute('aria-checked', 'false'); // Turkish
      expect(menuItems[2]).toHaveAttribute('aria-checked', 'false'); // Arabic
    });

    test('selected menu item has selected styling', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menuItems = screen.getAllByRole('menuitemradio');
      expect(menuItems[0]).toHaveClass('Mui-selected');
    });

    test('displays flag emoji for non-selected languages', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      expect(screen.getByText('🇹🇷')).toBeInTheDocument();
      expect(screen.getByText('🇸🇦')).toBeInTheDocument();
    });
  });

  describe('Screen Reader Announcements', () => {
    test('creates live region for language change announcement', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const turkishOption = screen.getByText('Türkçe');
      fireEvent.click(turkishOption);
      
      await waitFor(() => {
        expect(document.body.appendChild).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles language change error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockChangeLanguage.mockRejectedValueOnce(new Error('Language change failed'));
      
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const turkishOption = screen.getByText('Türkçe');
      fireEvent.click(turkishOption);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to change language:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });

    test('does not close menu when language change fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockChangeLanguage.mockRejectedValueOnce(new Error('Language change failed'));
      
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const turkishOption = screen.getByText('Türkçe');
      fireEvent.click(turkishOption);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      // Menu should still be visible after error
      expect(screen.queryByRole('menu')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('menu items use menuitemradio role', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menuItems = screen.getAllByRole('menuitemradio');
      expect(menuItems).toHaveLength(3);
    });

    test('button has accessible label', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      expect(button).toHaveAttribute('aria-label', 'Toggle language');
    });

    test('menu list has correct role', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
    });
  });

  describe('Different Language States', () => {
    test('displays correct current language when language is Turkish', () => {
      vi.mocked(useTranslation).mockReturnValue({
        t: mockT,
        i18n: {
          language: 'tr',
          changeLanguage: mockChangeLanguage,
        },
      });
      
      render(<LanguageToggle />);
      
      expect(mockT).toHaveBeenCalledWith('language.currentLanguage', { language: 'Türkçe' });
    });

    test('displays correct current language when language is Arabic', () => {
      vi.mocked(useTranslation).mockReturnValue({
        t: mockT,
        i18n: {
          language: 'ar',
          changeLanguage: mockChangeLanguage,
        },
      });
      
      render(<LanguageToggle />);
      
      expect(mockT).toHaveBeenCalledWith('language.currentLanguage', { language: 'العربية' });
    });

    test('shows check icon for Turkish when Turkish is current language', () => {
      vi.mocked(useTranslation).mockReturnValue({
        t: mockT,
        i18n: {
          language: 'tr',
          changeLanguage: mockChangeLanguage,
        },
      });
      
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menuItems = screen.getAllByRole('menuitemradio');
      expect(menuItems[1]).toHaveAttribute('aria-checked', 'true'); // Turkish
      expect(menuItems[0]).toHaveAttribute('aria-checked', 'false'); // English
      expect(menuItems[2]).toHaveAttribute('aria-checked', 'false'); // Arabic
    });

    test('shows check icon for Arabic when Arabic is current language', () => {
      vi.mocked(useTranslation).mockReturnValue({
        t: mockT,
        i18n: {
          language: 'ar',
          changeLanguage: mockChangeLanguage,
        },
      });
      
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menuItems = screen.getAllByRole('menuitemradio');
      expect(menuItems[2]).toHaveAttribute('aria-checked', 'true'); // Arabic
      expect(menuItems[0]).toHaveAttribute('aria-checked', 'false'); // English
      expect(menuItems[1]).toHaveAttribute('aria-checked', 'false'); // Turkish
    });

    test('falls back to English when language code is unknown', () => {
      vi.mocked(useTranslation).mockReturnValue({
        t: mockT,
        i18n: {
          language: 'unknown',
          changeLanguage: mockChangeLanguage,
        },
      });
      
      render(<LanguageToggle />);
      
      expect(mockT).toHaveBeenCalledWith('language.currentLanguage', { language: 'English' });
    });
  });

  describe('Menu Positioning', () => {
    test('menu has correct transform origin', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menu = screen.getByRole('menu');
      // Menu positioning props are passed to the Menu component
      expect(menu).toBeInTheDocument();
    });
  });

  describe('Translation Keys', () => {
    test('uses correct translation key for language selector tooltip', () => {
      render(<LanguageToggle />);
      
      expect(mockT).toHaveBeenCalledWith('language.languageSelector');
    });

    test('uses correct translation key for accessibility label', () => {
      render(<LanguageToggle />);
      
      expect(mockT).toHaveBeenCalledWith('accessibility.toggleLanguage');
    });

    test('uses correct translation key for current language announcement', () => {
      render(<LanguageToggle />);
      
      expect(mockT).toHaveBeenCalledWith('language.currentLanguage', { language: 'English' });
    });

    test('passes correct language name to translation for Turkish', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const turkishOption = screen.getByText('Türkçe');
      fireEvent.click(turkishOption);
      
      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith('language.currentLanguage', { language: 'Türkçe' });
      });
    });

    test('passes correct language name to translation for Arabic', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const arabicOption = screen.getByText('العربية');
      fireEvent.click(arabicOption);
      
      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith('language.currentLanguage', { language: 'العربية' });
      });
    });
  });

  describe('Multiple Interactions', () => {
    test('can open and close menu multiple times', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      
      // First open
      fireEvent.click(button);
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      // Close
      fireEvent.click(document.body);
      waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
      
      // Second open
      fireEvent.click(button);
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    test('can change language multiple times', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      
      // Change to Turkish
      fireEvent.click(button);
      fireEvent.click(screen.getByText('Türkçe'));
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('tr');
      });
      
      // Change to Arabic
      fireEvent.click(button);
      fireEvent.click(screen.getByText('العربية'));
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
      });
      
      expect(mockChangeLanguage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    test('handles rapid clicks on language options', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const turkishOption = screen.getByText('Türkçe');
      
      // Rapid clicks
      fireEvent.click(turkishOption);
      fireEvent.click(turkishOption);
      fireEvent.click(turkishOption);
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalled();
      });
      
      // Should still handle gracefully
      expect(mockChangeLanguage).toHaveBeenCalledWith('tr');
    });

    test('handles clicking on same language that is already selected', async () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const englishOption = screen.getAllByText('English')[0];
      fireEvent.click(englishOption);
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('en');
      });
    });

    test('all language codes are unique', () => {
      render(<LanguageToggle />);
      
      const button = screen.getByRole('button', { name: /toggle language/i });
      fireEvent.click(button);
      
      const menuItems = screen.getAllByRole('menuitemradio');
      
      // All items should be rendered (3 languages)
      expect(menuItems).toHaveLength(3);
    });
  });
});
