import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { bgForStatus, iconColorForStatus } from '../utils/taskUtils';
import { useAuth } from '../contexts/AuthContextUtils';

const TaskList = ({
  tasks = [],
  title = 'Tasks',
  handleTaskClick,
  handleAcceptTask,
  handleDeclineTask,
}) => {
  const { user } = useAuth();

  console.log(tasks);
  console.log(user);

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
            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }}
          />
        )}
      </Typography>

      {tasks.length > 0 ? (
        <List className="nice-scroll" sx={{ overflowY: 'auto', flexGrow: 1, pr: 1 }} dense>
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              sx={{
                mb: 1,
                borderRadius: 1,
                cursor: handleTaskClick ? 'pointer' : 'default',
                bgcolor: bgForStatus(task.status),
              }}
              onClick={() => handleTaskClick(task)}
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
              />
              {user && task.assigned_to === user.user_id && task.status === 'PENDING' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label="Accept"
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptTask(task);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Decline"
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeclineTask(task);
                    }}
                    sx={{ cursor: 'pointer' }}
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
