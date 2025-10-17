import { blue, green, orange, red } from '@mui/material/colors';

const bgForStatus = (status, theme) => {
  const isDark = theme?.palette?.mode === 'dark';
  
  if (isDark) {
    // Dark mode colors with better contrast
    switch (status) {
      case 'PENDING':
        return 'rgba(255, 152, 0, 0.15)'; // Orange with transparency
      case 'IN_PROGRESS':
        return 'rgba(33, 150, 243, 0.15)'; // Blue with transparency
      case 'COMPLETED':
        return 'rgba(76, 175, 80, 0.15)'; // Green with transparency
      case 'DECLINED':
        return 'rgba(244, 67, 54, 0.15)'; // Red with transparency
      default:
        return 'rgba(33, 150, 243, 0.15)';
    }
  } else {
    // Light mode colors
    switch (status) {
      case 'PENDING':
        return orange[100];
      case 'IN_PROGRESS':
        return blue[100];
      case 'COMPLETED':
        return green[100];
      case 'DECLINED':
        return red[100];
      default:
        return blue[100];
    }
  }
};

const iconColorForStatus = (status) => {
  switch (status) {
    case 'PENDING':
      return orange[700];
    case 'IN_PROGRESS':
      return blue[700];
    case 'COMPLETED':
      return green[700];
    case 'DECLINED':
      return red[700];
    default:
      return blue[700];
  }
};

export { bgForStatus, iconColorForStatus };
