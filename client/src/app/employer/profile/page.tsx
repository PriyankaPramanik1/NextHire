'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from '@/lib/axios';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Avatar,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  LinearProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Upload,
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  LinkedIn,
  Twitter,
  Facebook,
  Add,
  Delete,
  Description,
  People,
} from '@mui/icons-material';
import { styled } from '@mui/system';

const ProfileSection = styled(Card)({
  marginBottom: '2rem',
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
});

const CompanyLogo = styled(Avatar)({
  width: 140,
  height: 140,
  border: '4px solid #667eea',
  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
});

const StyledButton = styled(Button)({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: 10,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
  },
  transition: 'all 0.3s ease',
});

export default function EmployerProfile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [company, setCompany] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    foundedYear: new Date().getFullYear(),
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    contact: {
      phone: '',
      email: '',
      linkedin: '',
      twitter: '',
      facebook: '',
    },
    benefits: [] as string[],
    newBenefit: '',
  });

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.companyName || '',
        industry: company.industry || '',
        companySize: company.companySize || '',
        website: company.website || '',
        foundedYear: company.foundedYear || new Date().getFullYear(),
        description: company.description || '',
        address: {
          street: company.address?.street || '',
          city: company.address?.city || '',
          state: company.address?.state || '',
          country: company.address?.country || '',
          zipCode: company.address?.zipCode || '',
        },
        contact: {
          phone: company.contact?.phone || '',
          email: company.contact?.email || user?.email || '',
          linkedin: company.contact?.linkedin || '',
          twitter: company.contact?.twitter || '',
          facebook: company.contact?.facebook || '',
        },
        benefits: company.benefits || [],
        newBenefit: '',
      });
    }
  }, [company, user]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await axios.get('/employer/profile');
      setCompany(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const response = await axios.put('/employer/profile', formData);
      
      setCompany(response.data);
      setEditing(false);
      setSuccess('Company profile updated successfully!');

      // Update user context if needed
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
    if (company) {
      setFormData({
        companyName: company.companyName || '',
        industry: company.industry || '',
        companySize: company.companySize || '',
        website: company.website || '',
        foundedYear: company.foundedYear || new Date().getFullYear(),
        description: company.description || '',
        address: {
          street: company.address?.street || '',
          city: company.address?.city || '',
          state: company.address?.state || '',
          country: company.address?.country || '',
          zipCode: company.address?.zipCode || '',
        },
        contact: {
          phone: company.contact?.phone || '',
          email: company.contact?.email || user?.email || '',
          linkedin: company.contact?.linkedin || '',
          twitter: company.contact?.twitter || '',
          facebook: company.contact?.facebook || '',
        },
        benefits: company.benefits || [],
        newBenefit: '',
      });
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    try {
      const formData = new FormData();
      formData.append(type, file);

      const response = await axios.post(`/employer/profile/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setCompany(response.data);
      setSuccess(`${type === 'logo' ? 'Company logo' : 'Banner image'} uploaded successfully!`);
    } catch (error: any) {
      setError(error.response?.data?.message || `Failed to upload ${type}`);
    }
  };

  const addBenefit = () => {
    if (formData.newBenefit.trim() && !formData.benefits.includes(formData.newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, prev.newBenefit.trim()],
        newBenefit: '',
      }));
    }
  };

  const removeBenefit = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit),
    }));
  };

  const calculateProfileStrength = () => {
    if (!company) return 0;

    let strength = 0;
    if (company.companyName) strength += 20;
    if (company.description) strength += 15;
    if (company.logo?.url) strength += 15;
    if (company.benefits?.length > 0) strength += 10;
    if (company.address?.city && company.address?.country) strength += 10;
    if (company.website) strength += 10;
    if (company.contact?.phone) strength += 10;
    if (company.industry) strength += 10;

    return strength;
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="700">
          Company Profile
        </Typography>
        {!editing ? (
          <StyledButton startIcon={<Edit />} onClick={() => setEditing(true)}>
            Edit Profile
          </StyledButton>
        ) : (
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleCancel}
              sx={{ borderRadius: '10px', px: 3, fontWeight: 600 }}
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
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      {/* Profile Strength */}
      <ProfileSection>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="600">
            Profile Completeness
          </Typography>
          <Box display="flex" alignItems="center" mb={1}>
            <LinearProgress
              variant="determinate"
              value={calculateProfileStrength()}
              sx={{ flexGrow: 1, mr: 2, height: 12, borderRadius: 6 }}
            />
            <Typography variant="h6" fontWeight="700" color="#667eea">
              {calculateProfileStrength()}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Complete your company profile to attract more candidates
          </Typography>
        </CardContent>
      </ProfileSection>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid size={{xs:12, md:8}}>
          {/* Company Details */}
          <ProfileSection>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                <Business sx={{ mr: 1 }} />
                Company Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Business sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    disabled={!editing}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Company Size"
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                    disabled={!editing}
                    placeholder="e.g., 50-100 employees"
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Founded Year"
                    type="number"
                    value={formData.foundedYear}
                    onChange={(e) => setFormData({ ...formData, foundedYear: parseInt(e.target.value) || 2023 })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Company Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={!editing}
                    placeholder="Tell candidates about your company culture, mission, and values..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </ProfileSection>

          {/* Contact Information */}
          <ProfileSection>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.contact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, phone: e.target.value }
                    })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Phone sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.contact.email}
                    disabled
                    InputProps={{
                      startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Language sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="LinkedIn"
                    value={formData.contact.linkedin}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact: { ...formData.contact, linkedin: e.target.value }
                    })}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <LinkedIn sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </ProfileSection>

          {/* Address */}
          <ProfileSection>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                <LocationOn sx={{ mr: 1 }} />
                Company Address
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={formData.address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value }
                    })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={formData.address.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value }
                    })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.address.country}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, country: e.target.value }
                    })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    fullWidth
                    label="ZIP/Postal Code"
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, zipCode: e.target.value }
                    })}
                    disabled={!editing}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </ProfileSection>

          {/* Employee Benefits */}
          <ProfileSection>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Employee Benefits
              </Typography>
              <Box mb={2} minHeight="60px">
                {formData.benefits.map((benefit, index) => (
                  <Chip
                    key={index}
                    label={benefit}
                    onDelete={editing ? () => removeBenefit(benefit) : undefined}
                    sx={{ m: 0.5 }}
                  />
                ))}
                {formData.benefits.length === 0 && (
                  <Typography color="text.secondary" fontStyle="italic">
                    No benefits added yet. Add benefits to attract top talent!
                  </Typography>
                )}
              </Box>
              {editing && (
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    fullWidth
                    label="Add a benefit"
                    value={formData.newBenefit}
                    onChange={(e) => setFormData({ ...formData, newBenefit: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                    size="small"
                  />
                  <Button 
                    variant="contained" 
                    onClick={addBenefit}
                    sx={{ minWidth: 'auto' }}
                  >
                    <Add />
                  </Button>
                </Box>
              )}
            </CardContent>
          </ProfileSection>
        </Grid>

        {/* Sidebar */}
        <Grid size={{xs:12, md:4}}>
          {/* Company Logo */}
          <ProfileSection>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Company Logo
              </Typography>
              <Box display="flex" flexDirection="column" alignItems="center">
                <CompanyLogo
                  src={company?.logo?.url}
                  sx={{ mb: 2 }}
                >
                  {company?.companyName?.charAt(0)}
                </CompanyLogo>
                {editing && (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Upload />}
                    sx={{ borderRadius: '10px' }}
                  >
                    Upload Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], 'logo');
                        }
                      }}
                    />
                  </Button>
                )}
              </Box>
            </CardContent>
          </ProfileSection>

          {/* Company Stats */}
          <ProfileSection>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Company Stats
              </Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" py={1.5}>
                  <Typography variant="body2">Active Jobs</Typography>
                  <Typography variant="body2" fontWeight="600">
                    {company?.stats?.activeJobs || 0}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" py={1.5}>
                  <Typography variant="body2">Total Applications</Typography>
                  <Typography variant="body2" fontWeight="600">
                    {company?.stats?.totalApplications || 0}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" py={1.5}>
                  <Typography variant="body2">Profile Views</Typography>
                  <Typography variant="body2" fontWeight="600">
                    {company?.stats?.profileViews || 0}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" py={1.5}>
                  <Typography variant="body2">Hired Candidates</Typography>
                  <Typography variant="body2" fontWeight="600">
                    {company?.stats?.hiredCandidates || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </ProfileSection>

          {/* Verification Status */}
          <ProfileSection>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Verification Status
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: company?.verified ? '#10b981' : '#ef4444',
                    mr: 2,
                  }}
                />
                <Typography>
                  {company?.verified ? 'Verified Company' : 'Not Verified'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {company?.verified
                  ? 'Your company is verified and trusted by job seekers.'
                  : 'Complete your profile and contact support for verification.'}
              </Typography>
            </CardContent>
          </ProfileSection>
        </Grid>
      </Grid>
    </Container>
  );
}