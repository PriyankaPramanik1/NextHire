// =============================================================================
// ENHANCED PROFILE PAGE WITH ALL FEATURES
// File: app/jobseeker/profile/page.tsx
// Features: Profile picture upload, Resume upload, Skills, Education, Saved Jobs
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
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  LinearProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Add,
  Delete,
  Upload,
  Person,
  School,
  Work,
  LocationOn,
  Phone,
  Email,
  Bookmark,
  Visibility,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import axios from '@/lib/axios';
import { User, Education } from '@/types';

const ProfileSection = styled(Card)({
  marginBottom: '2rem',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
});

const SkillChip = styled(Chip)({
  margin: '0.25rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  '& .MuiChip-deleteIcon': {
    color: 'white',
  },
});

const EducationItem = styled(Box)({
  padding: '1.5rem',
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  marginBottom: '1rem',
  position: 'relative',
  background: 'white',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  },
});

const StyledButton = styled(Button)({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  color: 'white',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
  },
  transition: 'all 0.3s ease',
});

const ProfileAvatar = styled(Avatar)({
  width: 140,
  height: 140,
  border: '4px solid #667eea',
  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
});

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [savedJobsDialog, setSavedJobsDialog] = useState(false);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [newEducation, setNewEducation] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    field: '',
    year: new Date().getFullYear(),
  });
  const [formData, setFormData] = useState({
    name: '',
    profile: {
      title: '',
      experience: '',
      location: '',
      phone: '',
      bio: '',
      skills: [] as string[],
      education: [] as Education[],
    }
  });

  useEffect(() => {
    fetchProfile();
    fetchSavedJobs();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        profile: {
          title: profile.profile?.title || '',
          experience: profile.profile?.experience || '',
          location: profile.profile?.location || '',
          phone: profile.profile?.phone || '',
          bio: profile.profile?.bio || '',
          skills: profile.profile?.skills || [],
          education: profile.profile?.education || [],
        }
      });
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/users/profile');
      setProfile(response.data.profile || response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await axios.get('/jobs/saved-jobs');
      setSavedJobs(response.data.savedJobs || response.data || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const submitData = {
        name: formData.name,
        profile: {
          ...formData.profile,
          skills: formData.profile.skills || [],
          education: formData.profile.education || [],
        }
      };

      const response = await axios.put('/users/profile', submitData);
      
      setProfile(response.data.user || response.data.profile);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      
      if (response.data.user) {
        updateUser(response.data.user);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || '',
        profile: {
          title: profile.profile?.title || '',
          experience: profile.profile?.experience || '',
          location: profile.profile?.location || '',
          phone: profile.profile?.phone || '',
          bio: profile.profile?.bio || '',
          skills: profile.profile?.skills || [],
          education: profile.profile?.education || [],
        }
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.profile.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          skills: [...prev.profile.skills, newSkill.trim()]
        }
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        skills: prev.profile.skills.filter(skill => skill !== skillToRemove)
      }
    }));
  };

  const addEducation = () => {
    if (newEducation.institution && newEducation.degree && newEducation.field) {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          education: [...prev.profile.education, newEducation as Education]
        }
      }));
      setNewEducation({
        institution: '',
        degree: '',
        field: '',
        year: new Date().getFullYear(),
      });
    }
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        education: prev.profile.education.filter((_, i) => i !== index)
      }
    }));
  };

  const handleFileUpload = async (file: File, type: 'resume' | 'profilePicture') => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append(type, file);

      const endpoint = type === 'resume' 
        ? '/users/profile/resume' 
        : '/users/profile/picture';

      const response = await axios.post(endpoint, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`${type === 'resume' ? 'Resume' : 'Profile picture'} uploaded successfully!`);
      await fetchProfile(); // Refresh profile
    } catch (error: any) {
      setError(error.response?.data?.message || `Failed to upload ${type}`);
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      await axios.delete(`/jobs/saved-jobs/${jobId}`);
      setSuccess('Job removed from saved list');
      await fetchSavedJobs(); // Refresh saved jobs
    } catch (error) {
      setError('Failed to remove job');
    }
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/jobseeker/jobs/${jobId}`);
    setSavedJobsDialog(false);
  };

  const calculateProfileStrength = () => {
    if (!profile?.profile) return 0;

    let strength = 0;
    const prof = profile.profile;

    if (prof.title) strength += 20;
    if (prof.skills && prof.skills.length > 0) strength += 20;
    if (prof.experience) strength += 15;
    if (prof.education && prof.education.length > 0) strength += 15;
    if (prof.bio) strength += 10;
    if (prof.location) strength += 10;
    if (prof.resume?.url) strength += 10;

    return Math.min(100, strength);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Failed to load profile</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="700" sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          My Profile
        </Typography>
        {!editing ? (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Bookmark />}
              onClick={() => setSavedJobsDialog(true)}
              sx={{ borderColor: '#667eea', color: '#667eea' }}
            >
              Saved Jobs ({savedJobs.length})
            </Button>
            <StyledButton
              startIcon={<Edit />}
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </StyledButton>
          </Box>
        ) : (
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleCancel}
              sx={{ borderColor: '#667eea', color: '#667eea' }}
            >
              Cancel
            </Button>
            <StyledButton
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </StyledButton>
          </Box>
        )}
      </Box>

      {/* Notifications */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={4000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>

      {/* Profile Strength */}
      <ProfileSection>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="600">
            <Work sx={{ mr: 1, color: '#667eea', verticalAlign: 'middle' }} />
            Profile Completeness
          </Typography>
          <Box display="flex" alignItems="center" mb={1}>
            <LinearProgress
              variant="determinate"
              value={calculateProfileStrength()}
              sx={{ 
                flexGrow: 1, 
                mr: 2, 
                height: 12, 
                borderRadius: 6,
                background: 'rgba(102, 126, 234, 0.2)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 6,
                }
              }}
            />
            <Typography variant="h6" fontWeight="700" color="#667eea">
              {calculateProfileStrength()}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Complete your profile to increase your chances of getting hired
          </Typography>
        </CardContent>
      </ProfileSection>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid size={{xs:12, md:8}}>
          {/* Basic Information */}
          <ProfileSection>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                <Person sx={{ mr: 1, color: '#667eea', verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Person sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profile.email}
                    disabled
                    InputProps={{
                      startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Professional Title"
                    value={formData.profile.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    disabled={!editing}
                    placeholder="e.g., Frontend Developer"
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <FormControl fullWidth disabled={!editing}>
                    <InputLabel>Experience Level</InputLabel>
                    <Select
                      value={formData.profile.experience}
                      label="Experience Level"
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                    >
                      <MenuItem value="entry">Entry Level</MenuItem>
                      <MenuItem value="mid">Mid Level</MenuItem>
                      <MenuItem value="senior">Senior Level</MenuItem>
                      <MenuItem value="executive">Executive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Phone sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Professional Bio"
                    value={formData.profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!editing}
                    placeholder="Tell employers about your experience, skills, and career goals..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </ProfileSection>

          {/* Skills */}
          <ProfileSection>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                <Work sx={{ mr: 1, color: '#667eea', verticalAlign: 'middle' }} />
                Skills & Expertise
              </Typography>
              <Box mb={2} minHeight="60px">
                {formData.profile.skills?.map((skill) => (
                  <SkillChip
                    key={skill}
                    label={skill}
                    onDelete={editing ? () => removeSkill(skill) : undefined}
                  />
                ))}
                {formData.profile.skills?.length === 0 && (
                  <Typography color="text.secondary" fontStyle="italic">
                    No skills added yet. Add your first skill to get started!
                  </Typography>
                )}
              </Box>
              {editing && (
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    fullWidth
                    label="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    size="small"
                  />
                  <Button 
                    variant="contained" 
                    onClick={addSkill}
                    sx={{ 
                      minWidth: 'auto',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    <Add />
                  </Button>
                </Box>
              )}
            </CardContent>
          </ProfileSection>

          {/* Education */}
          <ProfileSection>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                <School sx={{ mr: 1, color: '#667eea', verticalAlign: 'middle' }} />
                Education Background
              </Typography>
              
              {formData.profile.education?.map((edu, index) => (
                <EducationItem key={index}>
                  {editing && (
                    <IconButton
                      size="small"
                      onClick={() => removeEducation(index)}
                      sx={{ position: 'absolute', top: 8, right: 8, color: '#ff6b6b' }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                  <Typography variant="subtitle1" fontWeight="bold" color="#667eea">
                    {edu.institution}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {edu.degree} in {edu.field}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Graduated: {edu.year}
                  </Typography>
                </EducationItem>
              ))}

              {editing && (
                <Box sx={{ p: 3, border: '2px dashed #e0e0e0', borderRadius: 2, background: '#fafafa' }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="600">
                    Add Education
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{xs:12}}>
                      <TextField
                        fullWidth
                        label="Institution Name"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                        placeholder="e.g., University of Technology"
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Degree"
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                        placeholder="e.g., Bachelor of Science"
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Field of Study"
                        value={newEducation.field}
                        onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                        placeholder="e.g., Computer Science"
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:6}}>
                      <TextField
                        fullWidth
                        label="Graduation Year"
                        type="number"
                        value={newEducation.year}
                        onChange={(e) => setNewEducation({ ...newEducation, year: parseInt(e.target.value) || new Date().getFullYear() })}
                        inputProps={{ min: 1900, max: new Date().getFullYear() + 5 }}
                      />
                    </Grid>
                    <Grid size={{xs:12}}>
                      <Button 
                        variant="outlined" 
                        onClick={addEducation}
                        startIcon={<Add />}
                        disabled={!newEducation.institution || !newEducation.degree || !newEducation.field}
                        sx={{ 
                          borderRadius: '10px',
                          borderColor: '#667eea',
                          color: '#667eea',
                        }}
                      >
                        Add Education
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </ProfileSection>
        </Grid>

        {/* Sidebar */}
        <Grid size={{xs:12, md:4}}>
          {/* Profile Picture */}
          <ProfileSection>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Profile Picture
              </Typography>
              <Box display="flex" flexDirection="column" alignItems="center">
                <ProfileAvatar
                  src={profile.profile?.profilePicture?.url}
                  sx={{ mb: 2 }}
                >
                  {profile.name?.charAt(0).toUpperCase()}
                </ProfileAvatar>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Upload />}
                  sx={{ 
                    borderRadius: '10px',
                    borderColor: '#667eea',
                    color: '#667eea',
                  }}
                >
                  Upload Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], 'profilePicture');
                      }
                    }}
                  />
                </Button>
              </Box>
            </CardContent>
          </ProfileSection>

          {/* Resume */}
          <ProfileSection>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Resume/CV
              </Typography>
              {profile.profile?.resume?.url ? (
                <Box>
                  <Typography variant="body2" gutterBottom color="success.main">
                    ✅ Resume uploaded successfully
                  </Typography>
                  <Button
                    variant="outlined"
                    href={profile.profile.resume.url}
                    target="_blank"
                    fullWidth
                    sx={{ 
                      mb: 1,
                      borderRadius: '10px',
                      borderColor: '#667eea',
                      color: '#667eea',
                    }}
                  >
                    View Resume
                  </Button>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Upload />}
                    fullWidth
                    sx={{ 
                      borderRadius: '10px',
                      borderColor: '#667eea',
                      color: '#667eea',
                    }}
                  >
                    Update Resume
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], 'resume');
                        }
                      }}
                    />
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No resume uploaded yet
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<Upload />}
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '10px',
                    }}
                  >
                    Upload Resume
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], 'resume');
                        }
                      }}
                    />
                  </Button>
                </Box>
              )}
            </CardContent>
          </ProfileSection>
        </Grid>
      </Grid>

      {/* Saved Jobs Dialog */}
      <Dialog
        open={savedJobsDialog}
        onClose={() => setSavedJobsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Bookmark sx={{ mr: 1, color: '#667eea' }} />
            Saved Jobs ({savedJobs.length})
          </Box>
        </DialogTitle>
        <DialogContent>
          {savedJobs.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Bookmark sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Saved Jobs Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start saving jobs you're interested in to easily find them later
              </Typography>
            </Box>
          ) : (
            <List>
              {savedJobs.map((job, index) => (
                <Box key={job._id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold">
                          {job.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {job.employer?.company?.name || 'Company'}
                          </Typography>
                          {' • '}
                          <Typography variant="body2" component="span">
                            {job.location}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleViewJob(job._id)}
                        sx={{ mr: 1 }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleUnsaveJob(job._id)}
                        sx={{ color: '#ff6b6b' }}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < savedJobs.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSavedJobsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}