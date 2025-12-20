import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GardenDetail from './GardenDetail';
import { useAuth } from '../../contexts/AuthContextUtils';
import * as locationUtils from '../../utils/locationUtils';
import * as ReactRouterDom from 'react-router-dom';

// Mock MUI icons
vi.mock('@mui/icons-material/LocationOn', () => ({ default: () => <div data-testid="location-on-icon">LocationOnIcon</div> }));
vi.mock('@mui/icons-material/Group', () => ({ default: () => <div data-testid="group-icon">GroupIcon</div> }));
vi.mock('@mui/icons-material/Task', () => ({ default: () => <div data-testid="task-icon">TaskIcon</div> }));
vi.mock('@mui/icons-material/AccountCircle', () => ({ default: () => <div data-testid="account-circle-icon">AccountCircleIcon</div> }));
vi.mock('@mui/icons-material/Event', () => ({ default: () => <div data-testid="event-icon">EventIcon</div> }));
vi.mock('@mui/icons-material/Delete', () => ({ default: () => <div data-testid="delete-icon">DeleteIcon</div> }));
vi.mock('@mui/icons-material/Edit', () => ({ default: () => <div data-testid="edit-icon">EditIcon</div> }));
vi.mock('@mui/icons-material/Check', () => ({ default: () => <div data-testid="check-icon">CheckIcon</div> }));
vi.mock('@mui/icons-material/Close', () => ({ default: () => <div data-testid="close-icon">CloseIcon</div> }));

// Mock Toastify
vi.mock('react-toastify', async () => {
  const actual = await vi.importActual('react-toastify');
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
    ToastContainer: () => <div data-testid="mock-toast-container" />,
  };
});

// Mock Auth Context
vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ gardenId: '1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      // Handle keys with count for pluralization
      if (options && options.count !== undefined) {
        return `${key.split('.').pop()} ${options.count}`;
      }
      return key.split('.').pop();
    },
    i18n: { language: 'en' },
  }),
}));
// Mock Child Components
vi.mock('../../components/TaskBoard', () => ({
  __esModule: true,
  default: ({ tasks, onTaskClick }) => (
    <div data-testid="task-board">
      {tasks?.map(task => (
        <div key={task.id} data-testid={`task-${task.id}`} onClick={() => onTaskClick && onTaskClick(task)}>
          {task.title}
        </div>
      )) || <div>No tasks</div>}
    </div>
  ),
}));

