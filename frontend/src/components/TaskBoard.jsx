import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button
} from '@mui/material';
import {
  DragDropContext,
  Droppable,
  Draggable
} from '@hello-pangea/dnd';

const STATUS_ORDER = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
};
const STATUS_COLORS = {
  PENDING: '#ff9800',
  IN_PROGRESS: '#2196f3',
  COMPLETED: '#4caf50'
};

const TaskBoard = ({ tasks, setTasks, onStatusUpdate, onTaskClick }) => {
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const taskId = parseInt(draggableId);
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: destination.droppableId } : task
    );
    setTasks(updatedTasks);

    if (onStatusUpdate) {
      onStatusUpdate(taskId, destination.droppableId);
    }
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
                  backgroundColor: '#fafafa'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {STATUS_LABELS[status]} ({tasks.filter(t => t.status === status).length})
                </Typography>

                {tasks
                  .filter(task => task.status === status)
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
                            borderRadius: 1,
                            backgroundColor: '#ffffff',
                            boxShadow: 1,
                            cursor: 'grab'
                          }}
                        >
                          <Typography variant="subtitle2">{task.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption">
                              {task.assignee || 'Unassigned'}
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
