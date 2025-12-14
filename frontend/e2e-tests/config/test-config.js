const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

class TestConfig {
  static async createDriver(browserName = 'chrome', headless = false) {
    let driver;
    
    switch (browserName.toLowerCase()) {
      case 'chrome':
        const chromeOptions = new chrome.Options();
        if (headless) {
          chromeOptions.addArguments('--headless');
        }
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        chromeOptions.addArguments('--window-size=1366,768'); // Tansel's small screen
        
        driver = await new Builder()
          .forBrowser('chrome')
          .setChromeOptions(chromeOptions)
          .build();
        break;
        
      case 'firefox':
        const firefoxOptions = new firefox.Options();
        if (headless) {
          firefoxOptions.addArguments('--headless');
        }
        firefoxOptions.addArguments('--width=1366');
        firefoxOptions.addArguments('--height=768');
        
        driver = await new Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(firefoxOptions)
          .build();
        break;
        
      default:
        throw new Error(`Unsupported browser: ${browserName}`);
    }
    
    // Set window size for Tansel's small screen
    await driver.manage().window().setRect({ width: 1366, height: 768 });
    
    return driver;
  }
  
  static getBaseUrl() {
    return process.env.BASE_URL || 'http://localhost:5173';
  }
  
  static getDefaultTimeout() {
    return 10000; // 10 seconds
  }
  
  static async takeScreenshot(driver, filename) {
    try {
      const screenshot = await driver.takeScreenshot();
      const fs = require('fs');
      const path = require('path');
      
      const screenshotDir = path.join(__dirname, '../screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      const filepath = path.join(screenshotDir, `${filename}.png`);
      fs.writeFileSync(filepath, screenshot, 'base64');
      console.log(`Screenshot saved: ${filepath}`);
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  }
}

module.exports = TestConfig;
