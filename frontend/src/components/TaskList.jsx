import React, { useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  ButtonBase,
  useTheme,
} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { bgForStatus, iconColorForStatus } from '../utils/taskUtils';
import { useAuth } from '../contexts/AuthContextUtils';
import { createListNavigation, createButtonKeyboardHandler } from '../utils/keyboardNavigation';

const TaskList = ({
  tasks = [],
  title = 'Tasks',
  handleTaskClick,
  handleAcceptTask,
  handleDeclineTask,
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const listRef = useRef(null);
  const taskRefs = useRef([]);


  // Create keyboard navigation for the task list
  const listNavigation = createListNavigation(
    tasks,
    (task, index) => {
      if (handleTaskClick) {
        handleTaskClick(task);
      }
    },
    (task, index) => {
      // Focus the task item
      if (taskRefs.current[index]) {
        taskRefs.current[index].focus();
      }
    }
  );

  // Handle keyboard navigation for the entire list
  const handleListKeyDown = (event) => {
    listNavigation.handleKeyDown(event);
  };

  // Set up refs for each task item
  useEffect(() => {
    taskRefs.current = taskRefs.current.slice(0, tasks.length);
  }, [tasks.length]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        height: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TaskAltIcon sx={{ mr: 1 }} /> {title}
        </Box>
        {tasks.length > 0 && (
          <Chip
            label={tasks.length}
            size="small"
            color="primary"
            sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9', 
              color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32', 
              fontWeight: 'bold' 
            }}
          />
        )}
      </Typography>

      {tasks.length > 0 ? (
        <List 
          ref={listRef}
          className="nice-scroll" 
          sx={{ overflowY: 'auto', flexGrow: 1, pr: 1 }} 
          dense
          onKeyDown={handleListKeyDown}
          role="listbox"
          aria-label="Task list"
        >
          {tasks.map((task, index) => (
            <ListItem
              key={task.id}
              ref={(el) => (taskRefs.current[index] = el)}
              component="div"
              sx={{
                mb: 1,
                borderRadius: 1,
                cursor: handleTaskClick ? 'pointer' : 'default',
                bgcolor: bgForStatus(task.status, theme),
                '&:focus': {
                  outline: '2px solid #558b2f',
                  outlineOffset: '2px',
                },
                '&:hover': {
                  bgcolor: bgForStatus(task.status, theme),
                  filter: 'brightness(0.95)',
                },
              }}
              onClick={() => handleTaskClick && handleTaskClick(task)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (handleTaskClick) {
                    handleTaskClick(task);
                  }
                }
              }}
              tabIndex={0}
              role="option"
              aria-selected="false"
            >
              <ListItemIcon>
                <TaskAltIcon sx={{ color: iconColorForStatus(task.status) }} />
              </ListItemIcon>
              <ListItemText
                primary={task.title}
                secondary={`Due: ${new Date(task.due_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}`}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                  },
                  '& .MuiListItemText-secondary': {
                    color: theme.palette.text.secondary,
                  },
                }}
              />
              {user && task.assigned_to === user.user_id && task.status === 'PENDING' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label="Accept"
                    size="small"
                    color="success"
                    component={ButtonBase}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptTask(task);
                    }}
                    onKeyDown={createButtonKeyboardHandler(() => {
                      handleAcceptTask(task);
                    })}
                    sx={{ 
                      cursor: 'pointer',
                      '&:focus': {
                        outline: '2px solid #4caf50',
                        outlineOffset: '2px',
                      },
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Accept task: ${task.title}`}
                  />
                  <Chip
                    label="Decline"
                    size="small"
                    color="error"
                    component={ButtonBase}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeclineTask(task);
                    }}
                    onKeyDown={createButtonKeyboardHandler(() => {
                      handleDeclineTask(task);
                    })}
                    sx={{ 
                      cursor: 'pointer',
                      '&:focus': {
                        outline: '2px solid #f44336',
                        outlineOffset: '2px',
                      },
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Decline task: ${task.title}`}
                  />
                </Box>
              )}
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ py: 2, textAlign: 'center', flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            No tasks available.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TaskList;
