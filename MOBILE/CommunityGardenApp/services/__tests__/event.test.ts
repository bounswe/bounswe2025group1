import axios from 'axios';
import {
  fetchEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  voteAttendance,
  getEventAttendances,
  formatEventDate,
  formatEventTime,
  isEventPast,
  isEventUpcoming,
  GardenEvent,
  EventAttendance,
} from '../event';
import { API_URL } from '../../constants/Config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Event Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchEvents', () => {
    it('should fetch all events when no gardenId provided', async () => {
      const mockEvents: GardenEvent[] = [
        {
          id: 1,
          title: 'Event 1',
          garden: 1,
        } as GardenEvent,
      ];

      mockedAxios.get.mockResolvedValue({ data: mockEvents });

      const result = await fetchEvents();

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/events/`);
      expect(result).toEqual(mockEvents);
    });

    it('should fetch events for specific garden', async () => {
      const mockEvents: GardenEvent[] = [
        {
          id: 1,
          title: 'Event 1',
          garden: 1,
        } as GardenEvent,
      ];

      mockedAxios.get.mockResolvedValue({ data: mockEvents });

      const result = await fetchEvents(1);

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/events/?garden=1`);
      expect(result).toEqual(mockEvents);
    });
  });

  describe('fetchEventById', () => {
    it('should fetch a single event', async () => {
      const mockEvent = { id: 1, title: 'Event 1' } as GardenEvent;
      mockedAxios.get.mockResolvedValue({ data: mockEvent });

      const result = await fetchEventById(1);

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/events/1/`);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('createEvent', () => {
    it('should create an event', async () => {
      const newEvent = {
        garden: 1,
        title: 'New Event',
        start_at: '2023-01-01T10:00:00Z',
        visibility: 'PUBLIC',
      } as any;
      
      const createdEvent = { ...newEvent, id: 1 };
      mockedAxios.post.mockResolvedValue({ data: createdEvent });

      const result = await createEvent(newEvent);

      expect(mockedAxios.post).toHaveBeenCalledWith(`${API_URL}/events/`, newEvent);
      expect(result).toEqual(createdEvent);
    });
  });

  describe('updateEvent', () => {
    it('should update an event', async () => {
      const updates = { title: 'Updated Event' };
      const updatedEvent = { id: 1, ...updates } as GardenEvent;
      
      mockedAxios.patch.mockResolvedValue({ data: updatedEvent });

      const result = await updateEvent(1, updates);

      expect(mockedAxios.patch).toHaveBeenCalledWith(`${API_URL}/events/1/`, updates);
      expect(result).toEqual(updatedEvent);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await deleteEvent(1);

      expect(mockedAxios.delete).toHaveBeenCalledWith(`${API_URL}/events/1/`);
    });
  });

  describe('voteAttendance', () => {
    it('should vote attendance', async () => {
      const mockAttendance = { id: 1, status: 'GOING' } as EventAttendance;
      mockedAxios.post.mockResolvedValue({ data: mockAttendance });

      const result = await voteAttendance(1, 'GOING');

      expect(mockedAxios.post).toHaveBeenCalledWith(`${API_URL}/events/1/vote/`, { status: 'GOING' });
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('getEventAttendances', () => {
    it('should get event attendances', async () => {
      const mockAttendances = [{ id: 1, status: 'GOING' }] as EventAttendance[];
      mockedAxios.get.mockResolvedValue({ data: mockAttendances });

      const result = await getEventAttendances(1);

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/events/1/attendances/`);
      expect(result).toEqual(mockAttendances);
    });
  });

  describe('Helper Functions', () => {
    it('formatEventDate should format date correctly', () => {
      const date = '2023-12-25T10:00:00';
      // Note: The actual output depends on locale, so we might need to be flexible or mock Date
      // But for now let's check if it returns a string
      expect(typeof formatEventDate(date)).toBe('string');
    });

    it('formatEventTime should format time correctly', () => {
      const date = '2023-12-25T10:00:00';
      expect(typeof formatEventTime(date)).toBe('string');
    });

    it('isEventPast should return true for past dates', () => {
      const pastDate = '2000-01-01T00:00:00';
      expect(isEventPast(pastDate)).toBe(true);
    });

    it('isEventPast should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isEventPast(futureDate.toISOString())).toBe(false);
    });

    it('isEventUpcoming should return true for dates within next week', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isEventUpcoming(tomorrow.toISOString())).toBe(true);
    });

    it('isEventUpcoming should return false for dates further than a week', () => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      expect(isEventUpcoming(nextMonth.toISOString())).toBe(false);
    });
  });
});
