import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  fullScreen = false 
}: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }),
      }}
    >
      <CircularProgress 
        size={60} 
        thickness={4}
        sx={{ 
          color: '#667eea',
          mb: 2,
        }} 
      />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}