/**
 * E2E Test: Tansel's Garden Creation and Task Management Scenario
 * 
 * User Persona: Tansel Arabacı (58) - Retired teacher from İstanbul/Kadıköy
 * - Turkish speaker with small laptop screen
 * - Sometimes experiences migraines (needs dark theme)
 * - Wants to find help and company for his hobby garden
 */

const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const TestConfig = require('../config/test-config');
const LoginPage = require('../page-objects/LoginPage');
const GardenPage = require('../page-objects/GardenPage');
const ForumPage = require('../page-objects/ForumPage');
const TaskPage = require('../page-objects/TaskPage');

describe('Tansel Garden Creation and Task Management Scenario', function() {
  let driver;
  let testConfig;
  let loginPage;
  let gardenPage;
  let forumPage;
  let taskPage;
  
  // Test data for Tansel's scenario
  const testData = {
    user: {
      username: 'tanselarabaci',
      password: 'TanselGarden123!'
    },
    garden: {
      name: 'Tansel\'in Kadıköy Bahçesi',
      description: 'Emekli bir öğretmen olarak hobim haline gelen bahçem. Yardım ve arkadaşlık arıyorum.',
      location: 'Kadıköy, İstanbul',
      isPublic: true
    },
    forumPost: {
      title: 'Yeni Bahçeme Katılmak İsteyen Var mı?',
      content: 'Merhaba arkadaşlar, Kadıköy\'de yeni bir bahçe edindim. Emekli bir öğretmenim ve bahçıvanlık konusunda yardıma ihtiyacım var. Birlikte çalışmak isteyen arkadaşlar varsa çok memnun olurum. Özellikle sulama ve bakım konularında deneyimli kişilerle tanışmak istiyorum.'
    },
    task: {
      title: 'Haftalık Sulama Görevi',
      description: 'Bahçedeki tüm bitkilerin düzenli olarak sulanması gerekiyor. Özellikle domates ve biber fidelerine dikkat edilmeli.',
      type: 'Sulama',
      priority: 'Yüksek',
      dueDate: '2025-11-18' // One week from test date
    }
  };

  before(async function() {
    this.timeout(60000); // 60 seconds timeout for setup
    
    testConfig = new TestConfig();
    driver = await testConfig.createDriver();
    
    // Initialize page objects
    loginPage = new LoginPage(driver);
    gardenPage = new GardenPage(driver);
    forumPage = new ForumPage(driver);
    taskPage = new TaskPage(driver);
    
    console.log('Test setup completed');
  });

  after(async function() {
    if (driver) {
      await driver.quit();
      console.log('Test cleanup completed');
    }
  });

  describe('Tansel\'s Complete Garden Management Journey', function() {
    
    it('Should complete Tansel\'s entire user journey', async function() {
      this.timeout(300000); // 5 minutes for the entire journey
      
      console.log('🚀 Starting Tansel\'s complete garden management journey...');
      
      // Step 1: Navigate and change language to Turkish
      console.log('📍 Step 1: Changing language to Turkish...');
      await loginPage.navigateTo(testConfig.getBaseUrl());
      await loginPage.changeLanguageToTurkish();
      const pageTitle = await loginPage.getPageTitle();
      console.log(`Page title after language change: ${pageTitle}`);
      await loginPage.takeScreenshot('./e2e-tests/screenshots/01-language-turkish.png');
      
      // Step 2: Login
      console.log('📍 Step 2: Logging in...');
      await loginPage.navigateToLogin(testConfig.getBaseUrl());
      await loginPage.login(testData.user.username, testData.user.password);
      const isLoggedIn = await loginPage.isLoginSuccessful();
      expect(isLoggedIn).to.be.true;
      console.log('✅ Tansel logged in successfully');
      await loginPage.takeScreenshot('./e2e-tests/screenshots/02-login-success.png');
      
      // Step 3: Change theme to dark mode
      console.log('📍 Step 3: Changing to dark theme...');
      await loginPage.changeThemeToDark();
      await driver.sleep(2000);
      console.log('✅ Changed to dark theme for better accessibility');
      await loginPage.takeScreenshot('./e2e-tests/screenshots/03-dark-theme.png');
      
      // Step 4: Navigate to Gardens section
      console.log('📍 Step 4: Navigating to Gardens section...');
      await gardenPage.clickGardensNav();
      const gardensUrl = await driver.getCurrentUrl();
      expect(gardensUrl).to.include('/gardens');
      console.log('✅ Navigated to Gardens section');
      await gardenPage.takeScreenshot('./e2e-tests/screenshots/04-gardens-page.png');
      
      // Step 5: Create a new garden
      console.log('📍 Step 5: Creating a new garden...');
      await gardenPage.clickAddGarden();
      await gardenPage.fillGardenForm(testData.garden);
      await gardenPage.saveGarden();
      const isGardenCreated = await gardenPage.isGardenCreated(testData.garden.name);
      expect(isGardenCreated).to.be.true;
      console.log(`✅ Garden "${testData.garden.name}" created successfully`);
      await gardenPage.takeScreenshot('./e2e-tests/screenshots/05-garden-created.png');
      
      // Step 6: Navigate to Forum section
      console.log('📍 Step 6: Navigating to Forum section...');
      await forumPage.clickForumNav();
      const forumUrl = await driver.getCurrentUrl();
      expect(forumUrl).to.include('/forum');
      console.log('✅ Navigated to Forum section');
      await forumPage.takeScreenshot('./e2e-tests/screenshots/06-forum-page.png');
      
      // Step 7: Create a forum post about the new garden
      console.log('📍 Step 7: Creating forum post...');
      await forumPage.clickCreatePost();
      await forumPage.createPost(testData.forumPost);
      const isPostCreated = await forumPage.isPostCreated(testData.forumPost.title);
      expect(isPostCreated).to.be.true;
      console.log(`✅ Forum post "${testData.forumPost.title}" created successfully`);
      await forumPage.takeScreenshot('./e2e-tests/screenshots/07-forum-post-created.png');
      
      // Step 8: Navigate to Tasks section
      console.log('📍 Step 8: Navigating to Tasks section...');
      await taskPage.clickTasksNav();
      const tasksUrl = await driver.getCurrentUrl();
      expect(tasksUrl).to.include('/tasks');
      console.log('✅ Navigated to Tasks section');
      await taskPage.takeScreenshot('./e2e-tests/screenshots/08-tasks-page.png');
      
      // Step 9: Create a watering task for garden workers
      console.log('📍 Step 9: Creating watering task...');
      await taskPage.clickCreateTask();
      await taskPage.createTask(testData.task);
      const isTaskCreated = await taskPage.isTaskCreated(testData.task.title);
      expect(isTaskCreated).to.be.true;
      console.log(`✅ Task "${testData.task.title}" created successfully`);
      await taskPage.takeScreenshot('./e2e-tests/screenshots/09-task-created.png');
      
      // Step 10: Verify complete scenario success
      console.log('📍 Step 10: Verifying complete scenario...');
      const gardens = await gardenPage.getGardenList();
      const posts = await forumPage.getPostList();
      const tasks = await taskPage.getTaskList();
      
      const gardenExists = gardens.some(garden => 
        garden.name.includes('Tansel') || garden.name.includes('Kadıköy')
      );
      const postExists = posts.some(post => 
        post.title.includes('Bahçeme') || post.title.includes('Katılmak')
      );
      const taskExists = tasks.some(task => 
        task.title.includes('Sulama') || task.title.includes('Haftalık')
      );
      
      expect(gardenExists).to.be.true;
      expect(postExists).to.be.true;
      expect(taskExists).to.be.true;
      
      console.log('🎉 Tansel\'s complete garden management scenario completed successfully!');
      console.log(`✅ Created garden: Found ${gardens.length} gardens`);
      console.log(`✅ Created forum post: Found ${posts.length} posts`);
      console.log(`✅ Created task: Found ${tasks.length} tasks`);
      
      await taskPage.takeScreenshot('./e2e-tests/screenshots/10-scenario-complete.png');
    });
  });

  describe('Accessibility and Usability Verification', function() {
    
    it('Should verify Turkish language support throughout the journey', async function() {
      this.timeout(15000);
      
      // Check for Turkish text in various sections
      const turkishTexts = [
        'Bahçe', 'Forum', 'Görevler', 'Giriş', 'Çıkış'
      ];
      
      let turkishSupported = false;
      for (let text of turkishTexts) {
        try {
          await loginPage.waitForText(text);
          turkishSupported = true;
          break;
        } catch (error) {
          continue;
        }
      }
      
      expect(turkishSupported).to.be.true;
      console.log('✅ Turkish language support verified');
    });

    it('Should verify dark theme is applied for accessibility', async function() {
      this.timeout(10000);
      
      // Check if dark theme classes or styles are applied
      const bodyElement = await driver.findElement({ css: 'body' });
      const backgroundColor = await bodyElement.getCssValue('background-color');
      
      // Dark theme should have dark background (not white)
      const isDarkTheme = !backgroundColor.includes('255, 255, 255') && 
                         !backgroundColor.includes('rgb(255, 255, 255)');
      
      expect(isDarkTheme).to.be.true;
      console.log('✅ Dark theme accessibility verified');
    });

    it('Should verify small screen compatibility', async function() {
      this.timeout(10000);
      
      // Set small screen size (Tansel's laptop)
      await driver.manage().window().setRect({ width: 1366, height: 768 });
      
      // Verify page is still usable
      const isPageUsable = await gardenPage.elementExists('nav') && 
                          await gardenPage.elementExists('main');
      
      expect(isPageUsable).to.be.true;
      console.log('✅ Small screen compatibility verified');
    });
  });
});

// Helper function to add chai assertion library
const chai = require('chai');
global.expect = chai.expect;
