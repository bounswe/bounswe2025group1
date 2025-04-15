module.exports = {
    env: {
      browser: true,
      es2021: true,
    },
    extends: [
      'airbnb',
      'airbnb/hooks',
    ],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Add any rule overrides here
      'react/react-in-jsx-scope': 'off', // Not needed with Vite + React 17+
      'react/jsx-filename-extension': [1, { extensions: ['.jsx', '.js'] }],
    },
  };  