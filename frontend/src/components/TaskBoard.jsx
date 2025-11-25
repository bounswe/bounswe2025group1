import React from 'react';
import { Box, Typography, Paper, Button, useTheme } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { bgForStatus, iconColorForStatus } from '../utils/taskUtils';
import { useTranslation } from 'react-i18next';

const STATUS_ORDER = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DECLINED'];
const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
};

const TaskBoard = ({ tasks, handleTaskUpdate, onTaskClick }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return; // Dropped outside a droppable area
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return; // No change in position

    const taskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;
    const updatedTask = tasks.find((task) => task.id === taskId);
    handleTaskUpdate({ ...updatedTask, status: newStatus });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        {STATUS_ORDER.map((status) => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <Paper
                ref={provided.innerRef}
                {...provided.droppableProps}
                elevation={3}
                sx={{
                  flex: 1,
                  minHeight: 500,
                  p: 2,
                  borderTop: `8px solid ${iconColorForStatus(status)}`,
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {t(`tasks.${status.toLowerCase()}`)} ({tasks.filter((t) => t.status === status).length})
                </Typography>

                {tasks
                  .filter((task) => task.status === status)
                  .map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(provided) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            p: 1.5,
                            mb: 1.2,
                            borderRadius: 2,
                            backgroundColor: bgForStatus(task.status, theme),
                          }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              color: theme.palette.text.primary,
                              fontWeight: 500,
                            }}
                          >
                            {task.title}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                            }}
                          >
                            {t('tasks.due')}:{' '}
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography 
                              variant="caption"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              {task.assigned_to_username || t('tasks.unassigned')}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => onTaskClick?.(task)}
                              sx={{ color: 'text.secondary', minWidth: 'auto' }}
                            >
                              {t('tasks.details')}
                            </Button>
                          </Box>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </Paper>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
};

export default TaskBoard;
