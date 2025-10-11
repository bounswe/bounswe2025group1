import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

const CalendarTab = ({ tasks, onTaskClick, onEmptyDayClick }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const startOfMonth = currentMonth.startOf('month').startOf('week');
  const endOfMonth = currentMonth.endOf('month').endOf('week');

  const pastelChipColors = [
    '#f3e5f5', // purple
    '#e8f5e9', // green
    '#fff3e0', // orange
    '#f1f8e9', // mint
    '#ede7f6', // lavender
    '#f9fbe7', // lemon
    '#e0f7fa', // aqua
  ];

  const getColorForTask = (key) => {
    const str = typeof key === 'string' ? key : key?.toString();
    const hash = [...str].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return pastelChipColors[hash % pastelChipColors.length];
  };

  const generateCalendarGrid = () => {
    const days = [];
    let current = startOfMonth.clone();
    while (current.isBefore(endOfMonth) || current.isSame(endOfMonth)) {
      days.push(current.clone());
      current = current.add(1, 'day');
    }
    return days;
  };

  const days = generateCalendarGrid();

  const getTasksForDay = (date) => {
    return tasks.filter((task) => dayjs(task.due_date).isSame(date, 'day'));
  };

  const getChipColor = (task) => {
    const title = task.title?.toLowerCase() || '';

    if (title.includes('water')) return '#e0f7fa'; // aqua
    if (title.includes('harvest')) return '#e8f5e9'; // green
    if (title.includes('prune')) return '#fff3e0'; // peach
    if (title.includes('fertiliz')) return '#f1f8e9'; // mint
    if (title.includes('pest') || title.includes('bug')) return '#fce4ec'; // rose
    if (title.includes('maintain')) return '#ede7f6'; // lavender

    return getColorForTask(task.id || task.title); //random fallback color
  };

  const getChipEmoji = (task) => {
    const title = task.title.toLowerCase();
    if (title.includes('water')) return '💧';
    if (title.includes('harvest')) return '🌿';
    if (title.includes('prune')) return '✂️';
    if (title.includes('fertiliz')) return '🧪';
    if (title.includes('pest') || title.includes('bug')) return '🐛';
    if (title.includes('maintain')) return '🔧';
    return '🗂️';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          onClick={() => setCurrentMonth((prev) => prev.subtract(1, 'month'))}
          variant="outlined"
        >
          &lt;
        </Button>
        <Typography variant="h5" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
          {currentMonth.format('MMMM YYYY')}
        </Typography>
        <Button onClick={() => setCurrentMonth((prev) => prev.add(1, 'month'))} variant="outlined">
          &gt;
        </Button>
      </Box>

      {/* Day headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          mb: 1,
        }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Typography key={day} variant="subtitle2" align="center" fontWeight="bold">
            {day}
          </Typography>
        ))}
      </Box>

      {/* Calendar Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
        }}
      >
        {days.map((date) => {
          const dateKey = date.format('YYYY-MM-DD');
          const tasksForDay = getTasksForDay(date);

          return (
            <Paper
              key={dateKey}
              variant="outlined"
              sx={{
                minHeight: 120,
                p: 1.2,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                cursor: tasksForDay.length === 0 ? 'pointer' : 'default',
                '&:hover': {
                  backgroundColor: tasksForDay.length === 0 ? '#f1f8e9' : undefined,
                },
              }}
              onClick={() => {
                if (tasksForDay.length === 0 && onEmptyDayClick) {
                  onEmptyDayClick(date);
                }
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {date.date()}
              </Typography>
              <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {tasksForDay.map((task) => (
                  <Chip
                    key={task.id}
                    label={`${getChipEmoji(task)} ${task.title}`}
                    size="small"
                    sx={{ maxWidth: '100%', bgcolor: getChipColor(task), cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                  />
                ))}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default CalendarTab;
