'use client';

import React, { useState, useEffect, useCallback, JSX } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from '@/lib/axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Grid,
  Paper,
  Divider,
  LinearProgress,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Badge,
  Stack,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Download,
  ArrowBack,
  Email,
  Phone,
  LocationOn,
  Work,
  School,
  CalendarToday,
  AccessTime,
  Edit,
  MoreVert,
  CheckCircle,
  Cancel,
  Schedule,
  NoteAdd,
  Share,
  Print,
  Star,
  StarBorder,
  Send,
  Visibility,
  LinkedIn,
  GitHub,
  Language,
  TrendingUp,
  Business,
  Description,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

// Styled Components
const ProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)',
  },
}));

const DetailCard = styled(Card)({
  borderRadius: 16,
  boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
});

const StatusBadge = styled(Chip)<{ status: string }>(({ theme, status }) => ({
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '8px 16px',
  fontSize: '0.75rem',
  backgroundColor: getStatusColor(status).background,
  color: getStatusColor(status).color,
  border: `2px solid ${getStatusColor(status).border}`,
}));

const ActionButton = styled(Button)({
  borderRadius: 12,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
  },
});

// Types
interface Education {
  institution: string;
  degree: string;
  field: string;
  year: number;
  description?: string;
}

interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface ApplicantProfile {
  title?: string;
  resume?: { url: string; name: string };
  skills?: string[];
  profilePicture?: { url: string };
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  experience?: Experience[];
  education?: Education[];
  summary?: string;
}

interface Applicant {
  _id: string;
  name: string;
  email: string;
  profile?: ApplicantProfile;
}

interface Job {
  _id: string;
  title: string;
  location: string;
  description?: string;
  department?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  type?: string;
  experienceLevel?: string;
}

interface ApplicationNote {
  _id: string;
  note: string;
  addedAt: string;
  addedBy: {
    _id: string;
    name: string;
  };
}

interface Application {
  _id: string;
  applicant: Applicant;
  job: Job;
  status: string;
  appliedAt: string;
  updatedAt: string;
  coverLetter?: string;
  notes: ApplicationNote[];
  resume?: string;
  favorite?: boolean;
  rating?: number;
}

