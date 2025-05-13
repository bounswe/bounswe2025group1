import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GardensPreview from './GardensPreview';
import { useAuth } from '../contexts/AuthContextUtils';

vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn()
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

const mockGardens = [
  {
    id: 1,
    name: 'Test Garden 1',
    description: 'A test garden description',
    location: 'Test Location 1',
    members: 5,
    tasks: 3
  },
  {
    id: 2,
    name: 'Test Garden 2',
    description: 'Another test garden description',
    location: 'Test Location 2',
    members: 3,
    tasks: 7
  }
];

describe('GardensPreview component', () => {
  beforeEach(() => {
    window.fetch = vi.fn();
    useAuth.mockReturnValue({
      token: 'mock-token',
      currentUser: { id: 1, username: 'testuser' }
    });
  });

  it('renders loading state initially', () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([])
    });

    render(<GardensPreview />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders gardens when data is loaded', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGardens
    });

    render(<GardensPreview />);

    await waitFor(() => {
      expect(screen.getByText('My Gardens')).toBeInTheDocument();
      expect(screen.getByText('Test Garden 1')).toBeInTheDocument();
      expect(screen.getByText('Test Garden 2')).toBeInTheDocument();
    });
  });

  it('respects the limit prop', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [...mockGardens, {
        id: 3,
        name: 'Test Garden 3',
        description: 'Yet another garden',
        location: 'Test Location 3',
        members: 1,
        tasks: 2
      }]
    });

    render(<GardensPreview limit={2} />);

    await waitFor(() => {
      expect(screen.getByText('Test Garden 1')).toBeInTheDocument();
      expect(screen.getByText('Test Garden 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Garden 3')).not.toBeInTheDocument();
    });
  });

  it('displays message when no gardens are available', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(<GardensPreview />);

    await waitFor(() => {
      expect(screen.getByText('You have no gardens yet.')).toBeInTheDocument();
    });
  });

  it('handles public gardens for non-logged in users', async () => {
    useAuth.mockReturnValue({
      token: null,
      currentUser: null
    });

    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGardens
    });

    render(<GardensPreview />);

    await waitFor(() => {
      expect(screen.getByText('Featured Gardens')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    window.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    console.error = vi.fn(); // Silence console errors in test

    render(<GardensPreview />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
