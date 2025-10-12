import { blue, green, orange } from '@mui/material/colors';

const bgForStatus = (status) => {
  switch (status) {
    case 'PENDING':
      return orange[100];
    case 'IN_PROGRESS':
      return blue[100];
    case 'COMPLETED':
      return green[100];
    default:
      return blue[100];
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
    default:
      return blue[700];
  }
};

export { bgForStatus, iconColorForStatus };
