const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const TestConfig = require('../config/test-config');
const BasePage = require('../page-objects/BasePage');

describe('Language and Theme Selection Test - Tansel Scenario Steps 1-3', function() {
  let driver;
  let basePage;
  
  // Increase timeout for E2E tests
  this.timeout(45000);
  
  before(async function() {
    console.log('Setting up test environment...');
    driver = await TestConfig.createDriver('chrome', false); // Set to true for headless
    basePage = new BasePage(driver);
    
    console.log('Navigating to application...');
    await basePage.navigateTo(TestConfig.getBaseUrl());
    await basePage.takeScreenshot('01-initial-page-load');
  });
  
  after(async function() {
    if (driver) {
      console.log('Closing browser...');
      await driver.quit();
    }
  });
  
  it('should change language from English to Turkish', async function() {
    console.log('\n=== Step 1: Language Selection ===');
    
    // Take initial screenshot
    await basePage.takeScreenshot('02-before-language-change');
    
    // Click language toggle button
    console.log('Clicking language toggle button...');
    await basePage.clickLanguageToggle();
    await basePage.takeScreenshot('03-language-menu-opened');
    
    // Select Turkish language
    console.log('Selecting Turkish language...');
    await basePage.selectTurkishLanguage();
    await basePage.takeScreenshot('04-after-turkish-selection');
    
    // Verify language changed
    console.log('Verifying language change...');
    const languageChanged = await basePage.verifyLanguageChanged();
    await basePage.takeScreenshot('05-language-verification');
    
    // Assertion
    expect(languageChanged).to.be.true;
    console.log('✅ Language successfully changed to Turkish!');
    console.log('=== Step 1 Completed ===\n');
  });
  
  it('should change theme from light to dark mode', async function() {
    console.log('\n=== Step 3: Theme Selection (Dark Mode) ===');
    
    // Wait a bit to ensure language change is fully applied
    await basePage.sleep(2000);
    await basePage.takeScreenshot('06-before-theme-change');
    
    // Click theme toggle button
    console.log('Clicking theme toggle button...');
    await basePage.clickThemeToggle();
    await basePage.takeScreenshot('07-theme-menu-opened');
    
    // Select dark mode
    console.log('Selecting dark mode...');
    await basePage.selectDarkMode();
    await basePage.takeScreenshot('08-after-dark-mode-selection');
    
    // Verify dark mode is enabled
    console.log('Verifying dark mode is enabled...');
    const darkModeEnabled = await basePage.verifyDarkModeEnabled();
    await basePage.takeScreenshot('09-dark-mode-verification');
    
    // Assertion
    expect(darkModeEnabled).to.be.true;
    console.log('✅ Theme successfully changed to dark mode!');
    console.log('=== Step 3 Completed ===\n');
  });
  
  it('should verify final state: Turkish language + Dark theme', async function() {
    console.log('\n=== Final Verification: Turkish + Dark Mode ===');
    
    // Wait for all changes to settle
    await basePage.sleep(3000);
    
    // Take final screenshot
    await basePage.takeScreenshot('10-final-turkish-dark-interface');
    
    // Verify both Turkish language and dark mode are active
    const languageStillTurkish = await basePage.verifyLanguageChanged();
    const themeStillDark = await basePage.verifyDarkModeEnabled();
    
    console.log('Turkish language active:', languageStillTurkish);
    console.log('Dark mode active:', themeStillDark);
    
    // Both should be true
    expect(languageStillTurkish).to.be.true;
    expect(themeStillDark).to.be.true;
    
    console.log('✅ Final state verified: Turkish language + Dark theme!');
    console.log('=== Tansel\'s accessibility preferences set successfully ===\n');
  });
});
