const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const TestConfig = require('../config/test-config');
const BasePage = require('../page-objects/BasePage');

describe('Tansel Complete Scenario - Steps 1, 2, 3, 4, 5, 6', function() {
  let driver;
  let basePage;
  
  // Test credentials - you may need to adjust these
  const testCredentials = {
    username: 'tansel', // Replace with actual test username
    password: 'Testpassword123!' // Replace with actual test password
  };
  
  // Garden data for Tansel's retirement garden
  const gardenData = {
    name: 'Tansel\'in Emeklilik Bahçesi', // Tansel's Retirement Garden in Turkish
    description: 'Emekliliğimde sebze yetiştirmek ve öğrencilerime bahçıvanlık öğretmek için kurduğum bahçe.', // Turkish description
    coordinates: '41.0082,28.9784' // Istanbul coordinates
  };
  
  // Forum post data for Tansel's teaching post
  const forumPostData = {
    title: 'Yeni Başlayanlar İçin Bahçıvanlık İpuçları', // Gardening Tips for Beginners in Turkish
    content: 'Merhaba arkadaşlar! Emekli öğretmen olarak, bahçıvanlık deneyimlerimi sizlerle paylaşmak istiyorum. İlk bahçenizi kurarken dikkat etmeniz gereken önemli noktalar...' // Turkish content about gardening tips
  };
  
  // Task data for Tansel's garden management
  const taskData = {
    title: 'Kış Hazırlığı Sulama Sistemi', // Winter Preparation Irrigation System in Turkish
    description: 'Bahçenin kış aylarına hazırlanması için sulama sisteminin kontrol edilmesi ve gerekli bakımların yapılması.',
    typeName: 'Bakım Görevi', // Maintenance Task in Turkish
    typeDescription: 'Bahçe bakımı ve sistem kontrolü ile ilgili görevler'
  };
  
  // Increase timeout for E2E tests
  this.timeout(90000);
  
  before(async function() {
    console.log('Setting up Tansel\'s complete scenario test...');
    driver = await TestConfig.createDriver('chrome', false); // Set to true for headless
    basePage = new BasePage(driver);
    
    console.log('Navigating to Community Garden Planner...');
    await basePage.navigateTo(TestConfig.getBaseUrl());
    await basePage.takeScreenshot('01-initial-page-load');
  });
  
  after(async function() {
    if (driver) {
      console.log('Closing browser...');
      await driver.quit();
    }
  });
  
  it('Step 1: Should change language from English to Turkish', async function() {
    console.log('\n🌍 === STEP 1: LANGUAGE SELECTION ===');
    console.log('Tansel prefers Turkish language for better accessibility...');
    
    await basePage.takeScreenshot('02-before-language-change');
    
    // Click language toggle
    console.log('Opening language menu...');
    await basePage.clickLanguageToggle();
    await basePage.takeScreenshot('03-language-menu-opened');
    
    // Select Turkish
    console.log('Selecting Turkish language...');
    await basePage.selectTurkishLanguage();
    await basePage.takeScreenshot('04-after-turkish-selection');
    
    // Verify language change
    const languageChanged = await basePage.verifyLanguageChanged();
    await basePage.takeScreenshot('05-turkish-language-verified');
    
    expect(languageChanged).to.be.true;
    console.log('✅ Step 1 Complete: Interface now in Turkish');
    console.log('=== STEP 1 COMPLETED ===\n');
    
    // Stabilize page before next step
    await basePage.waitForPageStable();
  });
  
  it('Step 2: Should change theme to dark mode for migraine relief', async function() {
    console.log('\n🌙 === STEP 2: DARK THEME SELECTION ===');
    console.log('Tansel switches to dark mode to help with his migraines...');
    
    await basePage.takeScreenshot('06-before-theme-change');
    
    // Click theme toggle
    console.log('Opening theme menu...');
    await basePage.clickThemeToggle();
    await basePage.takeScreenshot('07-theme-menu-opened');
    
    // Select dark mode
    console.log('Selecting dark mode...');
    await basePage.selectDarkMode();
    await basePage.takeScreenshot('08-after-dark-mode-selection');
    
    // Verify dark mode
    const darkModeEnabled = await basePage.verifyDarkModeEnabled();
    await basePage.takeScreenshot('09-dark-mode-verified');
    
    expect(darkModeEnabled).to.be.true;
    console.log('✅ Step 2 Complete: Dark mode enabled for accessibility');
    console.log('=== STEP 2 COMPLETED ===\n');
    
    // Stabilize page before next step
    await basePage.waitForPageStable();
  });
  
  it('Step 3: Should login as Tansel', async function() {
    console.log('\n🔐 === STEP 3: USER LOGIN ===');
    console.log('Tansel logs into his account...');
    
    await basePage.takeScreenshot('10-before-login');
    
    // Perform login
    console.log('Initiating login process...');
    await basePage.performLogin(testCredentials.username, testCredentials.password);
    await basePage.takeScreenshot('11-after-login-attempt');
    
    // Verify login success
    const loginSuccessful = await basePage.verifyLoginSuccess();
    await basePage.takeScreenshot('12-login-verification');
    
    expect(loginSuccessful).to.be.true;
    console.log('✅ Step 3 Complete: Tansel successfully logged in');
    console.log('=== STEP 3 COMPLETED ===\n');
    
    // Stabilize page before next step
    await basePage.waitForPageStable();
  });
  
  it('Step 4: Should create a retirement garden', async function() {
    console.log('\n🌱 === STEP 4: GARDEN CREATION ===');
    console.log('Tansel creates his retirement garden for teaching and growing vegetables...');
    
    await basePage.takeScreenshot('14-before-garden-creation');
    
    // Create the garden
    console.log('Creating garden: ' + gardenData.name);
    await basePage.createGarden(gardenData.name, gardenData.description, gardenData.coordinates);
    await basePage.takeScreenshot('15-after-garden-creation');
    
    // Verify garden was created
    const gardenCreated = await basePage.verifyGardenCreated(gardenData.name);
    await basePage.takeScreenshot('16-garden-verification');
    
    expect(gardenCreated).to.be.true;
    console.log('✅ Step 4 Complete: Retirement garden created successfully');
    console.log('=== STEP 4 COMPLETED ===\n');
    
    // Stabilize page before next step
    await basePage.waitForPageStable();
  });
  
  it('Step 5: Should create a forum post sharing gardening knowledge', async function() {
    console.log('\n🗣️ === STEP 5: FORUM POST CREATION ===');
    console.log('Tansel shares his gardening knowledge as a retired teacher...');
    
    await basePage.takeScreenshot('18-before-forum-post');
    
    // Create the forum post
    console.log('Creating forum post: ' + forumPostData.title);
    await basePage.createForumPost(forumPostData.title, forumPostData.content);
    await basePage.takeScreenshot('19-after-forum-post-creation');
    
    // Verify forum post was created
    const postCreated = await basePage.verifyForumPostCreated(forumPostData.title);
    await basePage.takeScreenshot('20-forum-post-verification');
    
    expect(postCreated).to.be.true;
    console.log('✅ Step 5 Complete: Forum post created successfully');
    console.log('=== STEP 5 COMPLETED ===\n');
    
    // Stabilize page before next step
    await basePage.waitForPageStable();
  });
  
  it('Step 6: Should create a garden management task', async function() {
    console.log('\n📋 === STEP 6: TASK CREATION ===');
    console.log('Tansel creates a maintenance task for his retirement garden...');
    
    await basePage.takeScreenshot('22-before-task-creation');
    
    // Create the task
    console.log('Creating task: ' + taskData.title);
    await basePage.createTask(gardenData.name, taskData.title, taskData.description, taskData.typeName, taskData.typeDescription);
    await basePage.takeScreenshot('23-after-task-creation');
    
    // Verify task was created
    const taskCreated = await basePage.verifyTaskCreated(taskData.title);
    await basePage.takeScreenshot('24-task-verification');
    
    expect(taskCreated).to.be.true;
    console.log('✅ Step 6 Complete: Garden management task created successfully');
    console.log('=== STEP 6 COMPLETED ===\n');
    
    // Stabilize page before final verification
    await basePage.waitForPageStable();
  });
  
  it('Final Verification: Complete Tansel scenario with all features', async function() {
    console.log('\n🎯 === FINAL VERIFICATION ===');
    console.log('Verifying Tansel\'s complete setup: Turkish + Logged In + Dark Mode + Garden + Forum Post + Task...');
    
    await basePage.sleep(3000); // Let everything settle
    await basePage.takeScreenshot('25-final-complete-setup');
    
    // Verify all conditions
    const languageStillTurkish = await basePage.verifyLanguageChanged();
    const stillLoggedIn = await basePage.verifyLoginSuccess();
    const darkModeStillActive = await basePage.verifyDarkModeEnabled();
    const taskStillExists = await basePage.verifyTaskCreated(taskData.title);
    
    // Navigate to check garden (we're currently on garden detail page after task creation)
    const gardenStillExists = await basePage.verifyGardenCreated(gardenData.name);
    
    // Navigate to forum to check post
    await basePage.clickForumButton();
    await basePage.sleep(1000);
    const forumPostStillExists = await basePage.verifyForumPostCreated(forumPostData.content.slice(0, 10));
    
    console.log('✅ Turkish language active:', languageStillTurkish);
    console.log('✅ User logged in:', stillLoggedIn);
    console.log('✅ Dark mode active:', darkModeStillActive);
    console.log('✅ Garden created:', gardenStillExists);
    console.log('✅ Forum post created:', forumPostStillExists);
    console.log('✅ Task created:', taskStillExists);
    
    // All should be true
    expect(languageStillTurkish).to.be.true;
    expect(stillLoggedIn).to.be.true;
    expect(darkModeStillActive).to.be.true;
    expect(gardenStillExists).to.be.true;
    expect(forumPostStillExists).to.be.true;
    expect(taskStillExists).to.be.true;
    
    console.log('\n🎉 SUCCESS: Tansel\'s complete retirement garden management system is ready!');
    console.log('📱 Small screen (1366x768): ✅');
    console.log('🌍 Turkish language: ✅');
    console.log('🔐 Logged in as retired teacher: ✅');
    console.log('🌙 Dark mode (migraine-friendly): ✅');
    console.log('🌱 Retirement garden created: ✅');
    console.log('🗣️ Knowledge sharing forum post: ✅');
    console.log('📋 Garden management task: ✅');
    console.log('\nTansel is now a complete garden community manager! 🎓🌿📝📋');
    console.log('=== TANSEL COMPLETE SCENARIO SUCCESS ===\n');
  });
});
