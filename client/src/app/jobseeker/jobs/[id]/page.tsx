'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from '@/lib/axios';
import { Job } from '@/types';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  LocationOn,
  WorkOutline,
  AttachMoney,
  Schedule,
  Business,
  ArrowBack,
  Share,
  BookmarkBorder,
  Bookmark,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = params?.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
  useEffect(() => {
  // Only fetch if jobId exists
  if (jobId) {
    fetchJobDetails();
    checkApplicationStatus();
    checkSavedStatus();
  } else {
    setError('Job ID not found');
    setLoading(false);
  }
}, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/jobs/getJob/${jobId}`);
      setJob(response.data.job || response.data);
      setError('');
    } catch (error: any) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get('/applications');
      const applications = response.data.applications || response.data || [];
      const applied = applications.some((app: any) => app.job?._id === jobId);
      setHasApplied(applied);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const checkSavedStatus = async () => {
    try {
      // Check if job is saved by user
      const response = await axios.get('/users/profile');
      const savedJobs = response.data.profile?.savedJobs || [];
      const saved = savedJobs.includes(jobId);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleApply = () => {
    router.push(`/jobseeker/dashboard?apply=${jobId}`);
  };

  const handleSaveJob = async () => {
    try {
      if (isSaved) {
        // Remove from saved
        await axios.delete(`/users/saved-jobs/${jobId}`);
        setIsSaved(false);
      } else {
        // Add to saved
        await axios.post(`/users/saved-jobs/${jobId}`);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${job?.employer?.company?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/jobseeker/jobs')}>
          Back to Jobs
        </Button>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Job not found
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/jobseeker/jobs')}>
          Back to Jobs
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          color="inherit"
          onClick={() => router.push('/jobseeker/dashboard')}
          sx={{ cursor: 'pointer' }}
        >
          Dashboard
        </Link>
        <Link
          component="button"
          color="inherit"
          onClick={() => router.push('/jobseeker/jobs')}
          sx={{ cursor: 'pointer' }}
        >
          Jobs
        </Link>
        <Typography color="text.primary">{job.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={3}>
        {/* Left Column - Job Details */}
        <Grid size={{xs:12, md:8}} >
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
            {/* Job Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                {job.title}
              </Typography>
              
              <Box display="flex" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center">
                  <Business sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    {job.employer?.company?.name || job.employer?.name}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center">
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">{job.location}</Typography>
                </Box>
              </Box>

              {/* Quick Info Chips */}
              <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                <Chip
                  icon={<WorkOutline />}
                  label={job.type}
                  variant="outlined"
                  size="medium"
                />
                <Chip
                  icon={<AttachMoney />}
                  label={`$${job.salary?.min?.toLocaleString()} - $${job.salary?.max?.toLocaleString()}`}
                  variant="outlined"
                  size="medium"
                  color="primary"
                />
                {job.experience && (
                  <Chip
                    label={job.experience}
                    variant="outlined"
                    size="medium"
                  />
                )}
                {job.category && (
                  <Chip
                    label={job.category}
                    variant="outlined"
                    size="medium"
                  />
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Job Description */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Job Description
              </Typography>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {job.description}
              </Typography>
            </Box>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Requirements
                </Typography>
                <ul style={{ paddingLeft: '20px' }}>
                  {job.requirements.map((req, index) => (
                    <li key={index}>
                      <Typography variant="body1">{req}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Required Skills
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {job.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Application Details */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Application Details
              </Typography>
              <Grid container spacing={2}>
                {job.applicationDeadline && (
                  <Grid size={{xs:12, sm:6}} >
                    <Box display="flex" alignItems="center">
                      <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Application Deadline
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(job.applicationDeadline)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {job.createdAt
 && (
                  <Grid size={{xs:12, sm:6}}>
                    <Box display="flex" alignItems="center">
                      <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Posted On
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(job.createdAt
)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>

          {/* Company Info */}
          {job.employer?.company && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                About the Company
              </Typography>
              <Typography variant="body1" paragraph>
                {job.employer.company.description || 
                 `Learn more about ${job.employer.company.name}, the company behind this opportunity.`}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {job.employer.company.website && (
                  <Grid size={{xs:12, sm:6}}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Website
                    </Typography>
                    <Typography variant="body1">
                      <a 
                        href={job.employer.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {job.employer.company.website}
                      </a>
                    </Typography>
                  </Grid>
                )}
                {job.employer.company.location && (
                  <Grid size={{xs:12, sm:6}}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {job.employer.company.location}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Action Panel */}
        <Grid size={{xs:12, md:4}}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Job Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={hasApplied || !user}
                  onClick={handleApply}
                  sx={{ py: 1.5 }}
                >
                  {hasApplied ? 'Already Applied' : 'Apply Now'}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={isSaved ? <Bookmark /> : <BookmarkBorder />}
                  onClick={handleSaveJob}
                  sx={{ py: 1.5 }}
                >
                  {isSaved ? 'Saved' : 'Save Job'}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<Share />}
                  onClick={handleShare}
                  sx={{ py: 1.5 }}
                >
                  Share
                </Button>
                
                <Button
                  variant="text"
                  size="large"
                  fullWidth
                  startIcon={<ArrowBack />}
                  onClick={() => router.push('/jobseeker/jobs')}
                  sx={{ py: 1.5 }}
                >
                  Back to Jobs
                </Button>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Job Information
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Job Type:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {job.type}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Experience:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {job.experience || 'Not specified'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Salary Range:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    ${job.salary?.min?.toLocaleString()} - ${job.salary?.max?.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent:'space-between' }}>
                  <Typography variant="body2">Location:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {job.location}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Similar Jobs Suggestion */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Similar Jobs
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Explore other opportunities that match your skills
              </Typography>
              <Button
                variant="text"
                fullWidth
                onClick={() => router.push('/jobseeker/jobs')}
              >
                Browse All Jobs →
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}