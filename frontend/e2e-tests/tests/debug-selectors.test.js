/**
 * Debug Test: Inspect UI Elements and Selectors
 * This test helps identify the correct selectors for the actual UI
 */

const { describe, it, before, after } = require('mocha');
const TestConfig = require('../config/test-config');
const BasePage = require('../page-objects/BasePage');

describe('Debug UI Selectors', function() {
  let driver;
  let testConfig;
  let basePage;

  before(async function() {
    this.timeout(30000);
    testConfig = new TestConfig();
    driver = await testConfig.createDriver();
    basePage = new BasePage(driver);
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  it('Should inspect the home page structure', async function() {
    this.timeout(30000);
    
    // Navigate to the application
    await basePage.navigateTo(testConfig.getBaseUrl());
    
    // Wait for page to load
    await driver.sleep(3000);
    
    // Get page title
    const title = await driver.getTitle();
    console.log(`Page title: ${title}`);
    
    // Get current URL
    const url = await driver.getCurrentUrl();
    console.log(`Current URL: ${url}`);
    
    // Find all navigation links
    try {
      const navLinks = await driver.findElements({ css: 'nav a, header a' });
      console.log(`Found ${navLinks.length} navigation links:`);
      
      for (let i = 0; i < Math.min(navLinks.length, 10); i++) {
        const link = navLinks[i];
        const href = await link.getAttribute('href');
        const text = await link.getText();
        console.log(`  - Link ${i + 1}: "${text}" -> ${href}`);
      }
    } catch (error) {
      console.log('No navigation links found');
    }
    
    // Find all buttons
    try {
      const buttons = await driver.findElements({ css: 'button' });
      console.log(`Found ${buttons.length} buttons:`);
      
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const button = buttons[i];
        const text = await button.getText();
        const type = await button.getAttribute('type');
        const ariaLabel = await button.getAttribute('aria-label');
        const testId = await button.getAttribute('data-testid');
        console.log(`  - Button ${i + 1}: "${text}" (type: ${type}, aria-label: ${ariaLabel}, testid: ${testId})`);
      }
    } catch (error) {
      console.log('No buttons found');
    }
    
    // Find all input fields
    try {
      const inputs = await driver.findElements({ css: 'input' });
      console.log(`Found ${inputs.length} input fields:`);
      
      for (let i = 0; i < Math.min(inputs.length, 10); i++) {
        const input = inputs[i];
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        console.log(`  - Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}"`);
      }
    } catch (error) {
      console.log('No input fields found');
    }
    
    // Take a screenshot for visual inspection
    await basePage.takeScreenshot('./e2e-tests/screenshots/debug-homepage.png');
    
    console.log('Debug inspection complete. Check screenshots/debug-homepage.png');
  });

  it('Should inspect the login page structure', async function() {
    this.timeout(30000);
    
    // Navigate to login page
    await basePage.navigateTo(`${testConfig.getBaseUrl()}/auth/login`);
    await driver.sleep(3000);
    
    console.log('\\n=== LOGIN PAGE INSPECTION ===');
    
    // Get page title
    const title = await driver.getTitle();
    console.log(`Login page title: ${title}`);
    
    // Find login form elements
    try {
      const forms = await driver.findElements({ css: 'form' });
      console.log(`Found ${forms.length} forms`);
      
      const inputs = await driver.findElements({ css: 'input' });
      console.log(`Found ${inputs.length} input fields on login page:`);
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        const id = await input.getAttribute('id');
        console.log(`  - Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}", id="${id}"`);
      }
      
      const buttons = await driver.findElements({ css: 'button' });
      console.log(`Found ${buttons.length} buttons on login page:`);
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const text = await button.getText();
        const type = await button.getAttribute('type');
        const ariaLabel = await button.getAttribute('aria-label');
        console.log(`  - Button ${i + 1}: "${text}" (type: ${type}, aria-label: ${ariaLabel})`);
      }
    } catch (error) {
      console.log('Error inspecting login page:', error.message);
    }
    
    // Take a screenshot
    await basePage.takeScreenshot('./e2e-tests/screenshots/debug-loginpage.png');
    
    console.log('Login page inspection complete. Check screenshots/debug-loginpage.png');
  });
});
