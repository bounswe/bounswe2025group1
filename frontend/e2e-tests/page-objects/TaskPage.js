/**
 * Task Page Object
 * Handles task-related page interactions
 */

const BasePage = require('./BasePage');

class TaskPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Selectors for task page elements
    this.selectors = {
      // Navigation
      tasksNavLink: 'a[href="/tasks"]',
      
      // Create task elements
      createTaskButton: 'button[aria-label*="create"], button[aria-label*="task"], [data-testid="create-task"]',
      taskTitleInput: 'input[name="title"], input[placeholder*="Task"], input[placeholder*="Görev"]',
      taskDescriptionInput: 'textarea[name="description"], textarea[placeholder*="Description"], textarea[placeholder*="Açıklama"]',
      taskTypeSelect: 'select[name="type"], [role="combobox"]',
      taskPrioritySelect: 'select[name="priority"], select[name="öncelik"]',
      taskDueDateInput: 'input[type="date"], input[name="dueDate"]',
      assigneeSelect: 'select[name="assignee"], select[name="atanan"]',
      submitTaskButton: 'button[type="submit"]',
      
      // Task list elements
      taskCard: '.task-card, [data-testid="task-card"], .task-item',
      taskTitle: '.task-title, h3, h4',
      taskDescription: '.task-description, p',
      taskStatus: '.task-status, .status',
      taskPriority: '.task-priority, .priority',
      taskAssignee: '.task-assignee, .assignee',
      
      // Task status elements
      statusPending: '.status-pending, [data-status="pending"]',
      statusInProgress: '.status-in-progress, [data-status="in-progress"]',
      statusCompleted: '.status-completed, [data-status="completed"]',
      
      // Task actions
      editTaskButton: '[aria-label*="edit"], [data-testid="edit-task"]',
      deleteTaskButton: '[aria-label*="delete"], [data-testid="delete-task"]',
      completeTaskButton: '[aria-label*="complete"], [data-testid="complete-task"]',
      
      // Modal elements
      modal: '[role="dialog"], .modal, .MuiDialog-root',
      modalTitle: '.modal-title, .MuiDialogTitle-root',
      closeModalButton: 'button[aria-label="close"], .close, [data-testid="close-button"]'
    };
  }

  /**
   * Navigate to tasks page
   * @param {string} baseUrl - Base URL of the application
   */
  async navigateToTasks(baseUrl) {
    await this.navigateTo(`${baseUrl}/tasks`);
  }

  /**
   * Click on tasks navigation (might be under Dashboard)
   */
  async clickTasksNav() {
    try {
      // First try to find a Tasks button
      const tasksButton = await this.findElementByText('Tasks');
      await tasksButton.click();
    } catch (error) {
      // If not found, try Dashboard button
      console.log('Tasks button not found, trying Dashboard...');
      const dashboardButton = await this.findElementByText('Dashboard');
      await dashboardButton.click();
    }
    await this.driver.sleep(1000);
  }

  /**
   * Click create task button
   */
  async clickCreateTask() {
    await this.waitForElement(this.selectors.createTaskButton);
    await this.clickElement(this.selectors.createTaskButton);
    
    // Wait for modal to open
    await this.waitForElement(this.selectors.modal);
  }

  /**
   * Create a new task
   * @param {Object} taskInfo - Task information
   * @param {string} taskInfo.title - Task title
   * @param {string} taskInfo.description - Task description
   * @param {string} taskInfo.type - Task type (e.g., 'watering', 'planting')
   * @param {string} taskInfo.priority - Task priority (e.g., 'high', 'medium', 'low')
   * @param {string} taskInfo.dueDate - Due date (YYYY-MM-DD format)
   * @param {string} taskInfo.assignee - Person assigned to task
   */
  async createTask(taskInfo) {
    // Fill task title
    await this.typeText(this.selectors.taskTitleInput, taskInfo.title);
    
    // Fill task description
    await this.typeText(this.selectors.taskDescriptionInput, taskInfo.description);
    
    // Select task type if provided
    if (taskInfo.type) {
      try {
        const typeSelect = await this.findElement(this.selectors.taskTypeSelect);
        await typeSelect.click();
        
        // Find and click the option
        const optionXpath = `//option[contains(text(), "${taskInfo.type}")]`;
        const option = await this.driver.findElement({ xpath: optionXpath });
        await option.click();
      } catch (error) {
        console.log('Task type selection not available');
      }
    }
    
    // Select priority if provided
    if (taskInfo.priority) {
      try {
        const prioritySelect = await this.findElement(this.selectors.taskPrioritySelect);
        await prioritySelect.click();
        
        // Find and click the option
        const optionXpath = `//option[contains(text(), "${taskInfo.priority}")]`;
        const option = await this.driver.findElement({ xpath: optionXpath });
        await option.click();
      } catch (error) {
        console.log('Priority selection not available');
      }
    }
    
    // Set due date if provided
    if (taskInfo.dueDate) {
      try {
        await this.typeText(this.selectors.taskDueDateInput, taskInfo.dueDate);
      } catch (error) {
        console.log('Due date input not available');
      }
    }
    
    // Select assignee if provided
    if (taskInfo.assignee) {
      try {
        const assigneeSelect = await this.findElement(this.selectors.assigneeSelect);
        await assigneeSelect.click();
        
        // Find and click the assignee option
        const optionXpath = `//option[contains(text(), "${taskInfo.assignee}")]`;
        const option = await this.driver.findElement({ xpath: optionXpath });
        await option.click();
      } catch (error) {
        console.log('Assignee selection not available');
      }
    }
    
    // Submit task
    await this.clickElement(this.selectors.submitTaskButton);
    
    // Wait for modal to close or success message
    await this.driver.sleep(2000);
  }

  /**
   * Check if task was created successfully
   * @param {string} taskTitle - Title of the task to look for
   * @returns {boolean} True if task exists in the list
   */
  async isTaskCreated(taskTitle) {
    try {
      await this.waitForText(taskTitle);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of tasks
   * @returns {Array} Array of task information
   */
  async getTaskList() {
    const tasks = [];
    
    try {
      const taskCards = await this.driver.findElements(
        this.selectors.taskCard
      );
      
      for (let card of taskCards) {
        try {
          const title = await card.findElement(this.selectors.taskTitle);
          const description = await card.findElement(this.selectors.taskDescription);
          const status = await card.findElement(this.selectors.taskStatus);
          
          tasks.push({
            title: await title.getText(),
            description: await description.getText(),
            status: await status.getText()
          });
        } catch (error) {
          // Skip tasks that don't have expected structure
          continue;
        }
      }
    } catch (error) {
      console.log('No tasks found or error reading task list');
    }
    
    return tasks;
  }

  /**
   * Complete a task
   * @param {string} taskTitle - Title of the task to complete
   */
  async completeTask(taskTitle) {
    // Find the task card containing the title
    const xpath = `//h3[contains(text(), "${taskTitle}")] | //h4[contains(text(), "${taskTitle}")]`;
    const taskElement = await this.driver.findElement({ xpath });
    
    // Find the complete button within the same card
    const taskCard = await taskElement.findElement({ xpath: './ancestor::*[contains(@class, "task-card") or contains(@class, "task-item")]' });
    const completeButton = await taskCard.findElement(this.selectors.completeTaskButton);
    
    await completeButton.click();
    await this.driver.sleep(1000);
  }

  /**
   * Filter tasks by status
   * @param {string} status - Status to filter by ('pending', 'in-progress', 'completed')
   */
  async filterTasksByStatus(status) {
    try {
      const filterSelector = this.selectors[`status${status.charAt(0).toUpperCase() + status.slice(1).replace('-', '')}`];
      await this.clickElement(filterSelector);
      await this.driver.sleep(1000);
    } catch (error) {
      console.log(`Status filter "${status}" not found`);
    }
  }

  /**
   * Search for tasks
   * @param {string} searchTerm - Term to search for
   */
  async searchTasks(searchTerm) {
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
}

module.exports = TaskPage;