// Helper Functions
const getStatusColor = (status: string) => {
  const colors: Record<string, { background: string; color: string; border: string }> = {
    applied: { background: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
    shortlisted: { background: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
    interviewed: { background: '#fef3c7', color: '#d97706', border: '#fcd34d' },
    hired: { background: '#dcfce7', color: '#15803d', border: '#86efac' },
    rejected: { background: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  };
  return colors[status] || { background: '#f3f4f6', color: '#6b7280', border: '#d1d5db' };
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getTimeSince = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export default function ApplicationDetails(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.id as string;
  
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [tabValue, setTabValue] = useState<number>(0);
  const [notesDialog, setNotesDialog] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<string>('');
  const [emailDialog, setEmailDialog] = useState<boolean>(false);
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);

  // Fetch Application Details
  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId]);

  const fetchApplicationDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/applications/employer/applications/${applicationId}`);
      const data = response.data;
      if (data.success) {
        setApplication(data.data);
        if (data.data.rating) setRating(data.data.rating);
      } else {
        throw new Error(data.message || 'Failed to load application details');
      }
    } catch (err: any) {
      console.error('Error fetching application:', err);
      setError(err.response?.data?.message || 'Failed to load application details');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load application details. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  // Action Handlers
  const handleStatusChange = async (newStatus: string) => {
    if (!application) return;
    
    setUpdating(true);
    try {
      const response = await axios.put(
        `/api/applications/employer/applications/${application._id}/status`,
        { status: newStatus }
      );
      
      if (response.data.success) {
        setApplication(prev => prev ? { ...prev, status: newStatus } : null);
        
        Swal.fire({
          icon: 'success',
          title: 'Status Updated!',
          text: `Application status changed to ${newStatus}`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to update status. Please try again.',
      });
    } finally {
      setUpdating(false);
      setAnchorEl(null);
    }
  };

  const handleAddNote = async () => {
    if (!application || !newNote.trim()) return;
    
    try {
      const response = await axios.post(
        `/api/applications/employer/applications/${application._id}/notes`,
        { note: newNote }
      );
      
      if (response.data.success) {
        setApplication(prev => prev ? {
          ...prev,
          notes: [...(prev.notes || []), response.data.note],
        } : null);
        
        setNewNote('');
        setNotesDialog(false);
        
        Swal.fire({
          icon: 'success',
          title: 'Note Added!',
          text: 'Your note has been saved successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      console.error('Error adding note:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to add note. Please try again.',
      });
    }
  };

  const handleDownloadResume = () => {
    if (!application?.applicant?.profile?.resume?.url) {
      Swal.fire({
        icon: 'info',
        title: 'No Resume',
        text: 'No resume available for download.',
      });
      return;
    }
    
    window.open(application.applicant.profile.resume.url, '_blank');
  };

  const handleSendEmail = async () => {
    if (!application) return;
    
    try {
      const response = await axios.post(`/api/applications/employer/applications/${application._id}/email`, {
        subject: emailSubject,
        body: emailBody,
      });
      
      if (response.data.success) {
        setEmailDialog(false);
        setEmailSubject('');
        setEmailBody('');
        
        Swal.fire({
          icon: 'success',
          title: 'Email Sent!',
          text: 'Email has been sent successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      console.error('Error sending email:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to send email. Please try again.',
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!application) return;
    
    try {
      const newFavorite = !application.favorite;
      const response = await axios.patch(
        `/api/applications/employer/applications/${application._id}/favorite`,
        { favorite: newFavorite }
      );
      
      if (response.data.success) {
        setApplication(prev => prev ? { ...prev, favorite: newFavorite } : null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to update favorite status.',
      });
    }
  };

  const handleRatingChange = async (newRating: number) => {
    if (!application) return;
    
    try {
      const response = await axios.patch(
        `/api/applications/employer/applications/${application._id}/rating`,
        { rating: newRating }
      );
      
      if (response.data.success) {
        setApplication(prev => prev ? { ...prev, rating: newRating } : null);
        setRating(newRating);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      console.error('Error updating rating:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to update rating.',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { label: 'Overview', icon: <Visibility /> },
    { label: 'Cover Letter', icon: <Description /> },
    { label: 'Resume', icon: <Download /> },
    { label: 'Notes', icon: <NoteAdd /> },
    { label: 'Timeline', icon: <AccessTime /> },
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
        flexDirection="column"
        gap={3}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Loading application details...
        </Typography>
      </Box>
    );
  }

  if (error || !application) {
    return (
      <Box textAlign="center" py={10}>
        <Typography variant="h4" color="error" gutterBottom>
          {error || 'Application not found'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => router.push('/employer/applications')}
          sx={{ mt: 2, borderRadius: 3 }}
        >
          Back to Applications
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/employer/applications')}
            sx={{ mb: 2, borderRadius: 3 }}
          >
            Back to Applications
          </Button>
          <Typography variant="h3" fontWeight="800" gutterBottom>
            Application Details
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review candidate information and manage application
          </Typography>
        </Box>
        
        <Box display="flex" gap={1}>
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} sx={{ border: '1px solid rgba(0,0,0,0.1)' }}>
              <Print />
            </IconButton>
          </Tooltip>
          <Tooltip title={application.favorite ? 'Remove from favorites' : 'Add to favorites'}>
            <IconButton 
              onClick={handleToggleFavorite}
              sx={{ border: '1px solid rgba(0,0,0,0.1)' }}
              color={application.favorite ? 'warning' : 'default'}
            >
              {application.favorite ? <Star /> : <StarBorder />}
            </IconButton>
          </Tooltip>
          <IconButton 
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ border: '1px solid rgba(0,0,0,0.1)' }}
          >
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Status Banner */}
      <ProfileCard sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid  size={{xs:12, md:4}}>
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar
                  src={application.applicant.profile?.profilePicture?.url}
                  sx={{ width: 80, height: 80, border: '4px solid rgba(255,255,255,0.3)' }}
                >
                  {application.applicant.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="700">
                    {application.applicant.name}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {application.applicant.email}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                    {application.applicant.profile?.title}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid size={{xs:12, md:4}}>
              <Box textAlign="center">
                <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>
                  Applied Position
                </Typography>
                <Typography variant="h5" fontWeight="600">
                  {application.job.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {application.job.location}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{xs:12, md:4}}>
              <Box textAlign="right">
                <StatusBadge
                  label={application.status}
                  status={application.status}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Applied {getTimeSince(application.appliedAt)}
                </Typography>
                <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                  {formatDate(application.appliedAt)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </ProfileCard>

      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              py: 2,
              px: 3,
              minHeight: 60,
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{xs:12, lg:8}} >
          {/* Cover Letter Tab */}
          {tabValue === 1 && (
            <DetailCard>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Cover Letter
                </Typography>
                {application.coverLetter ? (
                  <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {application.coverLetter}
                  </Typography>
                ) : (
                  <Alert severity="info">
                    No cover letter provided by the candidate.
                  </Alert>
                )}
              </CardContent>
            </DetailCard>
          )}

          {/* Resume Tab */}
          {tabValue === 2 && (
            <DetailCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight="600">
                    Resume Preview
                  </Typography>
                  <ActionButton
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleDownloadResume}
                    disabled={!application.applicant.profile?.resume?.url}
                  >
                    Download Resume
                  </ActionButton>
                </Box>
                
                {application.applicant.profile?.resume?.url ? (
                  <Box
                    sx={{
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: 2,
                      p: 3,
                      background: '#f8fafc',
                      minHeight: 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <Description sx={{ fontSize: 60, color: '#cbd5e1' }} />
                    <Typography color="text.secondary">
                      Resume: {application.applicant.profile.resume.name || 'resume.pdf'}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => window.open(application.applicant.profile!.resume!.url, '_blank')}
                    >
                      View in New Tab
                    </Button>
                  </Box>
                ) : (
                  <Alert severity="warning">
                    No resume uploaded by the candidate.
                  </Alert>
                )}
              </CardContent>
            </DetailCard>
          )}

          {/* Notes Tab */}
          {tabValue === 3 && (
            <DetailCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight="600">
                    Application Notes
                  </Typography>
                  <ActionButton
                    variant="contained"
                    startIcon={<NoteAdd />}
                    onClick={() => setNotesDialog(true)}
                  >
                    Add Note
                  </ActionButton>
                </Box>
                
                {application.notes && application.notes.length > 0 ? (
                  <Stack spacing={2}>
                    {application.notes.map((note, index) => (
                      <Paper
                        key={note._id || index}
                        sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography fontWeight="600">
                            {note.addedBy?.name || 'Employer'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(note.addedAt)}
                          </Typography>
                        </Box>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                          {note.note}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">
                    No notes added yet. Add a note to track important information.
                  </Alert>
                )}
              </CardContent>
            </DetailCard>
          )}

          {/* Timeline Tab */}
          {tabValue === 4 && (
            <DetailCard>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Application Timeline
                </Typography>
                <Stack spacing={3}>
                  <Box display="flex" gap={2}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#10b981',
                        mt: 0.5,
                      }}
                    />
                    <Box>
                      <Typography fontWeight="600">Application Submitted</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(application.appliedAt)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" gap={2}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#3b82f6',
                        mt: 0.5,
                      }}
                    />
                    <Box>
                      <Typography fontWeight="600">Application Reviewed</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getTimeSince(application.appliedAt)} • Status: {application.status}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {application.notes && application.notes.length > 0 && (
                    <Box display="flex" gap={2}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: '#8b5cf6',
                          mt: 0.5,
                        }}
                      />
                      <Box>
                        <Typography fontWeight="600">Notes Added</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {application.notes.length} note(s) added
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </DetailCard>
          )}

          {/* Overview Tab (Default) */}
          {tabValue === 0 && (
            <>
              {/* Cover Letter Preview */}
              <DetailCard sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Cover Letter
                  </Typography>
                  {application.coverLetter ? (
                    <Typography
                      sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.8,
                        maxHeight: 200,
                        overflow: 'hidden',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 60,
                          background: 'linear-gradient(transparent, white)',
                        },
                      }}
                    >
                      {application.coverLetter.substring(0, 500)}
                      {application.coverLetter.length > 500 && '...'}
                    </Typography>
                  ) : (
                    <Alert severity="info">
                      No cover letter provided.
                    </Alert>
                  )}
                  {application.coverLetter && application.coverLetter.length > 500 && (
                    <Button
                      onClick={() => setTabValue(1)}
                      sx={{ mt: 2 }}
                    >
                      Read Full Cover Letter
                    </Button>
                  )}
                </CardContent>
              </DetailCard>

              {/* Skills */}
              {application.applicant.profile?.skills && application.applicant.profile.skills.length > 0 && (
                <DetailCard sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight="600">
                      Skills & Expertise
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {application.applicant.profile.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          sx={{ borderRadius: 1, fontWeight: 500 }}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </DetailCard>
              )}

              {/* Rating */}
              <DetailCard sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Candidate Rating
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconButton
                        key={star}
                        onClick={() => handleRatingChange(star)}
                        color={star <= (rating || 0) ? 'warning' : 'default'}
                      >
                        <Star />
                      </IconButton>
                    ))}
                    <Typography variant="body2" color="text.secondary">
                      {(rating || 0)}/5 stars
                    </Typography>
                  </Box>
                </CardContent>
              </DetailCard>
            </>
          )}
        </Grid>

        {/* Right Column */}
        <Grid size={{xs:12, lg:4}} >
          {/* Contact Information */}
          <DetailCard sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Contact Information
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Email color="primary" />
                  <Typography>{application.applicant.email}</Typography>
                </Box>
                
                {application.applicant.profile?.phone && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Phone color="primary" />
                    <Typography>{application.applicant.profile.phone}</Typography>
                  </Box>
                )}
                
                {application.applicant.profile?.location && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <LocationOn color="primary" />
                    <Typography>{application.applicant.profile.location}</Typography>
                  </Box>
                )}
                
                {application.applicant.profile?.website && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Language color="primary" />
                    <Typography sx={{ wordBreak: 'break-all' }}>
                      {application.applicant.profile.website}
                    </Typography>
                  </Box>
                )}
                
                {application.applicant.profile?.linkedin && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinkedIn color="primary" />
                    <Typography sx={{ wordBreak: 'break-all' }}>
                      {application.applicant.profile.linkedin}
                    </Typography>
                  </Box>
                )}
                
                {application.applicant.profile?.github && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <GitHub color="primary" />
                    <Typography sx={{ wordBreak: 'break-all' }}>
                      {application.applicant.profile.github}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </DetailCard>

          {/* Job Details */}
          <DetailCard sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Job Details
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Work color="primary" />
                  <Typography fontWeight="500">{application.job.title}</Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <LocationOn color="primary" />
                  <Typography>{application.job.location}</Typography>
                </Box>
                
                {application.job.department && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Business color="primary" />
                    <Typography>{application.job.department}</Typography>
                  </Box>
                )}
                
                {application.job.salary && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <TrendingUp color="primary" />
                    <Typography>
                      {application.job.salary.currency} {application.job.salary.min.toLocaleString()} - {application.job.salary.max.toLocaleString()}
                    </Typography>
                  </Box>
                )}
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.push(`/employer/jobs/${application.job._id}`)}
                  sx={{ mt: 1 }}
                >
                  View Job Details
                </Button>
              </Stack>
            </CardContent>
          </DetailCard>

          {/* Quick Actions */}
          <DetailCard>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Quick Actions
              </Typography>
              <Stack spacing={1.5}>
                <ActionButton
                  variant="contained"
                  fullWidth
                  startIcon={<Email />}
                  onClick={() => {
                    setEmailSubject(`Regarding your application for ${application.job.title}`);
                    setEmailBody(`Dear ${application.applicant.name},\n\n`);
                    setEmailDialog(true);
                  }}
                >
                  Send Email
                </ActionButton>
                
                <ActionButton
                  variant="outlined"
                  fullWidth
                  startIcon={<Download />}
                  onClick={handleDownloadResume}
                  disabled={!application.applicant.profile?.resume?.url}
                >
                  Download Resume
                </ActionButton>
                
                <ActionButton
                  variant="outlined"
                  fullWidth
                  startIcon={<NoteAdd />}
                  onClick={() => setNotesDialog(true)}
                >
                  Add Note
                </ActionButton>
                
                <ActionButton
                  variant="outlined"
                  fullWidth
                  startIcon={<Share />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    Swal.fire({
                      icon: 'success',
                      title: 'Link Copied!',
                      text: 'Application link copied to clipboard.',
                      timer: 1500,
                      showConfirmButton: false,
                    });
                  }}
                >
                  Share Application
                </ActionButton>
              </Stack>
            </CardContent>
          </DetailCard>
        </Grid>
      </Grid>

      {/* Status Change Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2, minWidth: 200 },
        }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
          Change Status
        </Typography>
        {['shortlisted', 'interviewed', 'hired', 'rejected'].map((status) => (
          <MenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={updating || application.status === status}
          >
            <Box display="flex" alignItems="center" gap={2} width="100%">
              {status === 'shortlisted' && <CheckCircle sx={{ color: '#3b82f6' }} />}
              {status === 'interviewed' && <Schedule sx={{ color: '#f59e0b' }} />}
              {status === 'hired' && <CheckCircle sx={{ color: '#10b981' }} />}
              {status === 'rejected' && <Cancel sx={{ color: '#ef4444' }} />}
              <Typography textTransform="capitalize">{status}</Typography>
              {updating && <CircularProgress size={16} sx={{ ml: 'auto' }} />}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Add Note Dialog */}
      <Dialog
        open={notesDialog}
        onClose={() => setNotesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            Add Note for {application.applicant.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={6}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a private note about this candidate..."
            sx={{ mt: 2 }}
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setNotesDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleAddNote}
            variant="contained"
            disabled={!newNote.trim()}
          >
            Save Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog
        open={emailDialog}
        onClose={() => setEmailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            Send Email to {application.applicant.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            sx={{ mb: 3, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={10}
            label="Message"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEmailDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            startIcon={<Send />}
            disabled={!emailSubject.trim() || !emailBody.trim()}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={6} pt={3} sx={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        <Typography variant="body2" color="text.secondary">
          Application ID: {application._id}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() => router.push('/employer/applications')}
          >
            Back to List
          </Button>
          <Button
            variant="contained"
            onClick={() => router.push(`/employer/jobs/${application.job._id}/applicants`)}
          >
            View All Applicants for this Job
          </Button>
        </Box>
      </Box>
    </Box>
  );
}