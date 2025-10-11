import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GardensPreview from './GardensPreview';
import { useAuth } from '../contexts/AuthContextUtils';

vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mockGardens = [
  {
    id: 1,
    name: 'Test Garden 1',
    description: 'A test garden description',
    location: 'Test Location 1',
    members: 5,
    tasks: 3,
  },
  {
    id: 2,
    name: 'Test Garden 2',
    description: 'Another test garden description',
    location: 'Test Location 2',
    members: 3,
    tasks: 7,
  },
];

describe('GardensPreview component', () => {
  beforeEach(() => {
    window.fetch = vi.fn();
    vi.resetAllMocks();
    useAuth.mockReturnValue({
      token: 'mock-token',
      currentUser: { id: 1, username: 'testuser' },
    });
  });

  it('renders loading state initially', () => {
    // Mock the profile fetch to not resolve immediately, keeping component in loading state
    window.fetch.mockReturnValueOnce(new Promise(() => {}));

    render(<GardensPreview />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders gardens when data is loaded', async () => {
    // Mock profile response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ username: 'testuser' }),
    });

    // Mock memberships response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { status: 'ACCEPTED', username: 'testuser', garden: 1 },
        { status: 'ACCEPTED', username: 'testuser', garden: 2 },
      ],
    });

    // Mock garden 1 response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGardens[0],
    });

    // Mock garden 2 response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGardens[1],
    });

    render(<GardensPreview />);

    await waitFor(() => {
      expect(screen.getByText('My Gardens')).toBeInTheDocument();
      expect(screen.getByText('Test Garden 1')).toBeInTheDocument();
      expect(screen.getByText('Test Garden 2')).toBeInTheDocument();
    });
  });
  it('respects the limit prop', async () => {
    // Mock profile response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ username: 'testuser' }),
    });

    // Mock memberships response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { status: 'ACCEPTED', username: 'testuser', garden: 1 },
        { status: 'ACCEPTED', username: 'testuser', garden: 2 },
        { status: 'ACCEPTED', username: 'testuser', garden: 3 },
      ],
    });

    // Mock garden 1 response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGardens[0],
    });

    // Mock garden 2 response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGardens[1],
    });

    // Mock garden 3 response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 3,
        name: 'Test Garden 3',
        description: 'Yet another garden',
        location: 'Test Location 3',
        members: 1,
        tasks: 2,
      }),
    });

    render(<GardensPreview limit={2} />);

    await waitFor(() => {
      expect(screen.getByText('My Gardens')).toBeInTheDocument();
      expect(screen.getByText('Test Garden 1')).toBeInTheDocument();
      expect(screen.getByText('Test Garden 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Garden 3')).not.toBeInTheDocument();
    });
  });

  it('displays message when no gardens are available', async () => {
    // Mock profile response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ username: 'testuser' }),
    });

    // Mock memberships response with empty array
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<GardensPreview />);

    await waitFor(() => {
      expect(screen.getByText('You have no gardens yet.')).toBeInTheDocument();
    });
  });

  it('handles public gardens for non-logged in users', async () => {
    useAuth.mockReturnValue({
      token: null,
      currentUser: null,
    });

    // Mock public gardens response
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGardens,
    });

    render(<GardensPreview />);

    await waitFor(() => {
      expect(screen.getByText('Featured Gardens')).toBeInTheDocument();
      expect(screen.getByText('Test Garden 1')).toBeInTheDocument();
      expect(screen.getByText('Test Garden 2')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    // Mock failed profile fetch
    window.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    console.error = vi.fn(); // Silence console errors in test

    render(<GardensPreview />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
