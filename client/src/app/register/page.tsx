'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Box,
  Grid,
} from '@mui/material';
import { styled } from '@mui/system';

const GradientBackground = styled(Box)({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
});

const StyledPaper = styled(Paper)({
  padding: '2rem',
  borderRadius: '15px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
});

export default function RegisterPage() {
  const [formData, setFormData] = useState<{
  name: string;
  email: string;
  password: string;
  role: 'jobseeker';
}>({
  name: '',
  email: '',
  password: '',
  role: 'jobseeker', 
});

  const [error, setError] = useState('');

  const { register, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      user.role === 'jobseeker'
        ? router.push('/jobseeker/dashboard')
        : router.push('/employer/dashboard');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <GradientBackground>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">

          {/* Left Section */}
          <Grid size={{xs:12, md:6}}>
            <Box textAlign="center" color="white">
              <Typography variant="h2" fontWeight="bold">Join NextHire</Typography>
              <Typography variant="body1">
                Create an account and start exploring job opportunities.
              </Typography>
            </Box>
          </Grid>

          {/* Register Form */}
          <Grid size={{xs:12, md:6}}>
            <StyledPaper>
              <Typography variant="h4" textAlign="center" color="primary" gutterBottom>
                Create Account
              </Typography>

              {error && <Alert severity="error">{error}</Alert>}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  margin="normal"
                  required
                />

                

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Sign Up
                </Button>

                <Box textAlign="center">
                  <Button color="primary" onClick={() => router.push('/')}>
                    Already have an account? Sign in
                  </Button>
                </Box>
              </form>
            </StyledPaper>
          </Grid>

        </Grid>
      </Container>
    </GradientBackground>
  );
}
