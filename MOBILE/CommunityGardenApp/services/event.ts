// File: services/event.ts

import axios from 'axios';
import { API_URL } from '../constants/Config';

// Types
export type EventVisibility = 'PRIVATE' | 'PUBLIC';
export type AttendanceStatus = 'GOING' | 'NOT_GOING' | 'MAYBE';

// Interfaces
export interface GardenEvent {
  id: number;
  garden: number;
  garden_name: string;
  title: string;
  description: string;
  start_at: string; // ISO datetime string
  visibility: EventVisibility;
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
  going_count: number;
  not_going_count: number;
  maybe_count: number;
  my_attendance: AttendanceStatus | null;
}

export interface EventAttendance {
  id: number;
  event: number;
  user: number;
  username: string;
  status: AttendanceStatus;
  responded_at: string;
}

export interface CreateEventData {
  garden: number;
  title: string;
  description?: string;
  start_at: string; // ISO datetime string
  visibility: EventVisibility;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  start_at?: string;
  visibility?: EventVisibility;
}

// API Functions

/**
 * Fetch all events (optionally filtered by garden)
 */
export const fetchEvents = async (gardenId?: number): Promise<GardenEvent[]> => {
  const url = gardenId
    ? `${API_URL}/events/?garden=${gardenId}`
    : `${API_URL}/events/`;
  const response = await axios.get(url);
  return response.data;
};

/**
 * Fetch a single event by ID
 */
export const fetchEventById = async (eventId: number): Promise<GardenEvent> => {
  const response = await axios.get(`${API_URL}/events/${eventId}/`);
  return response.data;
};

/**
 * Create a new event in a garden
 */
export const createEvent = async (data: CreateEventData): Promise<GardenEvent> => {
  const response = await axios.post(`${API_URL}/events/`, data);
  return response.data;
};

/**
 * Update an existing event
 */
export const updateEvent = async (
  eventId: number,
  data: UpdateEventData
): Promise<GardenEvent> => {
  const response = await axios.patch(`${API_URL}/events/${eventId}/`, data);
  return response.data;
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: number): Promise<void> => {
  await axios.delete(`${API_URL}/events/${eventId}/`);
};

/**
 * Vote on event attendance (GOING, NOT_GOING, MAYBE)
 */
export const voteAttendance = async (
  eventId: number,
  status: AttendanceStatus
): Promise<EventAttendance> => {
  const response = await axios.post(`${API_URL}/events/${eventId}/vote/`, { status });
  return response.data;
};

/**
 * Get all attendance votes for an event
 */
export const getEventAttendances = async (eventId: number): Promise<EventAttendance[]> => {
  const response = await axios.get(`${API_URL}/events/${eventId}/attendances/`);
  return response.data;
};

/**
 * Helper function to format event date for display
 */
export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Helper function to format event time for display
 */
export const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Helper function to check if event is in the past
 */
export const isEventPast = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

/**
 * Helper function to check if event is upcoming (within next 7 days)
 */
export const isEventUpcoming = (dateString: string): boolean => {
  const eventDate = new Date(dateString);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return eventDate >= now && eventDate <= weekFromNow;
};
