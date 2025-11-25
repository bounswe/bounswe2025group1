import { describe, it, expect } from 'vitest';
import { getContrast } from 'polished';
import { lightTheme, darkTheme, highContrastTheme } from './themeConfig';
import { bgForStatus } from '../utils/taskUtils';

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

// Helper function to extract RGB values from rgba strings
function rgbaToRgb(rgbaString) {
  const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return null;
}

// Helper function to get contrast ratio for rgba backgrounds
function getContrastRatioWithRgba(textColor, rgbaBackground, themeBackground) {
  const textRgb = hexToRgb(textColor);
  const bgRgb = rgbaToRgb(rgbaBackground);
  const themeRgb = hexToRgb(themeBackground);
  
  if (!textRgb || !bgRgb || !themeRgb) return 0;
  
  // Blend the rgba background with the theme background
  const alpha = parseFloat(rgbaBackground.match(/[\d.]+\)$/)[0].replace(')', ''));
  const blendedR = Math.round(bgRgb.r * alpha + themeRgb.r * (1 - alpha));
  const blendedG = Math.round(bgRgb.g * alpha + themeRgb.g * (1 - alpha));
  const blendedB = Math.round(bgRgb.b * alpha + themeRgb.b * (1 - alpha));
  
  const lum1 = getLuminance(textRgb.r, textRgb.g, textRgb.b);
  const lum2 = getLuminance(blendedR, blendedG, blendedB);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Helper function to blend rgba colors with background for polished library
function blendColors(rgbaColor, backgroundColor) {
  const bgRgb = rgbaToRgb(rgbaColor);
  const themeRgb = hexToRgb(backgroundColor);
  
  if (!bgRgb || !themeRgb) return backgroundColor;
  
  const alpha = parseFloat(rgbaColor.match(/[\d.]+\)$/)[0].replace(')', ''));
  const blendedR = Math.round(bgRgb.r * alpha + themeRgb.r * (1 - alpha));
  const blendedG = Math.round(bgRgb.g * alpha + themeRgb.g * (1 - alpha));
  const blendedB = Math.round(bgRgb.b * alpha + themeRgb.b * (1 - alpha));
  
  return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
}

