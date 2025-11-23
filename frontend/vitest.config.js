/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    environment: 'jsdom',
    globals: true,            
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'istanbul',
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
      enabled: true,
      reportOnFailure: true,
    }
  },
  server: {
    fs: {
      strict: false,
    },
  },
});