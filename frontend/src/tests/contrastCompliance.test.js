import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme, highContrastTheme } from '../themes/themeConfig';

// WCAG 2.1 AA Contrast Ratio Checker
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

function isWCAGCompliant(foreground, background, isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);
  const minRatio = isLargeText ? 3 : 4.5;
  
  return {
    ratio: parseFloat(ratio.toFixed(2)),
    compliant: ratio >= minRatio,
    minRequired: minRatio
  };
}

describe('WCAG 2.1 AA Contrast Compliance', () => {
  describe('Light Theme', () => {
    it('should have compliant primary text on background', () => {
      const result = isWCAGCompliant(
        lightTheme.palette.text.primary,
        lightTheme.palette.background.default
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant secondary text on background', () => {
      const result = isWCAGCompliant(
        lightTheme.palette.text.secondary,
        lightTheme.palette.background.default
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant button text on primary background', () => {
      const result = isWCAGCompliant(
        lightTheme.palette.primary.contrastText,
        lightTheme.palette.primary.main
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant large text (3:1 minimum)', () => {
      const result = isWCAGCompliant(
        lightTheme.palette.text.primary,
        lightTheme.palette.background.default,
        true // isLargeText
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Dark Theme', () => {
    it('should have compliant primary text on background', () => {
      const result = isWCAGCompliant(
        darkTheme.palette.text.primary,
        darkTheme.palette.background.default
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant secondary text on background', () => {
      const result = isWCAGCompliant(
        darkTheme.palette.text.secondary,
        darkTheme.palette.background.default
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant button text on primary background', () => {
      const result = isWCAGCompliant(
        darkTheme.palette.primary.contrastText,
        darkTheme.palette.primary.main
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant text on paper background', () => {
      const result = isWCAGCompliant(
        darkTheme.palette.text.primary,
        darkTheme.palette.background.paper
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('High Contrast Theme', () => {
    it('should have compliant primary text on background', () => {
      const result = isWCAGCompliant(
        highContrastTheme.palette.text.primary,
        highContrastTheme.palette.background.default
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant secondary text on background', () => {
      const result = isWCAGCompliant(
        highContrastTheme.palette.text.secondary,
        highContrastTheme.palette.background.default
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant button text on primary background', () => {
      const result = isWCAGCompliant(
        highContrastTheme.palette.primary.contrastText,
        highContrastTheme.palette.primary.main
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet AAA standards (7:1) for critical text', () => {
      const result = isWCAGCompliant(
        highContrastTheme.palette.text.primary,
        highContrastTheme.palette.background.default
      );
      expect(result.ratio).toBeGreaterThanOrEqual(7); // AAA standard
    });
  });

  describe('Cross-theme consistency', () => {
    it('should maintain contrast ratios across all themes', () => {
      const themes = [lightTheme, darkTheme, highContrastTheme];
      const themeNames = ['light', 'dark', 'highContrast'];
      
      themes.forEach((theme, index) => {
        const primaryTextResult = isWCAGCompliant(
          theme.palette.text.primary,
          theme.palette.background.default
        );
        
        expect(primaryTextResult.compliant).toBe(true);
        console.log(`${themeNames[index]} theme primary text contrast: ${primaryTextResult.ratio}:1`);
      });
    });
  });
});
