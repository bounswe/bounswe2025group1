// File: services/garden.ts

import axios from 'axios';
import { API_URL } from '../constants/Config';

export interface Garden {
  id?: number;
  name: string;
  description?: string;
  location?: string;
  is_public: boolean;
}

// Get all gardens for the logged-in user
export const fetchMyGardens = async (): Promise<Garden[]> => {
  const response = await axios.get(`${API_URL}/gardens/`);
  return response.data;
};

// Create a new garden
export const createGarden = async (gardenData: Garden): Promise<Garden> => {
  const response = await axios.post(`${API_URL}/gardens/`, gardenData);
  return response.data;
};

// Update an existing garden
export const updateGarden = async (id: number, gardenData: Partial<Garden>): Promise<Garden> => {
  const response = await axios.patch(`${API_URL}/gardens/${id}/`, gardenData);
  return response.data;
};

// Delete a garden
export const deleteGarden = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/gardens/${id}/`);
};
// List only public gardens (client-side filtering)
export const listPublicGardens = async (): Promise<Garden[]> => {
    const response = await axios.get(`${API_URL}/gardens/`);
    return response.data.filter((garden: Garden) => garden.is_public);
  };

  