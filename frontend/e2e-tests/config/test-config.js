/**
 * E2E Test Configuration
 * Manages WebDriver setup and test environment configuration
 */

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

class TestConfig {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    this.browser = process.env.BROWSER || 'chrome';
    this.headless = process.env.HEADLESS !== 'false';
    this.timeout = parseInt(process.env.TIMEOUT) || 30000;
    this.implicitWait = parseInt(process.env.IMPLICIT_WAIT) || 10000;
  }

  /**
   * Creates and configures WebDriver instance
   * @returns {WebDriver} Configured WebDriver instance
   */
  async createDriver() {
    let builder = new Builder();

    switch (this.browser.toLowerCase()) {
      case 'chrome':
        const chromeOptions = new chrome.Options();
        if (this.headless) {
          chromeOptions.addArguments('--headless');
        }
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        chromeOptions.addArguments('--window-size=1366,768'); // Small screen for Tansel
        chromeOptions.addArguments('--disable-web-security');
        chromeOptions.addArguments('--allow-running-insecure-content');
        builder = builder.forBrowser('chrome').setChromeOptions(chromeOptions);
        break;

      case 'firefox':
        const firefoxOptions = new firefox.Options();
        if (this.headless) {
          firefoxOptions.addArguments('--headless');
        }
        firefoxOptions.addArguments('--width=1366');
        firefoxOptions.addArguments('--height=768');
        builder = builder.forBrowser('firefox').setFirefoxOptions(firefoxOptions);
        break;

      default:
        throw new Error(`Unsupported browser: ${this.browser}`);
    }

    const driver = await builder.build();
    await driver.manage().setTimeouts({ implicit: this.implicitWait });
    return driver;
  }

  /**
   * Gets the base URL for the application
   * @returns {string} Base URL
   */
  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Gets test timeout value
   * @returns {number} Timeout in milliseconds
   */
  getTimeout() {
    return this.timeout;
  }
}

module.exports = TestConfig;
