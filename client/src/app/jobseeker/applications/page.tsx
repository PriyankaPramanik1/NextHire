// =============================================================================
// ENHANCED APPLICATIONS PAGE
// File: app/jobseeker/applications/page.tsx
// Features: View all applications, Filter by status (Interviews, Rejected, Hired)
// =============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Work,
  CheckCircle,
  Cancel,
  AccessTime,
  EmojiEvents,
  Send,
  Visibility,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import axios from '@/lib/axios';
import { Application } from '@/types';

const StatusChip = styled(Chip)({
  fontWeight: 'bold',
});

const ApplicationCard = styled(Card)({
  marginBottom: '1rem',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)',
  },
});

const StatCard = styled(Card)({
  textAlign: 'center',
  padding: '1rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'applied': return 'primary';
    case 'shortlisted': return 'secondary';
    case 'hired': return 'success';
    case 'rejected': return 'error';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'applied': return <AccessTime />;
    case 'shortlisted': return <CheckCircle />;
    case 'hired': return <EmojiEvents />;
    case 'rejected': return <Cancel />;
    default: return <AccessTime />;
  }
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [tabValue, applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/applications');
      setApplications(response.data.applications || response.data || []);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    switch (tabValue) {
      case 0: // All
        setFilteredApplications(applications);
        break;
      case 1: // Pending
        setFilteredApplications(applications.filter(app => app.status === 'applied'));
        break;
      case 2: // Interviews (Shortlisted)
        setFilteredApplications(applications.filter(app => app.status === 'shortlisted'));
        break;
      case 3: // Rejected
        setFilteredApplications(applications.filter(app => app.status === 'rejected'));
        break;
      case 4: // Hired
        setFilteredApplications(applications.filter(app => app.status === 'hired'));
        break;
      default:
        setFilteredApplications(applications);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'applied').length,
      interviews: applications.filter(app => app.status === 'shortlisted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      hired: applications.filter(app => app.status === 'hired').length,
    };
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/jobseeker/jobs/${jobId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const stats = getStats();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="700">
        My Applications
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track the status of your job applications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs:6, sm:4, md:2.4}}>
          <StatCard>
            <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
            <Typography variant="body2">Total</Typography>
          </StatCard>
        </Grid>
        <Grid size={{xs:6, sm:4, md:2.4}}>
          <StatCard>
            <Typography variant="h4" fontWeight="bold">{stats.pending}</Typography>
            <Typography variant="body2">Pending</Typography>
          </StatCard>
        </Grid>
        <Grid size={{xs:6, sm:4, md:2.4}}>
          <StatCard>
            <Typography variant="h4" fontWeight="bold">{stats.interviews}</Typography>
            <Typography variant="body2">Interviews</Typography>
          </StatCard>
        </Grid>
        <Grid size={{xs:6, sm:4, md:2.4}}>
          <StatCard>
            <Typography variant="h4" fontWeight="bold">{stats.rejected}</Typography>
            <Typography variant="body2">Rejected</Typography>
          </StatCard>
        </Grid>
        <Grid size={{xs:6, sm:4, md:2.4}}>
          <StatCard>
            <Typography variant="h4" fontWeight="bold">{stats.hired}</Typography>
            <Typography variant="body2">Hired</Typography>
          </StatCard>
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
            },
          }}
        >
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Pending (${stats.pending})`} />
          <Tab label={`Interviews (${stats.interviews})`} icon={<CheckCircle />} iconPosition="start" />
          <Tab label={`Rejected (${stats.rejected})`} icon={<Cancel />} iconPosition="start" />
          <Tab label={`Hired (${stats.hired})`} icon={<EmojiEvents />} iconPosition="start" />
        </Tabs>
      </Card>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {tabValue === 0 ? 'No Applications Yet' : 
               tabValue === 1 ? 'No Pending Applications' :
               tabValue === 2 ? 'No Interview Invitations' :
               tabValue === 3 ? 'No Rejected Applications' :
               'No Hired Applications'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {tabValue === 0 && 'Start applying to jobs to track your progress here.'}
              {tabValue === 2 && 'Keep applying! Interview invitations will appear here.'}
              {tabValue === 4 && 'Congratulations on your job offers will appear here!'}
            </Typography>
            {tabValue === 0 && (
              <Button variant="contained" onClick={() => router.push('/jobseeker/jobs')}>
                Browse Jobs
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredApplications.map((application) => (
            <Grid size={{xs:12}} key={application._id}>
              <ApplicationCard>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={2}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        {application.job?.title || 'Job Title'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {application.job?.employer?.company?.name || 'Company'} • {application.job?.location || 'Location'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Applied on {formatDate(application.createdAt)}
                      </Typography>
                    </Box>
                    <StatusChip
                      icon={getStatusIcon(application.status)}
                      label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      color={getStatusColor(application.status) as any}
                      variant="filled"
                    />
                  </Box>

                  {application.coverLetter && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Cover Letter:
                      </Typography>
                      <Typography variant="body2">
                        {application.coverLetter}
                      </Typography>
                    </Box>
                  )}

                  {/* Status Timeline */}
                  {application.statusHistory && application.statusHistory.length > 0 && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                        Application Timeline:
                      </Typography>
                      
                      <Timeline position="right" sx={{ p: 0, m: 0 }}>
                        {application.statusHistory.map((history, index) => (
                          <TimelineItem key={index}>
                            <TimelineOppositeContent sx={{ flex: 0.2, py: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(history.date)}
                              </Typography>
                            </TimelineOppositeContent>
                            <TimelineSeparator>
                              <TimelineDot color={getStatusColor(history.status) as any}>
                                {getStatusIcon(history.status)}
                              </TimelineDot>
                              {index < application.statusHistory.length - 1 && <TimelineConnector />}
                            </TimelineSeparator>
                            <TimelineContent sx={{ py: 1 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                              </Typography>
                              {history.note && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {history.note}
                                </Typography>
                              )}
                            </TimelineContent>
                          </TimelineItem>
                        ))}
                      </Timeline>
                    </>
                  )}

                  {/* Action Button */}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewJob(application.job?._id)}
                      size="small"
                    >
                      View Job Details
                    </Button>
                  </Box>
                </CardContent>
              </ApplicationCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}