vi.mock('../../components/TaskModal', () => ({
  __esModule: true,
  default: ({ open, onClose, onSubmit }) => (
    open ? (
      <div data-testid="task-modal">
        <button onClick={onClose}>Close Task Modal</button>
        <button onClick={() => onSubmit({ title: 'New Task', type: 'CUSTOM' })}>Submit Task</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/GardenModal', () => ({
  __esModule: true,
  default: ({ open, onClose, handleSubmit, handleDelete }) => (
    open ? (
      <div data-testid="garden-modal">
        <button onClick={onClose}>Close Garden Modal</button>
        <button onClick={(e) => handleSubmit && handleSubmit(e, { name: 'Updated Garden' })}>Submit Garden</button>
        <button data-testid="delete-garden-button" onClick={handleDelete}>Delete Garden</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/EventCard', () => ({
  __esModule: true,
  default: ({ event, onClick }) => (
    <div data-testid={`event-card-${event.id}`} onClick={() => onClick && onClick(event)}>
      {event.title}
    </div>
  ),
}));

vi.mock('../../components/EventCreateDialog', () => ({
  __esModule: true,
  default: ({ open, onClose }) => (
    open ? <div data-testid="event-create-dialog">Event Create Dialog</div> : null
  ),
}));

vi.mock('../../components/EventDetailModal', () => ({
  __esModule: true,
  default: ({ open, onClose }) => (
    open ? <div data-testid="event-detail-modal">Event Detail Modal</div> : null
  ),
}));

vi.mock('../../components/CalendarTab', () => ({
  __esModule: true,
  default: () => <div data-testid="calendar-tab">Calendar Tab</div>,
}));

vi.mock('../../components/ImageGallery', () => ({
  __esModule: true,
  default: () => <div data-testid="image-gallery">Image Gallery</div>,
}));

vi.mock('../../components/DirectMessageButton', () => ({
  __esModule: true,
  default: () => <div data-testid="dm-button">DM Button</div>,
}));

// Mock Utils
vi.spyOn(locationUtils, 'translateLocationString').mockImplementation((loc) => loc);

// Global Fetch Mock
global.fetch = vi.fn();
global.window.confirm = vi.fn(() => true);

const mockGarden = {
  id: 1,
  name: 'My Garden',
  location: 'Testland',
  description: 'A lovely test garden.',
  members: 2,
  tasks: 3,
  is_public: true,
  cover_image: { image_base64: 'base64string' },
};

const mockTasks = [
  {
    id: 1,
    title: 'Water plants',
    due_date: new Date().toISOString(),
    status: 'PENDING',
    assigned_to: null,
  },
  {
    id: 2,
    title: 'Harvest cucumbers',
    due_date: new Date().toISOString(),
    status: 'COMPLETED',
    assigned_to: 1, // assigned to user 1
  },
];

const mockMembers = [
  {
    id: 1,
    user_id: 1,
    username: 'testuser',
    garden: 1,
    role: 'MANAGER',
    status: 'ACCEPTED',
  },
  {
    id: 2,
    user_id: 2,
    username: 'user2',
    garden: 1,
    role: 'WORKER',
    status: 'ACCEPTED',
  },
];

const mockEvents = [
  {
    id: 1,
    title: 'Harvest Festival',
    description: 'Fun time',
    date: new Date().toISOString(),
  }
];

describe('GardenDetail', () => {
  const theme = createTheme();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      token: 'fake-token',
      user: { user_id: 1, username: 'testuser' },
    });

    fetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/gardens/1/members/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMembers) });
      }
      if (typeof url === 'string' && url.includes('/gardens/1/')) {
        if (url.endsWith('/gardens/1/')) { // GET or DELETE
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockGarden) });
        }
      }
      if (typeof url === 'string' && url.includes('/tasks/')) {
        if (url.includes('?garden=1')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks) });
        }
        if (url.includes('/self-assign/')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...mockTasks[0], assigned_to: 1 }) });
        }
        if (url.includes('/accept/')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...mockTasks[0], status: 'IN_PROGRESS' }) });
        }
        if (url.includes('/decline/')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...mockTasks[0], status: 'PENDING' }) });
        }
        // General PUT/DELETE
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks[0]) });
      }
      if (typeof url === 'string' && url.includes('/events/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEvents) });
      }
      if (typeof url === 'string' && url.includes('/memberships/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <GardenDetail />
      </ThemeProvider>
    );

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders garden details after loading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('My Garden')).toBeInTheDocument();
      expect(screen.getByText('Testland')).toBeInTheDocument();
    });
  });

  it('handles garden not found', async () => {
    fetch.mockImplementationOnce((url) => {
      if (url.includes('/gardens/1/')) return Promise.reject('Not found');
      return Promise.resolve({ ok: false });
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Garden not found')).toBeInTheDocument();
    });
  });

  it('renders tabs and switches content', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('My Garden')).toBeInTheDocument());

    // Default tab is Tasks (0)
    expect(screen.getByTestId('task-board')).toBeInTheDocument();

    // Click Members tab
    const membersTab = screen.getByRole('tab', { name: /members/i });
    fireEvent.click(membersTab);
    expect(screen.getByText('testuser')).toBeInTheDocument();

    // Click Events tab
    const eventsTab = screen.getByRole('tab', { name: /events/i });
    fireEvent.click(eventsTab);
    expect(screen.getByTestId('event-card-1')).toBeInTheDocument();

    // Click Calendar tab
    const calendarTab = screen.getByRole('tab', { name: /calendar/i });
    fireEvent.click(calendarTab);
    expect(screen.getByTestId('calendar-tab')).toBeInTheDocument();

    // Click Gallery tab
    const galleryTab = screen.getByRole('tab', { name: /gallery/i });
    fireEvent.click(galleryTab);
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
  });

  it('handles create task', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('My Garden')).toBeInTheDocument());

    const addBtn = screen.getByText('addTask');
    fireEvent.click(addBtn);

    await waitFor(() => expect(screen.getByTestId('task-modal')).toBeInTheDocument());

    // Submit task
    fireEvent.click(screen.getByText('Submit Task'));

    // Check if fetch was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/?garden=1'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('handles join/leave garden', async () => {
    // Mock user as not a member first
    useAuth.mockReturnValue({
      token: 'fake-token',
      user: { user_id: 99, username: 'stranger' },
    });
    // Mock members response to not include stranger
    fetch.mockImplementation((url) => {
      if (url.includes('/members/')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMembers) });
      if (url.includes('/gardens/1/')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGarden) });
      if (url.includes('/tasks/')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks) });
      if (url.includes('/events/')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEvents) });
      if (url.includes('/memberships/')) return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderComponent();

    const joinBtn = await screen.findByTestId('join-garden-button');
    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/memberships/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('handles leaving garden', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('My Garden')).toBeInTheDocument());

    const leaveBtn = await screen.findByTestId('leave-garden-button');
    fireEvent.click(leaveBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/memberships/1/'), // userMembership.id is 1
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('handles garden edit', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('My Garden')).toBeInTheDocument());

    const editBtn = await screen.findByTestId('edit-garden-button');
    fireEvent.click(editBtn);

    await waitFor(() => expect(screen.getByTestId('garden-modal')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Submit Garden'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/gardens/1/'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  it('handles garden delete', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('My Garden')).toBeInTheDocument());

    // First open the edit modal
    const editBtn = await screen.findByTestId('edit-garden-button');
    fireEvent.click(editBtn);

    await waitFor(() => expect(screen.getByTestId('garden-modal')).toBeInTheDocument());

    // Now click the delete button inside the modal
    const deleteBtn = await screen.findByTestId('delete-garden-button');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/gardens/1/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
