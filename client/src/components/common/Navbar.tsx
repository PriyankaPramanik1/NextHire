'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Work,
  Person,
} from '@mui/icons-material';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleProfile = () => {
    if (user?.role === 'jobseeker') {
      router.push('/jobseeker/profile');
    } else if (user?.role === 'employer') {
      router.push('/employer/profile');
    }
    handleClose();
  };

  return (
    <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Toolbar>
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => router.push('/')}>
          <Work sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            NextHire
          </Typography>
        </Box>

        {user ? (
          <Box display="flex" alignItems="center">
            <Typography variant="body1" sx={{ mr: 2 }}>
              Welcome, {user.name} ({user.role})
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: '#667eea' }}>
                <Person />
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => router.push('/')}>
              Login
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}