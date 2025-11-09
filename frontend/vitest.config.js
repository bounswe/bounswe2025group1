/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,            
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
        'src/setupTests.js',
        'src/main.jsx',
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
      ],
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
    }
  },
});