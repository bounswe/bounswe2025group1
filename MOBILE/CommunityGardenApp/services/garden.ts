// File: services/garden.ts

import axios from 'axios';
import { API_URL } from '../constants/Config';

export interface Garden {
  id?: number;
  name: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  is_public: boolean;
  cover_image?: {
    id: number;
    image_base64: string;
  };
  gallery?: Array<{
    id: number;
    image_base64: string;
  }>;
}

/**
 * Validates garden data before creation
 * @param name - Garden name
 * @param description - Garden description (optional)
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateGardenData = (
  name: string,
  description?: string
): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Garden name is required' };
  }

  if (name.length > 200) {
    return { isValid: false, error: 'Garden name must be 200 characters or less' };
  }

  if (description && description.length > 1000) {
    return { isValid: false, error: 'Description must be 1000 characters or less' };
  }

  return { isValid: true };
};

/**
 * Creates a garden payload ready for API submission
 * @param name - Garden name
 * @param description - Garden description
 * @param isPublic - Whether garden is public
 * @param location - Garden location (optional)
 * @param coverImageBase64 - Cover image as base64 (optional)
 * @param galleryBase64 - Gallery images as base64 array (optional)
 * @returns Garden payload object
 */
export const createGardenPayload = (
  name: string,
  description: string = '',
  isPublic: boolean = true,
  location?: string,
  coverImageBase64?: string,
  galleryBase64?: string[]
): Garden & { cover_image_base64?: string; gallery_base64?: string[] } => {
  const payload: Garden & { cover_image_base64?: string; gallery_base64?: string[] } = {
    name: name.trim(),
    description: description.trim(),
    is_public: isPublic,
  };

  if (location) {
    payload.location = location.trim();
  }

  if (coverImageBase64) {
    payload.cover_image_base64 = coverImageBase64;
  }

  if (galleryBase64 && galleryBase64.length > 0) {
    payload.gallery_base64 = galleryBase64;
  }

  return payload;
};

// Get all gardens for the logged-in user
export const fetchMyGardens = async (token?: string): Promise<Garden[]> => {
  const config = token ? { headers: { Authorization: `Token ${token}` } } : {};
  const response = await axios.get(`${API_URL}/gardens/`, config);
  return response.data;
};

// Create a new garden
export const createGarden = async (
  gardenData: Garden & {
    cover_image_base64?: string;
    gallery_base64?: string[];
  },
  token?: string
): Promise<Garden> => {
  const config = token ? { headers: { Authorization: `Token ${token}` } } : {};
  const response = await axios.post(`${API_URL}/gardens/`, gardenData, config);
  return response.data;
};

// Update an existing garden
export const updateGarden = async (
  id: number,
  gardenData: Partial<Garden> & {
    cover_image_base64?: string;
    gallery_base64?: string[];
  },
  token?: string
): Promise<Garden> => {
  const config = token ? { headers: { Authorization: `Token ${token}` } } : {};
  const response = await axios.patch(`${API_URL}/gardens/${id}/`, gardenData, config);
  return response.data;
};

// Delete a garden
export const deleteGarden = async (id: number, token?: string): Promise<void> => {
  const config = token ? { headers: { Authorization: `Token ${token}` } } : {};
  await axios.delete(`${API_URL}/gardens/${id}/`, config);
};
// List only public gardens (client-side filtering)
export const listPublicGardens = async (token?: string): Promise<Garden[]> => {
  const config = token ? { headers: { Authorization: `Token ${token}` } } : {};
  const response = await axios.get(`${API_URL}/gardens/`, config);
  return response.data.filter((garden: Garden) => garden.is_public);
};

// Get a single garden by ID
export const fetchGardenById = async (id: number | string, token?: string): Promise<Garden> => {
  const config = token ? { headers: { Authorization: `Token ${token}` } } : {};
  const response = await axios.get(`${API_URL}/gardens/${id}/`, config);
  return response.data;
};

// Garden Membership interfaces
export interface GardenMembership {
  id?: number;
  user: number;
  garden: number;
  role: 'MANAGER' | 'WORKER';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  joined_at?: string;
  updated_at?: string;
}

export interface CreateMembershipPayload {
  garden: number | string;
  role?: 'MANAGER' | 'WORKER';
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

// Join a garden (create membership request)
export const joinGarden = async (
  gardenId: number | string,
  token: string,
  role: 'MANAGER' | 'WORKER' = 'WORKER'
): Promise<GardenMembership> => {
  const payload: CreateMembershipPayload = {
    garden: gardenId,
    role,
    status: 'PENDING',
  };
  const response = await axios.post(`${API_URL}/memberships/`, payload, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

// Accept a membership request (for garden managers)
export const acceptMembership = async (
  membershipId: number,
  token: string
): Promise<{ status: string }> => {
  const response = await axios.post(
    `${API_URL}/memberships/${membershipId}/accept/`,
    {},
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
  return response.data;
};

// Fetch garden members
export const fetchGardenMembers = async (
  gardenId: number | string,
  token: string
): Promise<GardenMembership[]> => {
  const response = await axios.get(`${API_URL}/gardens/${gardenId}/members/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

// Fetch user's membership status for a garden
export const fetchMembershipStatus = async (
  gardenId: number | string,
  token: string
): Promise<GardenMembership | null> => {
  try {
    const response = await axios.get(`${API_URL}/memberships/`, {
      headers: { Authorization: `Token ${token}` },
      params: { garden: gardenId },
    });
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    return null;
  }
};

