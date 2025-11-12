// File: services/__tests__/task.test.ts

import axios from 'axios';
import {
  validateTaskData,
  formatDateForAPI,
  createTaskPayload,
  createTask,
  fetchTasksForGarden,
  fetchTaskById,
  updateTask,
  deleteTask,
  markTaskAsCompleted,
  Task,
  CreateTaskPayload,
} from '../task';
import { API_URL } from '../../constants/Config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Task Utility Functions', () => {
  describe('validateTaskData', () => {
    it('should return valid for correct task data', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateTaskData('Test Task', 'Test Description', tomorrow);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid when title is empty', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateTaskData('', 'Test Description', tomorrow);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should return invalid when title is only whitespace', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateTaskData('   ', 'Test Description', tomorrow);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should return invalid when title exceeds 200 characters', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const longTitle = 'a'.repeat(201);

      const result = validateTaskData(longTitle, 'Test Description', tomorrow);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title must be 200 characters or less');
    });

    it('should return invalid when description is empty', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateTaskData('Test Task', '', tomorrow);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Description is required');
    });

    it('should return invalid when description is only whitespace', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateTaskData('Test Task', '   ', tomorrow);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Description is required');
    });

    it('should return invalid when description exceeds 1000 characters', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const longDescription = 'a'.repeat(1001);

      const result = validateTaskData('Test Task', longDescription, tomorrow);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Description must be 1000 characters or less');
    });

    it('should return invalid when due date is null', () => {
      const result = validateTaskData('Test Task', 'Test Description', null);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Due date is required');
    });

    it('should return invalid when due date is invalid', () => {
      const invalidDate = new Date('invalid');

      const result = validateTaskData('Test Task', 'Test Description', invalidDate);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid due date');
    });

    it('should return invalid when due date is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = validateTaskData('Test Task', 'Test Description', yesterday);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Due date cannot be in the past');
    });

    it('should return valid when due date is today', () => {
      const today = new Date();

      const result = validateTaskData('Test Task', 'Test Description', today);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept title with exactly 200 characters', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const maxTitle = 'a'.repeat(200);

      const result = validateTaskData(maxTitle, 'Test Description', tomorrow);

      expect(result.isValid).toBe(true);
    });

    it('should accept description with exactly 1000 characters', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const maxDescription = 'a'.repeat(1000);

      const result = validateTaskData('Test Task', maxDescription, tomorrow);

      expect(result.isValid).toBe(true);
    });
  });

  describe('formatDateForAPI', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2025-12-25T10:30:00');
      const formatted = formatDateForAPI(date);

      expect(formatted).toBe(date.toISOString());
      expect(formatted).toContain('2025-12-25');
    });

    it('should handle current date', () => {
      const now = new Date();
      const formatted = formatDateForAPI(now);

      expect(formatted).toBe(now.toISOString());
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('createTaskPayload', () => {
    it('should create a valid task payload with number garden ID', () => {
      const dueDate = new Date('2025-12-25T10:30:00');
      const payload = createTaskPayload(123, 'Test Task', 'Test Description', dueDate);

      expect(payload).toEqual({
        garden: 123,
        title: 'Test Task',
        description: 'Test Description',
        due_date: dueDate.toISOString(),
      });
    });

    it('should create a valid task payload with string garden ID', () => {
      const dueDate = new Date('2025-12-25T10:30:00');
      const payload = createTaskPayload('456', 'Test Task', 'Test Description', dueDate);

      expect(payload).toEqual({
        garden: '456',
        title: 'Test Task',
        description: 'Test Description',
        due_date: dueDate.toISOString(),
      });
    });

    it('should trim whitespace from title and description', () => {
      const dueDate = new Date('2025-12-25T10:30:00');
      const payload = createTaskPayload(
        123,
        '  Test Task  ',
        '  Test Description  ',
        dueDate
      );

      expect(payload.title).toBe('Test Task');
      expect(payload.description).toBe('Test Description');
    });
  });

  describe('createTask', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a task successfully', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        due_date: '2025-12-25T10:30:00.000Z',
        garden: 123,
        status: 'pending',
      };

      const payload: CreateTaskPayload = {
        garden: 123,
        title: 'Test Task',
        description: 'Test Description',
        due_date: '2025-12-25T10:30:00.000Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockTask });

      const result = await createTask(payload, 'test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/tasks/`,
        payload,
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockTask);
    });

    it('should throw error when API request fails', async () => {
      const payload: CreateTaskPayload = {
        garden: 123,
        title: 'Test Task',
        description: 'Test Description',
        due_date: '2025-12-25T10:30:00.000Z',
      };

      const errorMessage = 'Network Error';
      mockedAxios.post.mockRejectedValue(new Error(errorMessage));

      await expect(createTask(payload, 'test-token')).rejects.toThrow(errorMessage);
    });

    it('should include authorization token in headers', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        due_date: '2025-12-25T10:30:00.000Z',
        garden: 123,
      };

      const payload: CreateTaskPayload = {
        garden: 123,
        title: 'Test Task',
        description: 'Test Description',
        due_date: '2025-12-25T10:30:00.000Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockTask });

      await createTask(payload, 'my-secret-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: { Authorization: 'Token my-secret-token' },
        })
      );
    });
  });

  describe('fetchTasksForGarden', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch tasks for a garden successfully', async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          due_date: '2025-12-25T10:30:00.000Z',
          garden: 123,
        },
        {
          id: 2,
          title: 'Task 2',
          description: 'Description 2',
          due_date: '2025-12-26T10:30:00.000Z',
          garden: 123,
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockTasks });

      const result = await fetchTasksForGarden(123, 'test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/gardens/123/tasks/`,
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockTasks);
    });

    it('should handle empty task list', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await fetchTasksForGarden(123, 'test-token');

      expect(result).toEqual([]);
    });
  });

  describe('fetchTaskById', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch a single task successfully', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        due_date: '2025-12-25T10:30:00.000Z',
        garden: 123,
      };

      mockedAxios.get.mockResolvedValue({ data: mockTask });

      const result = await fetchTaskById(1, 'test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/tasks/1/`,
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockTask);
    });

    it('should throw error when task not found', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Task not found'));

      await expect(fetchTaskById(999, 'test-token')).rejects.toThrow('Task not found');
    });
  });

  describe('updateTask', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update a task successfully', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Updated Task',
        description: 'Updated Description',
        due_date: '2025-12-25T10:30:00.000Z',
        garden: 123,
      };

      const updates = {
        title: 'Updated Task',
        description: 'Updated Description',
      };

      mockedAxios.patch.mockResolvedValue({ data: mockTask });

      const result = await updateTask(1, updates, 'test-token');

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `${API_URL}/tasks/1/`,
        updates,
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockTask);
    });

    it('should update only specific fields', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Updated Task',
        description: 'Original Description',
        due_date: '2025-12-25T10:30:00.000Z',
        garden: 123,
      };

      const updates = { title: 'Updated Task' };

      mockedAxios.patch.mockResolvedValue({ data: mockTask });

      await updateTask(1, updates, 'test-token');

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `${API_URL}/tasks/1/`,
        updates,
        expect.any(Object)
      );
    });
  });

  describe('deleteTask', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete a task successfully', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await deleteTask(1, 'test-token');

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${API_URL}/tasks/1/`,
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
    });

    it('should throw error when delete fails', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteTask(1, 'test-token')).rejects.toThrow('Delete failed');
    });
  });

  describe('markTaskAsCompleted', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should mark task as completed', async () => {
      const mockTask: Task = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        due_date: new Date().toISOString(),
        garden: 123,
        status: 'completed',
      };

      mockedAxios.patch.mockResolvedValue({ data: mockTask });

      const result = await markTaskAsCompleted(1, 'test-token');

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `${API_URL}/tasks/1/`,
        expect.objectContaining({
          due_date: expect.any(String),
        }),
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle complete task creation workflow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Validate
      const validation = validateTaskData('New Task', 'New Description', tomorrow);
      expect(validation.isValid).toBe(true);

      // Create payload
      const payload = createTaskPayload(123, 'New Task', 'New Description', tomorrow);
      expect(payload).toHaveProperty('garden', 123);
      expect(payload).toHaveProperty('title', 'New Task');
      expect(payload).toHaveProperty('description', 'New Description');
      expect(payload).toHaveProperty('due_date');
    });

    it('should prevent invalid task creation', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const validation = validateTaskData('', 'Description', yesterday);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });
  });
});
