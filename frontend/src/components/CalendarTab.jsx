import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Box, Typography, Paper, Chip, Button, useTheme } from '@mui/material';
import { bgForStatus } from '../utils/taskUtils';
import { useTranslation } from 'react-i18next';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

const CalendarTab = ({ tasks, handleTaskClick, onEmptyDayClick }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const startOfMonth = currentMonth.startOf('month').startOf('week');
  const endOfMonth = currentMonth.endOf('month').endOf('week');

  const getTranslatedMonthYear = (date) => {
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthKey = monthNames[date.month()];
    return `${t(`calendar.${monthKey}`)} ${date.year()}`;
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

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          onClick={() => setCurrentMonth((prev) => prev.subtract(1, 'month'))}
          variant="outlined"
        >
          &lt;
        </Button>
        <Typography variant="h5" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
          {getTranslatedMonthYear(currentMonth)}
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
        {[
          t('calendar.sun'), 
          t('calendar.mon'), 
          t('calendar.tue'), 
          t('calendar.wed'), 
          t('calendar.thu'), 
          t('calendar.fri'), 
          t('calendar.sat')
        ].map((day, index) => (
          <Typography key={index} variant="subtitle2" align="center" fontWeight="bold">
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
                  backgroundColor: tasksForDay.length === 0 ? theme.palette.action.hover : undefined,
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
                    label={task.title}
                    size="small"
                    sx={{ 
                      maxWidth: '100%', 
                      bgcolor: bgForStatus(task.status, theme),
                      color: theme.palette.text.primary,
                      cursor: 'pointer',
                      '& .MuiChip-label': {
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(task);
                    }}
                  />
                ))}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </>
  );
};

export default CalendarTab;
