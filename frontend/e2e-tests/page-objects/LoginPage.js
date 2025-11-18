/**
 * Login Page Object
 * Handles login page interactions
 */

const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Selectors for login page elements
    this.selectors = {
      usernameInput: 'input[name="username"], input#username',
      passwordInput: 'input[name="password"], input#password',
      loginButton: 'button[type="submit"], button[aria-label="Sign In"]',
      languageToggle: 'button[aria-label="Toggle language"]',
      themeToggle: 'button[aria-label="Change theme"]',
      errorMessage: '.error, .alert, [role="alert"]',
      loginForm: 'form'
    };
  }

  /**
   * Navigate to login page
   * @param {string} baseUrl - Base URL of the application
   */
  async navigateToLogin(baseUrl) {
    await this.navigateTo(`${baseUrl}/auth/login`);
  }

  /**
   * Change language to Turkish
   */
  async changeLanguageToTurkish() {
    try {
      // Look for language toggle button
      const languageButton = await this.findElement(this.selectors.languageToggle);
      await languageButton.click();
      
      // Wait for language change to take effect
      await this.driver.sleep(1000);
      
      // Verify Turkish is selected by checking for Turkish text
      await this.waitForText('Giriş');
    } catch (error) {
      console.log('Language toggle not found or already in Turkish');
    }
  }

  /**
   * Change theme to dark mode
   */
  async changeThemeToDark() {
    try {
      // Look for theme toggle button
      const themeButton = await this.findElement(this.selectors.themeToggle);
      await themeButton.click();
      
      // Wait for theme change to take effect
      await this.driver.sleep(1000);
    } catch (error) {
      console.log('Theme toggle not found');
    }
  }

  /**
   * Perform login
   * @param {string} username - Username or email
   * @param {string} password - Password
   */
  async login(username, password) {
    // Wait for login form to be visible
    await this.waitForElement(this.selectors.loginForm);
    
    // Enter username
    await this.typeText(this.selectors.usernameInput, username);
    
    // Enter password
    await this.typeText(this.selectors.passwordInput, password);
    
    // Click login button
    await this.clickElement(this.selectors.loginButton);
    
    // Wait for navigation or error
    await this.driver.sleep(2000);
  }

  /**
   * Check if login was successful
   * @returns {boolean} True if login successful
   */
  async isLoginSuccessful() {
    try {
      // Check if we're redirected away from login page
      const currentUrl = await this.driver.getCurrentUrl();
      return !currentUrl.includes('/auth/login');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get error message if login failed
   * @returns {string} Error message text
   */
  async getErrorMessage() {
    try {
      const errorElement = await this.findElement(this.selectors.errorMessage);
      return await errorElement.getText();
    } catch (error) {
      return '';
    }
  }
}

module.exports = LoginPage;
