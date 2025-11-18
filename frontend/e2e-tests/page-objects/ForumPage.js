/**
 * Forum Page Object
 * Handles forum-related page interactions
 */

const BasePage = require('./BasePage');

class ForumPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Selectors for forum page elements
    this.selectors = {
      // Navigation
      forumNavLink: 'a[href="/forum"]',
      
      // Create post elements
      createPostButton: 'button[aria-label*="create"], button[aria-label*="post"], [data-testid="create-post"]',
      postTitleInput: 'input[name="title"], input[placeholder*="Title"], input[placeholder*="Başlık"]',
      postContentInput: 'textarea[name="content"], textarea[placeholder*="Content"], textarea[placeholder*="İçerik"]',
      submitPostButton: 'button[type="submit"]',
      
      // Post list elements
      postCard: '.post-card, [data-testid="post-card"], .forum-post',
      postTitle: '.post-title, h3, h4',
      postContent: '.post-content, .post-description, p',
      postAuthor: '.post-author, .author',
      postDate: '.post-date, .date',
      
      // Modal elements
      modal: '[role="dialog"], .modal, .MuiDialog-root',
      modalTitle: '.modal-title, .MuiDialogTitle-root',
      closeModalButton: 'button[aria-label="close"], .close, [data-testid="close-button"]',
      
      // Post interaction elements
      likeButton: '[aria-label*="like"], [data-testid="like-button"]',
      commentButton: '[aria-label*="comment"], [data-testid="comment-button"]',
      shareButton: '[aria-label*="share"], [data-testid="share-button"]'
    };
  }

  /**
   * Navigate to forum page
   * @param {string} baseUrl - Base URL of the application
   */
  async navigateToForum(baseUrl) {
    await this.navigateTo(`${baseUrl}/forum`);
  }

  /**
   * Click on forum navigation button
   */
  async clickForumNav() {
    // Close any open modals first
    await this.closeModals();
    await this.driver.sleep(1000); // Wait for modal cleanup
    
    // Use findElementByText to find the Forum button
    const forumButton = await this.findElementByText('Forum');
    
    // Use JavaScript click to avoid interception issues
    await this.driver.executeScript('arguments[0].click();', forumButton);
    await this.driver.sleep(2000);
  }

  /**
   * Click create post button
   */
  async clickCreatePost() {
    await this.waitForElement(this.selectors.createPostButton);
    await this.clickElement(this.selectors.createPostButton);
    
    // Wait for modal to open
    await this.waitForElement(this.selectors.modal);
  }

  /**
   * Create a new forum post
   * @param {Object} postInfo - Post information
   * @param {string} postInfo.title - Post title
   * @param {string} postInfo.content - Post content
   */
  async createPost(postInfo) {
    // Fill post title
    await this.typeText(this.selectors.postTitleInput, postInfo.title);
    
    // Fill post content
    await this.typeText(this.selectors.postContentInput, postInfo.content);
    
    // Submit post
    await this.clickElement(this.selectors.submitPostButton);
    
    // Wait for modal to close or success message
    await this.driver.sleep(2000);
  }

  /**
   * Check if post was created successfully
   * @param {string} postTitle - Title of the post to look for
   * @returns {boolean} True if post exists in the list
   */
  async isPostCreated(postTitle) {
    try {
      await this.waitForText(postTitle);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of forum posts
   * @returns {Array} Array of post information
   */
  async getPostList() {
    const posts = [];
    
    try {
      const postCards = await this.driver.findElements(
        this.selectors.postCard
      );
      
      for (let card of postCards) {
        try {
          const title = await card.findElement(this.selectors.postTitle);
          const content = await card.findElement(this.selectors.postContent);
          
          posts.push({
            title: await title.getText(),
            content: await content.getText()
          });
        } catch (error) {
          // Skip posts that don't have expected structure
          continue;
        }
      }
    } catch (error) {
      console.log('No posts found or error reading post list');
    }
    
    return posts;
  }

  /**
   * Click on a specific post
   * @param {string} postTitle - Title of the post to click
   */
  async clickPost(postTitle) {
    const xpath = `//h3[contains(text(), "${postTitle}")] | //h4[contains(text(), "${postTitle}")]`;
    const postElement = await this.driver.findElement({ xpath });
    await postElement.click();
    await this.driver.sleep(1000);
  }

  /**
   * Like a post
   * @param {string} postTitle - Title of the post to like
   */
  async likePost(postTitle) {
    // First click on the post to open it
    await this.clickPost(postTitle);
    
    // Then click the like button
    try {
      await this.clickElement(this.selectors.likeButton);
      await this.driver.sleep(500);
    } catch (error) {
      console.log('Like button not found or already liked');
    }
  }

  /**
   * Search for posts
   * @param {string} searchTerm - Term to search for
   */
  async searchPosts(searchTerm) {
    try {
      const searchInput = await this.findElement('input[type="search"], input[placeholder*="Search"], input[placeholder*="Ara"]');
      await this.typeText('input[type="search"], input[placeholder*="Search"], input[placeholder*="Ara"]', searchTerm);
      
      // Press Enter or click search button
      await searchInput.sendKeys('\n');
      await this.driver.sleep(1000);
    } catch (error) {
      console.log('Search functionality not available');
    }
  }

  /**
   * Filter posts by category or tag
   * @param {string} category - Category to filter by
   */
  async filterPostsByCategory(category) {
    try {
      const filterButton = await this.findElementByText(category);
      await filterButton.click();
      await this.driver.sleep(1000);
    } catch (error) {
      console.log(`Category filter "${category}" not found`);
    }
  }
}

module.exports = ForumPage;
