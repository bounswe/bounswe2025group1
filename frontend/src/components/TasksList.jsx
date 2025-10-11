import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

const TasksList = ({ tasks = [], title = 'Tasks', limit = 5 }) => {
  // Filter tasks by status if needed
  const filteredTasks = tasks.slice(0, limit);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        height: '100%',
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

      {filteredTasks.length > 0 ? (
        <List sx={{ overflow: 'auto', flexGrow: 1 }} dense>
          {filteredTasks.map((task) => (
            <ListItem
              key={task.id}
              sx={{
                mb: 1,
                borderRadius: 1,
                bgcolor:
                  task.status === 'Pending'
                    ? '#fff9c4'
                    : task.status === 'In Progress'
                    ? '#e3f2fd'
                    : '#e8f5e9',
              }}
            >
              <ListItemIcon>
                <TaskAltIcon
                  color={
                    task.status === 'Pending'
                      ? 'warning'
                      : task.status === 'In Progress'
                      ? 'primary'
                      : 'success'
                  }
                />
              </ListItemIcon>
              <ListItemText
                primary={task.title}
                secondary={`Due: ${new Date(task.due_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}`}
              />
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

export default TasksList;
