'use client';

import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  Button,
} from '@mui/material';
import {
  Close,
  Notifications,
  CheckCircle,
  Work,
  People,
  Chat,
  Schedule,
} from '@mui/icons-material';
import { styled } from '@mui/system';

const NotificationDrawer = styled(Drawer)({
  '& .MuiDrawer-paper': {
    width: 380,
    maxWidth: '90vw',
  },
});

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: any[];
}

export default function NotificationPanel({ open, onClose, notifications }: NotificationPanelProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <Work color="primary" />;
      case 'message':
        return <Chat color="info" />;
      case 'interview':
        return <Schedule color="warning" />;
      case 'status':
        return <CheckCircle color="success" />;
      default:
        return <Notifications color="action" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'application':
        return '#3b82f6';
      case 'message':
        return '#06b6d4';
      case 'interview':
        return '#f59e0b';
      case 'status':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <NotificationDrawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={notifications.length} color="error">
              <Notifications />
            </Badge>
            <Typography variant="h6" fontWeight="600">
              Notifications
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Notifications List */}
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                You'll see updates here when you receive new applications or messages.
              </Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => (
              <ListItem
                key={index}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  backgroundColor: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                  borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${getNotificationColor(notification.type)}20` }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" fontWeight="600">
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 2 }}>
            <Button fullWidth variant="outlined" size="small">
              Mark All as Read
            </Button>
          </Box>
        )}
      </Box>
    </NotificationDrawer>
  );
}