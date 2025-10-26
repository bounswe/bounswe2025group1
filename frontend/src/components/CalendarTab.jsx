import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Box, Typography, Paper, Chip, Button, useTheme, useMediaQuery } from '@mui/material';
import { bgForStatus } from '../utils/taskUtils';
import { useTranslation } from 'react-i18next';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

const CalendarTab = ({ tasks, handleTaskClick, onEmptyDayClick }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [currentWeek, setCurrentWeek] = useState(dayjs());
  
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

  const generateWeekGrid = () => {
    const days = [];
    const weekStart = currentWeek.startOf('week');
    for (let i = 0; i < 7; i++) {
      days.push(weekStart.add(i, 'day').clone());
    }
    return days;
  };

  const days = isMobile ? generateWeekGrid() : generateCalendarGrid();

  const getTasksForDay = (date) => {
    return tasks.filter((task) => dayjs(task.due_date).isSame(date, 'day'));
  };

  const getCurrentDateLabel = () => {
    if (isMobile) {
      const weekStart = currentWeek.startOf('week');
      const weekEnd = currentWeek.endOf('week');
      const isSameMonth = weekStart.month() === weekEnd.month();
      if (isSameMonth) {
        return `${weekStart.date()} - ${weekEnd.date()} ${getTranslatedMonthYear(weekStart)}`;
      }
      return `${weekStart.date()} ${getTranslatedMonthYear(weekStart)} - ${weekEnd.date()} ${getTranslatedMonthYear(weekEnd)}`;
    }
    return getTranslatedMonthYear(currentMonth);
  };

  const handlePrevious = () => {
    if (isMobile) {
      setCurrentWeek((prev) => prev.subtract(1, 'week'));
    } else {
      setCurrentMonth((prev) => prev.subtract(1, 'month'));
    }
  };

  const handleNext = () => {
    if (isMobile) {
      setCurrentWeek((prev) => prev.add(1, 'week'));
    } else {
      setCurrentMonth((prev) => prev.add(1, 'month'));
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          onClick={handlePrevious}
          variant="outlined"
          sx={{ minWidth: { xs: 40, sm: 60 }, px: { xs: 1, sm: 2 } }}
        >
          &lt;
        </Button>
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#2e7d32', 
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.5rem' },
            textAlign: 'center',
            flex: 1,
          }}
        >
          {getCurrentDateLabel()}
        </Typography>
        <Button 
          onClick={handleNext} 
          variant="outlined"
          sx={{ minWidth: { xs: 40, sm: 60 }, px: { xs: 1, sm: 2 } }}
        >
          &gt;
        </Button>
      </Box>

      {/* Day headers - Only show on desktop */}
      {!isMobile && (
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
      )}

      {/* Calendar Grid - Different layout for mobile vs desktop */}
      <Box
        sx={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : 'row',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(7, 1fr)',
          gap: isMobile ? 1.5 : 1,
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
                minHeight: { xs: 55, sm: 120 },
                p: { xs: 1, sm: 1.2 },
                borderRadius: 2,
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                cursor: tasksForDay.length === 0 ? 'pointer' : 'default',
                backgroundColor: isMobile && tasksForDay.length === 0 
                  ? theme.palette.action.hover 
                  : 'transparent',
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
              {/* Day label and date - Different layout for mobile */}
              {isMobile && (
                <Box sx={{ minWidth: { xs: 50, sm: 100 }, mr: 1 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: { xs: '0.65rem', sm: '0.875rem' },
                    }}
                  >
                    {date.format('ddd')}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '1.1rem', sm: '2rem' },
                    }}
                  >
                    {date.date()}
                  </Typography>
                </Box>
              )}
              
              {!isMobile && (
                <Typography variant="caption" color="text.secondary">
                  {date.date()}
                </Typography>
              )}
              
              {/* Tasks */}
              <Box 
                sx={{ 
                  mt: isMobile ? 0 : 0.5, 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'column', 
                  gap: 0.5,
                  flex: 1,
                }}
              >
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
                      fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                      '& .MuiChip-label': {
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                        fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(task);
                    }}
                  />
                ))}
                {tasksForDay.length === 0 && !isMobile && (
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                    &nbsp;
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </>
  );
};

export default CalendarTab;
