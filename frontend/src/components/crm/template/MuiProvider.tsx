'use client'

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#9155FD', // Couleur violette signature du template
    },
    secondary: {
      main: '#8A8D93',
    },
    success: {
      main: '#56CA00',
    },
    error: {
      main: '#FF4C51',
    },
    warning: {
      main: '#FFB400',
    },
    info: {
      main: '#16B1FF',
    },
    background: {
      paper: '#FFFFFF',
      default: '#F4F5FA',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 18px 0px rgba(76, 78, 100, 0.1)',
          borderRadius: '10px',
          border: 'none',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        title: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
  },
});

export default function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}
