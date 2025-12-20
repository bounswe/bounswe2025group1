/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['**/e2e-tests/**', '**/node_modules/**'],
    reporters: ['default', 'junit', 'html'],
    outputFile: {
      junit: './reports/web-test-results.xml',
      html: './reports/web-test-report.html'
    },
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
        'src/setupTests.js',
        'src/main.jsx',
        '**/e2e-tests/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
      ],
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './reports/coverage',
      enabled: true,
      reportOnFailure: true,
      all: false,
    }
  },
  server: {
    fs: {
      strict: false,
    },
  },
});