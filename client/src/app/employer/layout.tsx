'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  Business,
  Work,
  People,
  Chat,
  Notifications,
  Settings,
  Menu as MenuIcon,
  Logout,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles'; // Changed from '@mui/system'
import NotificationPanel from '@/components/employer/NotificationPanel';
import './employer.css';

const drawerWidth = 280;

// Fixed: Using MUI's styled with proper theme typing
const Main = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions?.create('margin', {
    easing: theme.transitions?.easing?.sharp || 'cubic-bezier(0.4, 0, 0.2, 1)',
    duration: theme.transitions?.duration?.leavingScreen || 225,
  }) || 'margin 225ms cubic-bezier(0.4, 0, 0.2, 1)',
  marginLeft: 0,
}));

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role !== 'employer') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // const response = await axios.get('/notifications');
        // setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigationItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/employer/dashboard' },
    { text: 'Company Profile', icon: <Business />, path: '/employer/profile' },
    { text: 'Post a Job', icon: <Work />, path: '/employer/jobs/create' },
    { text: 'My Jobs', icon: <Work />, path: '/employer/jobs' },
    { text: 'applications', icon: <People />, path: '/employer/applications' },
    { text: 'Messages', icon: <Chat />, path: '/employer/chat' },
    { text: 'Settings', icon: <Settings />, path: '/employer/settings' },
  ];

  const drawer = (
    <Box sx={{ 
      height: '100%',
      background: 'linear-gradient(180deg, #1a237e 0%, #283593 100%)',
      color: 'white',
    }}>
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <Avatar
          src={user?.profile?.profilePicture?.url}
          sx={{ 
            width: 56, 
            height: 56,
            border: '3px solid rgba(255,255,255,0.2)',
          }}
        >
          {user?.name?.charAt(0)}
        </Avatar>
        <Box sx={{ ml: 2 }}>
          <Typography variant="subtitle1" fontWeight="600">
            {user?.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {user?.role?.toUpperCase()}
          </Typography>
        </Box>
      </Box>

      <List sx={{ mt: 2 }}>
        {navigationItems.map((item) => (
          <ListItem
            key={item.text}
            disablePadding
            sx={{
              mb: 1,
              mx: 2,
            }}
          >
            <ListItemButton
              onClick={() => {
                router.push(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                backgroundColor: pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ position: 'absolute', bottom: 20, width: '100%', px: 3 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              backgroundColor: 'rgba(255,0,0,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,0,0,0.2)',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#ff6b6b' }}>
              <Logout />
            </ListItemIcon>
            <ListItemText 
              primary="Logout"
              primaryTypographyProps={{ color: '#ff6b6b', fontWeight: 600 }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  if (!user || user.role !== 'employer') {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: 'linear-gradient(90deg, #1a237e 0%, #283593 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Employer Dashboard
          </Typography>

          <IconButton 
            color="inherit" 
            onClick={() => setNotificationsOpen(true)}
            sx={{ mr: 2 }}
          >
            <Badge badgeContent={notifications.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenuOpen} color="inherit">
            <Avatar 
              src={user?.profile?.profilePicture?.url}
              sx={{ width: 40, height: 40 }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
              },
            }}
          >
            <MenuItem onClick={() => router.push('/employer/profile')}>
              <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                {user?.name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: '#ff6b6b' }}>
              <Logout sx={{ mr: 2 }} fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Main sx={{ 
        pt: 10,
        pb: 4,
        background: '#f8fafc',
        minHeight: '100vh',
      }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Main>

      <NotificationPanel 
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
      />
    </Box>
  );
}