# Community Garden Planner - E2E Tests

This directory contains end-to-end tests for the Community Garden Planner application using Selenium WebDriver.

## Test Scenarios

### Tansel's Garden Creation Scenario
**File**: `tests/tansel-garden-scenario.test.js`

**User Persona**: Tansel Arabacı (58) - Retired teacher from İstanbul/Kadıköy
- Turkish speaker with accessibility needs
- Small laptop screen (1366x768)
- Prefers dark theme due to migraines

**Scenario Steps**:
1. Change language to Turkish
2. Login to the platform
3. Change theme to dark mode
4. Navigate to Gardens section
5. Create a new garden with details
6. Navigate to Forum section
7. Create a forum post about the garden
8. Navigate to Tasks section
9. Create a watering task for garden workers
10. Verify all items were created successfully

## Setup

### Prerequisites
- Node.js (v16 or higher)
- Chrome or Firefox browser
- Community Garden Planner app running on `http://localhost:5173`

### Installation
```bash
cd e2e-tests
npm install
```

### Browser Drivers
The tests will automatically download the required browser drivers. If you need to update them manually:
```bash
npm run webdriver:update
```

## Running Tests

### Run all E2E tests
```bash
npm run test
```

### Run specific scenario
```bash
npm run test:tansel
```

### Run with specific browser
```bash
npm run test:chrome    # Chrome (default)
npm run test:firefox   # Firefox
```

### Run in headless mode
```bash
npm run test:headless
```

### Run from parent directory
```bash
cd ../
npm run test:e2e
```

## Configuration

### Environment Variables
- `BASE_URL`: Application URL (default: http://localhost:5173)
- `BROWSER`: Browser to use (chrome/firefox, default: chrome)
- `HEADLESS`: Run in headless mode (true/false, default: true)
- `TIMEOUT`: Test timeout in milliseconds (default: 30000)

### Example with custom configuration
```bash
BASE_URL=http://localhost:3000 BROWSER=firefox HEADLESS=false npm run test
```

## Test Structure

### Page Objects
- `BasePage.js`: Common functionality for all pages
- `LoginPage.js`: Login and authentication
- `GardenPage.js`: Garden creation and management
- `ForumPage.js`: Forum posts and interactions
- `TaskPage.js`: Task creation and management

### Test Configuration
- `test-config.js`: WebDriver setup and environment configuration

### Screenshots
Test screenshots are saved to `screenshots/` directory for debugging and verification.

## Test Data

### User Credentials
Tests use predefined user credentials. Make sure the test user exists in your database:
- Username: `tanselarabaci`
- Password: `TanselGarden123!`

### Test Garden Data
- Name: "Tansel'in Kadıköy Bahçesi"
- Location: "Kadıköy, İstanbul"
- Description: Turkish description about seeking help and companionship

## Accessibility Testing

The tests include verification for:
- Turkish language support
- Dark theme accessibility
- Small screen compatibility (1366x768)
- Proper navigation and form interactions

## Troubleshooting

### Common Issues

1. **WebDriver not found**
   ```bash
   npm run webdriver:update
   ```

2. **Application not running**
   - Ensure the frontend app is running on http://localhost:5173
   - Check if the backend API is also running

3. **Test timeouts**
   - Increase timeout values in test configuration
   - Check if application is responding slowly

4. **Element not found**
   - Verify selectors in page objects match your application
   - Check if UI components have changed

### Debug Mode
Run tests with visible browser for debugging:
```bash
HEADLESS=false npm run test:tansel
```

### Screenshots
Check the `screenshots/` directory for visual verification of test steps.

## Contributing

When adding new tests:
1. Create page objects for new pages
2. Follow the existing naming conventions
3. Include proper error handling and timeouts
4. Add screenshots for verification
5. Update this README with new scenarios
