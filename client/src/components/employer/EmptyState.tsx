import { Box, Typography, Button, SvgIcon } from '@mui/material';
import { Add, SearchOff, Inbox } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'search' | 'inbox' | 'add';
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  title, 
  description, 
  icon = 'inbox',
  actionLabel,
  onAction 
}: EmptyStateProps) {
  const getIcon = () => {
    switch (icon) {
      case 'search': return <SearchOff sx={{ fontSize: 80, color: 'text.secondary' }} />;
      case 'add': return <Add sx={{ fontSize: 80, color: 'text.secondary' }} />;
      default: return <Inbox sx={{ fontSize: 80, color: 'text.secondary' }} />;
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      {getIcon()}
      <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 2,
            px: 4,
            py: 1.5,
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}