// File: services/__tests__/garden.test.ts

import axios from 'axios';
import {
  validateGardenData,
  createGardenPayload,
  fetchMyGardens,
  createGarden,
  updateGarden,
  deleteGarden,
  listPublicGardens,
  fetchGardenById,
  joinGarden,
  acceptMembership,
  fetchGardenMembers,
  fetchMembershipStatus,
  Garden,
  GardenMembership,
} from '../garden';
import { API_URL } from '../../constants/Config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Garden Utility Functions', () => {
  describe('validateGardenData', () => {
    it('should return valid for correct garden data', () => {
      const result = validateGardenData('My Garden', 'A beautiful garden');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid when description is optional', () => {
      const result = validateGardenData('My Garden');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid when name is empty', () => {
      const result = validateGardenData('', 'Description');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Garden name is required');
    });

    it('should return invalid when name is only whitespace', () => {
      const result = validateGardenData('   ', 'Description');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Garden name is required');
    });

    it('should return invalid when name exceeds 200 characters', () => {
      const longName = 'a'.repeat(201);
      const result = validateGardenData(longName, 'Description');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Garden name must be 200 characters or less');
    });

    it('should return invalid when description exceeds 1000 characters', () => {
      const longDescription = 'a'.repeat(1001);
      const result = validateGardenData('My Garden', longDescription);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Description must be 1000 characters or less');
    });

    it('should accept name with exactly 200 characters', () => {
      const maxName = 'a'.repeat(200);
      const result = validateGardenData(maxName, 'Description');

      expect(result.isValid).toBe(true);
    });

    it('should accept description with exactly 1000 characters', () => {
      const maxDescription = 'a'.repeat(1000);
      const result = validateGardenData('My Garden', maxDescription);

      expect(result.isValid).toBe(true);
    });
  });

  describe('createGardenPayload', () => {
    it('should create a valid garden payload with required fields', () => {
      const payload = createGardenPayload('My Garden', 'A beautiful garden', true);

      expect(payload).toEqual({
        name: 'My Garden',
        description: 'A beautiful garden',
        is_public: true,
      });
    });

    it('should trim whitespace from name and description', () => {
      const payload = createGardenPayload('  My Garden  ', '  Description  ', false);

      expect(payload.name).toBe('My Garden');
      expect(payload.description).toBe('Description');
      expect(payload.is_public).toBe(false);
    });

    it('should include optional location', () => {
      const payload = createGardenPayload(
        'My Garden',
        'Description',
        true,
        'New York, NY'
      );

      expect(payload.location).toBe('New York, NY');
    });

    it('should include cover image base64', () => {
      const coverImage = 'base64encodedimage';
      const payload = createGardenPayload(
        'My Garden',
        'Description',
        true,
        undefined,
        coverImage
      );

      expect(payload.cover_image_base64).toBe(coverImage);
    });

    it('should include gallery images base64', () => {
      const gallery = ['image1', 'image2', 'image3'];
      const payload = createGardenPayload(
        'My Garden',
        'Description',
        true,
        undefined,
        undefined,
        gallery
      );

      expect(payload.gallery_base64).toEqual(gallery);
    });

    it('should create complete payload with all optional fields', () => {
      const payload = createGardenPayload(
        'My Garden',
        'Description',
        true,
        'New York, NY',
        'coverimage',
        ['img1', 'img2']
      );

      expect(payload).toMatchObject({
        name: 'My Garden',
        description: 'Description',
        is_public: true,
        location: 'New York, NY',
        cover_image_base64: 'coverimage',
        gallery_base64: ['img1', 'img2'],
      });
    });
  });

  describe('fetchMyGardens', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch gardens successfully without token', async () => {
      const mockGardens: Garden[] = [
        {
          id: 1,
          name: 'Garden 1',
          description: 'Description 1',
          is_public: true,
        },
        {
          id: 2,
          name: 'Garden 2',
          description: 'Description 2',
          is_public: false,
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockGardens });

      const result = await fetchMyGardens();

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/gardens/`, {});
      expect(result).toEqual(mockGardens);
    });

    it('should fetch gardens successfully with token', async () => {
      const mockGardens: Garden[] = [
        {
          id: 1,
          name: 'Garden 1',
          is_public: true,
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockGardens });

      const result = await fetchMyGardens('test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/gardens/`, {
        headers: { Authorization: 'Token test-token' },
      });
      expect(result).toEqual(mockGardens);
    });

    it('should handle empty garden list', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await fetchMyGardens();

      expect(result).toEqual([]);
    });
  });

  describe('createGarden', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a garden successfully without token', async () => {
      const mockGarden: Garden = {
        id: 1,
        name: 'New Garden',
        description: 'A new garden',
        is_public: true,
      };

      const gardenData = {
        name: 'New Garden',
        description: 'A new garden',
        is_public: true,
      };

      mockedAxios.post.mockResolvedValue({ data: mockGarden });

      const result = await createGarden(gardenData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/gardens/`,
        gardenData,
        {}
      );
      expect(result).toEqual(mockGarden);
    });

    it('should create a garden successfully with token', async () => {
      const mockGarden: Garden = {
        id: 1,
        name: 'New Garden',
        is_public: true,
      };

      const gardenData = {
        name: 'New Garden',
        is_public: true,
      };

      mockedAxios.post.mockResolvedValue({ data: mockGarden });

      const result = await createGarden(gardenData, 'test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/gardens/`,
        gardenData,
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockGarden);
    });

    it('should create garden with cover image and gallery', async () => {
      const mockGarden: Garden = {
        id: 1,
        name: 'Garden with Images',
        is_public: true,
      };

      const gardenData = {
        name: 'Garden with Images',
        is_public: true,
        cover_image_base64: 'base64cover',
        gallery_base64: ['img1', 'img2'],
      };

      mockedAxios.post.mockResolvedValue({ data: mockGarden });

      await createGarden(gardenData, 'test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/gardens/`,
        gardenData,
        expect.objectContaining({
          headers: { Authorization: 'Token test-token' },
        })
      );
    });

    it('should throw error when API request fails', async () => {
      const gardenData = {
        name: 'New Garden',
        is_public: true,
      };

      const errorMessage = 'Network Error';
      mockedAxios.post.mockRejectedValue(new Error(errorMessage));

      await expect(createGarden(gardenData)).rejects.toThrow(errorMessage);
    });
  });

  describe('updateGarden', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update a garden successfully', async () => {
      const mockGarden: Garden = {
        id: 1,
        name: 'Updated Garden',
        description: 'Updated description',
        is_public: true,
      };

      const updates = {
        name: 'Updated Garden',
        description: 'Updated description',
      };

      mockedAxios.patch.mockResolvedValue({ data: mockGarden });

      const result = await updateGarden(1, updates, 'test-token');

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `${API_URL}/gardens/1/`,
        updates,
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockGarden);
    });

    it('should update only specific fields', async () => {
      const mockGarden: Garden = {
        id: 1,
        name: 'Updated Garden',
        description: 'Original description',
        is_public: true,
      };

      const updates = { name: 'Updated Garden' };

      mockedAxios.patch.mockResolvedValue({ data: mockGarden });

      await updateGarden(1, updates, 'test-token');

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `${API_URL}/gardens/1/`,
        updates,
        expect.any(Object)
      );
    });
  });

  describe('deleteGarden', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete a garden successfully', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await deleteGarden(1, 'test-token');

      expect(mockedAxios.delete).toHaveBeenCalledWith(`${API_URL}/gardens/1/`, {
        headers: { Authorization: 'Token test-token' },
      });
    });

    it('should delete without token', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await deleteGarden(1);

      expect(mockedAxios.delete).toHaveBeenCalledWith(`${API_URL}/gardens/1/`, {});
    });

    it('should throw error when delete fails', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteGarden(1, 'test-token')).rejects.toThrow('Delete failed');
    });
  });

  describe('listPublicGardens', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should filter and return only public gardens', async () => {
      const allGardens: Garden[] = [
        { id: 1, name: 'Public Garden 1', is_public: true },
        { id: 2, name: 'Private Garden', is_public: false },
        { id: 3, name: 'Public Garden 2', is_public: true },
      ];

      mockedAxios.get.mockResolvedValue({ data: allGardens });

      const result = await listPublicGardens();

      expect(result).toHaveLength(2);
      expect(result.every((g) => g.is_public)).toBe(true);
      expect(result[0].name).toBe('Public Garden 1');
      expect(result[1].name).toBe('Public Garden 2');
    });

    it('should return empty array when no public gardens exist', async () => {
      const allGardens: Garden[] = [
        { id: 1, name: 'Private Garden 1', is_public: false },
        { id: 2, name: 'Private Garden 2', is_public: false },
      ];

      mockedAxios.get.mockResolvedValue({ data: allGardens });

      const result = await listPublicGardens();

      expect(result).toEqual([]);
    });
  });

  describe('fetchGardenById', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch a single garden successfully without token', async () => {
      const mockGarden: Garden = {
        id: 1,
        name: 'Garden 1',
        description: 'Description',
        is_public: true,
      };

      mockedAxios.get.mockResolvedValue({ data: mockGarden });

      const result = await fetchGardenById(1);

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/gardens/1/`, {});
      expect(result).toEqual(mockGarden);
    });

    it('should fetch a single garden successfully with token', async () => {
      const mockGarden: Garden = {
        id: 1,
        name: 'Garden 1',
        is_public: true,
      };

      mockedAxios.get.mockResolvedValue({ data: mockGarden });

      const result = await fetchGardenById(1, 'test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/gardens/1/`, {
        headers: { Authorization: 'Token test-token' },
      });
      expect(result).toEqual(mockGarden);
    });

    it('should handle string garden ID', async () => {
      const mockGarden: Garden = {
        id: 1,
        name: 'Garden 1',
        is_public: true,
      };

      mockedAxios.get.mockResolvedValue({ data: mockGarden });

      await fetchGardenById('1', 'test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/gardens/1/`,
        expect.any(Object)
      );
    });
  });

  describe('joinGarden', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a membership request successfully with default WORKER role', async () => {
      const mockMembership: GardenMembership = {
        id: 1,
        user: 123,
        garden: 456,
        role: 'WORKER',
        status: 'PENDING',
      };

      mockedAxios.post.mockResolvedValue({ data: mockMembership });

      const result = await joinGarden(456, 'test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/memberships/`,
        {
          garden: 456,
          role: 'WORKER',
          status: 'PENDING',
        },
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockMembership);
    });

    it('should create a membership request with MANAGER role', async () => {
      const mockMembership: GardenMembership = {
        id: 1,
        user: 123,
        garden: 456,
        role: 'MANAGER',
        status: 'PENDING',
      };

      mockedAxios.post.mockResolvedValue({ data: mockMembership });

      const result = await joinGarden(456, 'test-token', 'MANAGER');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/memberships/`,
        {
          garden: 456,
          role: 'MANAGER',
          status: 'PENDING',
        },
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockMembership);
    });

    it('should handle string garden ID', async () => {
      const mockMembership: GardenMembership = {
        id: 1,
        user: 123,
        garden: 456,
        role: 'WORKER',
        status: 'PENDING',
      };

      mockedAxios.post.mockResolvedValue({ data: mockMembership });

      await joinGarden('456', 'test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/memberships/`,
        expect.objectContaining({ garden: '456' }),
        expect.any(Object)
      );
    });

    it('should throw error when join request fails', async () => {
      const errorMessage = 'Already a member';
      mockedAxios.post.mockRejectedValue(new Error(errorMessage));

      await expect(joinGarden(456, 'test-token')).rejects.toThrow(errorMessage);
    });
  });

  describe('acceptMembership', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should accept a membership request successfully', async () => {
      const mockResponse = { status: 'Membership accepted' };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await acceptMembership(1, 'test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/memberships/1/accept/`,
        {},
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when accept fails', async () => {
      const errorMessage = 'Permission denied';
      mockedAxios.post.mockRejectedValue(new Error(errorMessage));

      await expect(acceptMembership(1, 'test-token')).rejects.toThrow(errorMessage);
    });

    it('should throw error when membership not found', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Not found'));

      await expect(acceptMembership(999, 'test-token')).rejects.toThrow('Not found');
    });
  });

  describe('fetchGardenMembers', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch garden members successfully', async () => {
      const mockMembers: GardenMembership[] = [
        {
          id: 1,
          user: 123,
          garden: 456,
          role: 'MANAGER',
          status: 'ACCEPTED',
        },
        {
          id: 2,
          user: 789,
          garden: 456,
          role: 'WORKER',
          status: 'ACCEPTED',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockMembers });

      const result = await fetchGardenMembers(456, 'test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/gardens/456/members/`,
        {
          headers: { Authorization: 'Token test-token' },
        }
      );
      expect(result).toEqual(mockMembers);
    });

    it('should handle empty member list', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await fetchGardenMembers(456, 'test-token');

      expect(result).toEqual([]);
    });

    it('should handle string garden ID', async () => {
      const mockMembers: GardenMembership[] = [
        {
          id: 1,
          user: 123,
          garden: 456,
          role: 'MANAGER',
          status: 'ACCEPTED',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockMembers });

      await fetchGardenMembers('456', 'test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/gardens/456/members/`,
        expect.any(Object)
      );
    });
  });

  describe('fetchMembershipStatus', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch membership status when user has membership', async () => {
      const mockMembership: GardenMembership = {
        id: 1,
        user: 123,
        garden: 456,
        role: 'WORKER',
        status: 'PENDING',
      };

      mockedAxios.get.mockResolvedValue({ data: [mockMembership] });

      const result = await fetchMembershipStatus(456, 'test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/memberships/`,
        {
          headers: { Authorization: 'Token test-token' },
          params: { garden: 456 },
        }
      );
      expect(result).toEqual(mockMembership);
    });

    it('should return null when user has no membership', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await fetchMembershipStatus(456, 'test-token');

      expect(result).toBeNull();
    });

    it('should return null when API request fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await fetchMembershipStatus(456, 'test-token');

      expect(result).toBeNull();
    });

    it('should handle string garden ID', async () => {
      const mockMembership: GardenMembership = {
        id: 1,
        user: 123,
        garden: 456,
        role: 'WORKER',
        status: 'ACCEPTED',
      };

      mockedAxios.get.mockResolvedValue({ data: [mockMembership] });

      await fetchMembershipStatus('456', 'test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/memberships/`,
        expect.objectContaining({
          params: { garden: '456' },
        })
      );
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle complete garden creation workflow', () => {
      // Validate
      const validation = validateGardenData('New Garden', 'A new garden');
      expect(validation.isValid).toBe(true);

      // Create payload
      const payload = createGardenPayload('New Garden', 'A new garden', true);
      expect(payload).toHaveProperty('name', 'New Garden');
      expect(payload).toHaveProperty('description', 'A new garden');
      expect(payload).toHaveProperty('is_public', true);
    });

    it('should handle complete membership workflow', async () => {
      // Join garden
      const mockMembership: GardenMembership = {
        id: 1,
        user: 123,
        garden: 456,
        role: 'WORKER',
        status: 'PENDING',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockMembership });

      const membership = await joinGarden(456, 'test-token');
      expect(membership.status).toBe('PENDING');

      // Accept membership
      mockedAxios.post.mockResolvedValueOnce({ data: { status: 'Membership accepted' } });

      const acceptResult = await acceptMembership(membership.id!, 'manager-token');
      expect(acceptResult.status).toBe('Membership accepted');
    });

    it('should prevent invalid garden creation', () => {
      const validation = validateGardenData('', 'Description');
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });
  });
});

