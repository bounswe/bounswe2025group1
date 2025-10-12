import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const STATUS_ORDER = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};
const STATUS_COLORS = {
  PENDING: '#bbdefb',
  IN_PROGRESS: '#ffe0b2',
  COMPLETED: '#c8e6c9',
};

const TaskBoard = ({ tasks, handleTaskUpdate, onTaskClick }) => {
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
                  borderTop: `6px solid ${STATUS_COLORS[status]}`,
                  borderRadius: 2,
                  backgroundColor: '#fafafa',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {STATUS_LABELS[status]} ({tasks.filter((t) => t.status === status).length})
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
                            backgroundColor: task.status === 'COMPLETED' ? '#f5f5f5' : '#ffffff',
                            opacity: task.status === 'COMPLETED' ? 0.85 : 1,
                            color: task.status === 'COMPLETED' ? 'rgba(0,0,0,0.5)' : '',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            },
                          }}
                        >
                          <Typography variant="subtitle2">{task.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Due:{' '}
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption">
                              {task.assigned_to_username || 'Unassigned'}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => onTaskClick?.(task)}
                              sx={{ color: '#558b2f', p: 0, minWidth: 'auto' }}
                            >
                              Details
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
