import { useTheme } from '@mui/material/styles';

/**
 * Hook to get RTL-aware spacing
 * Returns 'marginLeft' in LTR and 'marginRight' in RTL
 */
export const useRTLSpace = () => {
  const theme = useTheme();
  const isRTL = theme.direction === 'rtl';
  
  return {
    marginEnd: isRTL ? 'marginLeft' : 'marginRight',
    marginStart: isRTL ? 'marginRight' : 'marginLeft',
  };
};

/**
 * Returns 'right' in LTR and 'left' in RTL for positioning
 */
export const useRTLSide = () => {
  const theme = useTheme();
  const isRTL = theme.direction === 'rtl';
  
  return {
    start: isRTL ? 'right' : 'left',
    end: isRTL ? 'left' : 'right',
  };
};

