/**
 * Base Page Object
 * Contains common functionality shared across all page objects
 */

const { By, until, Key } = require('selenium-webdriver');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = 10000;
  }

  /**
   * Navigate to a specific URL
   * @param {string} url - URL to navigate to
   */
  async navigateTo(url) {
    await this.driver.get(url);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.driver.wait(
      until.elementLocated(By.css('body')),
      this.timeout
    );
  }

  /**
   * Find element by CSS selector with wait
   * @param {string} selector - CSS selector
   * @returns {WebElement} Found element
   */
  async findElement(selector) {
    await this.driver.wait(
      until.elementLocated(By.css(selector)),
      this.timeout
    );
    return await this.driver.findElement(By.css(selector));
  }

  /**
   * Find element by text content
   * @param {string} text - Text to search for
   * @returns {WebElement} Found element
   */
  async findElementByText(text) {
    const xpath = `//*[contains(text(), "${text}")]`;
    await this.driver.wait(
      until.elementLocated(By.xpath(xpath)),
      this.timeout
    );
    return await this.driver.findElement(By.xpath(xpath));
  }

  /**
   * Close any open modals or drawers
   */
  async closeModals() {
    // Try multiple approaches to close modals
    const attempts = [
      // Attempt 1: Press Escape key multiple times
      async () => {
        const body = await this.driver.findElement(By.css('body'));
        await body.sendKeys(Key.ESCAPE);
        await this.driver.sleep(300);
        await body.sendKeys(Key.ESCAPE);
        await this.driver.sleep(300);
      },
      
      // Attempt 2: Click on backdrop
      async () => {
        const backdrops = await this.driver.findElements(By.css('.MuiBackdrop-root, .MuiModal-backdrop, [aria-hidden="true"]'));
        for (let backdrop of backdrops) {
          try {
            await backdrop.click();
            await this.driver.sleep(300);
          } catch (error) {
            // Continue to next backdrop
          }
        }
      },
      
      // Attempt 3: Look for close buttons
      async () => {
        const closeButtons = await this.driver.findElements(By.css('button[aria-label="close"], .close, [data-testid="close-button"]'));
        for (let button of closeButtons) {
          try {
            await button.click();
            await this.driver.sleep(300);
          } catch (error) {
            // Continue to next button
          }
        }
      }
    ];

    for (let attempt of attempts) {
      try {
        await attempt();
      } catch (error) {
        // Continue to next attempt
      }
    }
    
    // Final wait for animations to complete
    await this.driver.sleep(500);
  }

  /**
   * Click element with wait
   * @param {string} selector - CSS selector
   */
  async clickElement(selector) {
    const element = await this.findElement(selector);
    await this.driver.wait(until.elementIsEnabled(element), this.timeout);
    await element.click();
  }

  /**
   * Type text into input field
   * @param {string} selector - CSS selector
   * @param {string} text - Text to type
   */
  async typeText(selector, text) {
    const element = await this.findElement(selector);
    await element.clear();
    await element.sendKeys(text);
  }

  /**
   * Wait for element to be visible
   * @param {string} selector - CSS selector
   */
  async waitForElement(selector) {
    await this.driver.wait(
      until.elementLocated(By.css(selector)),
      this.timeout
    );
    const element = await this.driver.findElement(By.css(selector));
    await this.driver.wait(until.elementIsVisible(element), this.timeout);
  }

  /**
   * Check if element exists
   * @param {string} selector - CSS selector
   * @returns {boolean} True if element exists
   */
  async elementExists(selector) {
    try {
      await this.driver.findElement(By.css(selector));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current page title
   * @returns {string} Page title
   */
  async getPageTitle() {
    return await this.driver.getTitle();
  }

  /**
   * Take screenshot
   * @param {string} filename - Screenshot filename
   */
  async takeScreenshot(filename) {
    const screenshot = await this.driver.takeScreenshot();
    const fs = require('fs');
    const path = require('path');
    
    // Ensure the directory exists
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filename, screenshot, 'base64');
  }

  /**
   * Scroll to element
   * @param {string} selector - CSS selector
   */
  async scrollToElement(selector) {
    const element = await this.findElement(selector);
    await this.driver.executeScript(
      'arguments[0].scrollIntoView({behavior: "smooth", block: "center"});',
      element
    );
    await this.driver.sleep(500); // Wait for scroll to complete
  }

  /**
   * Wait for text to appear
   * @param {string} text - Text to wait for
   */
  async waitForText(text) {
    const xpath = `//*[contains(text(), "${text}")]`;
    await this.driver.wait(
      until.elementLocated(By.xpath(xpath)),
      this.timeout
    );
  }
}

module.exports = BasePage;
