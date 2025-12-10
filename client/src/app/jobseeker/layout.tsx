'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import {
  Container,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';

export default function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'jobseeker')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'jobseeker') {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Access denied. Please log in as a job seeker.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}