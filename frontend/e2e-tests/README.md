# Community Garden Planner - E2E Tests

End-to-end tests for the Community Garden Planner frontend application using Selenium WebDriver.

## Setup

1. **Install Dependencies**
   ```bash
   cd e2e-tests
   npm install
   ```

2. **Install Browser Drivers**
   - **Chrome**: Download ChromeDriver from https://chromedriver.chromium.org/
   - **Firefox**: Download GeckoDriver from https://github.com/mozilla/geckodriver/releases
   - Make sure drivers are in your PATH

3. **Start the Frontend Application**
   ```bash
   # In the frontend directory
   npm run dev
   ```
   Make sure the app is running on http://localhost:5173

## Running Tests

### Language Selection Test (Step 1)
```bash
# Run the language selection test
npm run test:language

# Run in headless mode
HEADLESS=true npm run test:language

# Run with specific browser
BROWSER=chrome npm run test:language
BROWSER=firefox npm run test:language
```

### All Tests
```bash
# Run all tests
npm test

# Run in different modes
npm run test:chrome
npm run test:firefox
npm run test:headless
```

## Test Structure

```
e2e-tests/
├── config/
│   └── test-config.js          # Browser and test configuration
├── page-objects/
│   └── BasePage.js             # Base page object with common methods
├── tests/
│   └── language-selection.test.js  # Language toggle test
├── screenshots/                # Auto-generated screenshots
├── package.json
└── README.md
```

## Current Test Coverage

### ✅ Step 1: Language Selection
- **Test**: `language-selection.test.js`
- **Functionality**: Changes language from English to Turkish
- **Verification**: Checks for Turkish text in navigation

## Tansel's User Scenario Progress

- [x] **Step 1**: Language change to Turkish ✅
- [ ] **Step 2**: User login
- [ ] **Step 3**: Theme change to dark
- [ ] **Step 4**: Garden creation
- [ ] **Step 5**: Forum post creation
- [ ] **Step 6**: Task creation

## Screenshots

Screenshots are automatically saved in the `screenshots/` directory with descriptive names:
- `01-initial-page-load.png`
- `02-before-language-change.png`
- `03-language-menu-opened.png`
- `04-after-turkish-selection.png`
- `05-language-verification.png`
- `06-final-turkish-interface.png`

## Troubleshooting

### Common Issues

1. **Element not found**: Check if selectors are still valid
2. **Timeout errors**: Increase timeout in test configuration
3. **Browser driver issues**: Ensure ChromeDriver/GeckoDriver is installed and in PATH
4. **Application not running**: Make sure frontend is running on localhost:5173

### Debug Mode
Run tests with visible browser (non-headless) to see what's happening:
```bash
HEADLESS=false npm run test:language
```

## Next Steps

Once the language selection test is working reliably, we'll add:
1. Login functionality
2. Theme switching
3. Garden creation
4. Forum posting
5. Task management

Each step will be tested incrementally to ensure reliability.
