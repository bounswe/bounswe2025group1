// File: services/task.ts

import axios from 'axios';
import { API_URL } from '../constants/Config';

export interface Task {
  id?: number;
  title: string;
  description: string;
  due_date: string;
  garden: number | string;
  status?: 'pending' | 'in_progress' | 'completed';
  assigned_to?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaskPayload {
  garden: number | string;
  title: string;
  description: string;
  due_date: string;
}

/**
 * Validates task data before creation
 * @param title - Task title
 * @param description - Task description
 * @param dueDate - Task due date
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateTaskData = (
  title: string,
  description: string,
  dueDate: Date | null
): { isValid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'Title is required' };
  }

  if (title.length > 200) {
    return { isValid: false, error: 'Title must be 200 characters or less' };
  }

  if (!description || description.trim().length === 0) {
    return { isValid: false, error: 'Description is required' };
  }

  if (description.length > 1000) {
    return { isValid: false, error: 'Description must be 1000 characters or less' };
  }

  if (!dueDate) {
    return { isValid: false, error: 'Due date is required' };
  }

  if (!(dueDate instanceof Date) || isNaN(dueDate.getTime())) {
    return { isValid: false, error: 'Invalid due date' };
  }

  // Check if due date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateWithoutTime = new Date(dueDate);
  dueDateWithoutTime.setHours(0, 0, 0, 0);

  if (dueDateWithoutTime < today) {
    return { isValid: false, error: 'Due date cannot be in the past' };
  }

  return { isValid: true };
};

/**
 * Formats a Date object to ISO string for API
 * @param date - Date to format
 * @returns ISO string
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

/**
 * Creates a task payload ready for API submission
 * @param gardenId - Garden ID
 * @param title - Task title
 * @param description - Task description
 * @param dueDate - Task due date
 * @returns Task payload object
 */
export const createTaskPayload = (
  gardenId: number | string,
  title: string,
  description: string,
  dueDate: Date
): CreateTaskPayload => {
  return {
    garden: gardenId,
    title: title.trim(),
    description: description.trim(),
    due_date: formatDateForAPI(dueDate),
  };
};

/**
 * Create a new task
 * @param payload - Task creation payload
 * @param token - Auth token
 * @returns Created task
 */
export const createTask = async (
  payload: CreateTaskPayload,
  token: string
): Promise<Task> => {
  const response = await axios.post(`${API_URL}/tasks/`, payload, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

/**
 * Fetch all tasks for a garden
 * @param gardenId - Garden ID
 * @param token - Auth token
 * @returns Array of tasks
 */
export const fetchTasksForGarden = async (
  gardenId: number | string,
  token: string
): Promise<Task[]> => {
  const response = await axios.get(`${API_URL}/gardens/${gardenId}/tasks/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

/**
 * Fetch a single task by ID
 * @param taskId - Task ID
 * @param token - Auth token
 * @returns Task object
 */
export const fetchTaskById = async (
  taskId: number,
  token: string
): Promise<Task> => {
  const response = await axios.get(`${API_URL}/tasks/${taskId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

/**
 * Update a task
 * @param taskId - Task ID
 * @param updates - Partial task data to update
 * @param token - Auth token
 * @returns Updated task
 */
export const updateTask = async (
  taskId: number,
  updates: Partial<CreateTaskPayload>,
  token: string
): Promise<Task> => {
  const response = await axios.patch(`${API_URL}/tasks/${taskId}/`, updates, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

/**
 * Delete a task
 * @param taskId - Task ID
 * @param token - Auth token
 */
export const deleteTask = async (
  taskId: number,
  token: string
): Promise<void> => {
  await axios.delete(`${API_URL}/tasks/${taskId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
};

/**
 * Mark a task as completed
 * @param taskId - Task ID
 * @param token - Auth token
 * @returns Updated task
 */
export const markTaskAsCompleted = async (
  taskId: number,
  token: string
): Promise<Task> => {
  return updateTask(taskId, { due_date: new Date().toISOString() }, token);
};