describe('Theme Color Ratios and WCAG Compliance', () => {
  describe('Polished Library Contrast Tests', () => {
    it('primary color has sufficient contrast on light background', () => {
      const contrast = getContrast(lightTheme.palette.primary.main, lightTheme.palette.background.default);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('primary color has sufficient contrast on dark background', () => {
      const contrast = getContrast(darkTheme.palette.primary.main, darkTheme.palette.background.default);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('secondary text meets WCAG contrast on light background', () => {
      const contrast = getContrast(lightTheme.palette.text.secondary, lightTheme.palette.background.default);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('secondary text meets WCAG contrast on dark background', () => {
      const contrast = getContrast(darkTheme.palette.text.secondary, darkTheme.palette.background.default);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('high contrast theme exceeds AAA standards', () => {
      const contrast = getContrast(highContrastTheme.palette.text.primary, highContrastTheme.palette.background.default);
      expect(contrast).toBeGreaterThanOrEqual(7.0);
    });

    it('button text has sufficient contrast on primary background', () => {
      const lightContrast = getContrast(lightTheme.palette.primary.contrastText, lightTheme.palette.primary.main);
      const darkContrast = getContrast(darkTheme.palette.primary.contrastText, darkTheme.palette.primary.main);
      
      expect(lightContrast).toBeGreaterThanOrEqual(4.5);
      expect(darkContrast).toBeGreaterThanOrEqual(4.5);
    });

    it('task status colors have good contrast in light mode', () => {
      const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DECLINED'];
      const lightThemeMock = { palette: { mode: 'light' } };
      
      statuses.forEach(status => {
        const bgColor = bgForStatus(status, lightThemeMock);
        const contrast = getContrast(lightTheme.palette.text.primary, bgColor);
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('task status colors have good contrast in dark mode', () => {
      const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DECLINED'];
      const darkThemeMock = { palette: { mode: 'dark' } };
      
      statuses.forEach(status => {
        const bgColor = bgForStatus(status, darkThemeMock);
        // For rgba colors, we need to blend with the background
        const blendedColor = blendColors(bgColor, darkTheme.palette.background.paper);
        const contrast = getContrast(darkTheme.palette.text.primary, blendedColor);
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('Basic Theme Contrast Ratios', () => {
    it('should have compliant primary text on background for light theme', () => {
      const result = isWCAGCompliant(
        lightTheme.palette.text.primary,
        lightTheme.palette.background.default
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant primary text on background for dark theme', () => {
      const result = isWCAGCompliant(
        darkTheme.palette.text.primary,
        darkTheme.palette.background.default
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant primary text on background for high contrast theme', () => {
      const result = isWCAGCompliant(
        highContrastTheme.palette.text.primary,
        highContrastTheme.palette.background.default
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant button text on primary background for light theme', () => {
      const result = isWCAGCompliant(
        lightTheme.palette.primary.contrastText,
        lightTheme.palette.primary.main
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant button text on primary background for dark theme', () => {
      const result = isWCAGCompliant(
        darkTheme.palette.primary.contrastText,
        darkTheme.palette.primary.main
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have compliant button text on primary background for high contrast theme', () => {
      const result = isWCAGCompliant(
        highContrastTheme.palette.primary.contrastText,
        highContrastTheme.palette.primary.main
      );
      expect(result.compliant).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Task Background Colors', () => {
    it('should return correct light theme colors for task statuses', () => {
      const lightThemeMock = { palette: { mode: 'light' } };
      
      expect(bgForStatus('PENDING', lightThemeMock)).toBe('#ffe0b2');
      expect(bgForStatus('IN_PROGRESS', lightThemeMock)).toBe('#bbdefb');
      expect(bgForStatus('COMPLETED', lightThemeMock)).toBe('#c8e6c9');
      expect(bgForStatus('DECLINED', lightThemeMock)).toBe('#ffcdd2');
    });

    it('should return correct dark theme colors for task statuses', () => {
      const darkThemeMock = { palette: { mode: 'dark' } };
      
      expect(bgForStatus('PENDING', darkThemeMock)).toBe('rgba(255, 152, 0, 0.15)');
      expect(bgForStatus('IN_PROGRESS', darkThemeMock)).toBe('rgba(33, 150, 243, 0.15)');
      expect(bgForStatus('COMPLETED', darkThemeMock)).toBe('rgba(76, 175, 80, 0.15)');
      expect(bgForStatus('DECLINED', darkThemeMock)).toBe('rgba(244, 67, 54, 0.15)');
    });

    it('should have good contrast for task text on light theme backgrounds', () => {
      const lightThemeMock = { palette: { mode: 'light' } };
      const textColor = lightTheme.palette.text.primary;
      
      const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DECLINED'];
      
      statuses.forEach(status => {
        const bgColor = bgForStatus(status, lightThemeMock);
        const result = isWCAGCompliant(textColor, bgColor);
        expect(result.compliant).toBe(true);
        expect(result.ratio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should have good contrast for task text on dark theme backgrounds', () => {
      const darkThemeMock = { palette: { mode: 'dark' } };
      const textColor = darkTheme.palette.text.primary;
      const themeBackground = darkTheme.palette.background.paper;
      
      const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DECLINED'];
      
      statuses.forEach(status => {
        const bgColor = bgForStatus(status, darkThemeMock);
        const ratio = getContrastRatioWithRgba(textColor, bgColor, themeBackground);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('High Contrast Theme', () => {
    it('should meet AAA standards (7:1) for critical text', () => {
      const result = isWCAGCompliant(
        highContrastTheme.palette.text.primary,
        highContrastTheme.palette.background.default
      );
      expect(result.ratio).toBeGreaterThanOrEqual(7); // AAA standard
    });

    it('should have maximum contrast for all text elements', () => {
      const primaryResult = isWCAGCompliant(
        highContrastTheme.palette.text.primary,
        highContrastTheme.palette.background.default
      );
      const secondaryResult = isWCAGCompliant(
        highContrastTheme.palette.text.secondary,
        highContrastTheme.palette.background.default
      );
      
      expect(primaryResult.ratio).toBeGreaterThanOrEqual(20); // Near maximum contrast
      expect(secondaryResult.ratio).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Cross-theme Consistency', () => {
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

    it('should have consistent color schemes across themes', () => {
      // All themes should have primary colors defined
      expect(lightTheme.palette.primary.main).toBeDefined();
      expect(darkTheme.palette.primary.main).toBeDefined();
      expect(highContrastTheme.palette.primary.main).toBeDefined();
      
      // All themes should have proper text colors
      expect(lightTheme.palette.text.primary).toBeDefined();
      expect(darkTheme.palette.text.primary).toBeDefined();
      expect(highContrastTheme.palette.text.primary).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined theme gracefully', () => {
      expect(() => bgForStatus('PENDING', undefined)).not.toThrow();
      expect(() => bgForStatus('PENDING', null)).not.toThrow();
    });

    it('should handle unknown status gracefully', () => {
      const lightThemeMock = { palette: { mode: 'light' } };
      const darkThemeMock = { palette: { mode: 'dark' } };
      
      expect(bgForStatus('UNKNOWN_STATUS', lightThemeMock)).toBe('#bbdefb');
      expect(bgForStatus('UNKNOWN_STATUS', darkThemeMock)).toBe('rgba(33, 150, 243, 0.15)');
    });

    it('should handle missing palette mode', () => {
      const incompleteTheme = { palette: {} };
      expect(bgForStatus('PENDING', incompleteTheme)).toBe('#ffe0b2'); // Should default to light mode
    });
  });
});
