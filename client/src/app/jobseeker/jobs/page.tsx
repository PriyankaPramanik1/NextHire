'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Container,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Pagination,
  Slider,
  Alert,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  AttachMoney,
  Bookmark,
  BookmarkBorder,
  Work,
  Visibility,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import axios from '@/lib/axios';
import { Job } from '@/types';

const FilterSection = styled(Card)({
  padding: '1.5rem',
  position: 'sticky',
  top: '1rem',
  maxHeight: 'calc(100vh - 2rem)',
  overflowY: 'auto',
});

const JobCard = styled(Card)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
});

const SalaryRangeSlider = styled(Slider)({
  color: '#667eea',
  marginTop: '2rem',
});

export default function JobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [salaryRange, setSalaryRange] = useState<number[]>([0, 200000]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
  }, [page]);

  useEffect(() => {
    // Reset to page 1 when filters change
    if (page === 1) {
      fetchJobs();
    } else {
      setPage(1);
    }
  }, [search, location, type, category, experience, salaryRange]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search }),
        ...(location && { location }),
        ...(type && { type }),
        ...(category && { category }),
        ...(experience && { experience }),
        ...(salaryRange[0] > 0 && { minSalary: salaryRange[0].toString() }),
        ...(salaryRange[1] < 200000 && { maxSalary: salaryRange[1].toString() }),
      });

      const response = await axios.get(`/jobs/getJobs?${params}`);
      setJobs(response.data.jobs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalJobs(response.data.totalJobs || 0);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await axios.get('/users/profile');
      setSavedJobIds(response.data.profile?.savedJobs || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  const handleSaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (savedJobIds.includes(jobId)) {
        await axios.delete(`/jobs/saved-jobs/${jobId}`);
        setSavedJobIds(prev => prev.filter(id => id !== jobId));
        setSuccess('Job removed from saved list');
      } else {
        await axios.post(`/jobs/saved-jobs/${jobId}`);
        setSavedJobIds(prev => [...prev, jobId]);
        setSuccess('Job saved successfully!');
      }
    } catch (error) {
      setError('Failed to save/unsave job');
    }
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/jobseeker/jobs/${jobId}`);
  };

  const handleSalaryChange = (event: Event, newValue: number | number[]) => {
    setSalaryRange(newValue as number[]);
  };

  const clearFilters = () => {
    setSearch('');
    setLocation('');
    setType('');
    setCategory('');
    setExperience('');
    setSalaryRange([0, 200000]);
    setPage(1);
  };

  const jobTypes = [
    'full-time',
    'part-time',
    'contract',
    'internship',
    'remote'
  ];

  const experienceLevels = [
    'entry',
    'mid',
    'senior',
    'executive'
  ];

  const categories = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Marketing',
    'Sales',
    'Design',
    'Engineering',
    'Business',
    'Other'
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="700">
        Find Your Dream Job
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Discover {totalJobs} opportunities that match your skills
      </Typography>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={4000} 
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid size={{xs:12, md:3}}>
          <FilterSection>
            <Box display="flex" alignItems="center" mb={3}>
              <FilterList sx={{ mr: 1, color: '#667eea' }} />
              <Typography variant="h6" fontWeight="600">
                Filters
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              size="small"
            />

            <TextField
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <LocationOn sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              size="small"
            />

            <FormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Job Type</InputLabel>
              <Select
                value={type}
                label="Job Type"
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {jobTypes.map((jobType) => (
                  <MenuItem key={jobType} value={jobType}>
                    {jobType.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Experience</InputLabel>
              <Select
                value={experience}
                label="Experience"
                onChange={(e) => setExperience(e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                {experienceLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom fontWeight="500">
                Salary Range
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
              </Typography>
              <SalaryRangeSlider
                value={salaryRange}
                onChange={handleSalaryChange}
                valueLabelDisplay="auto"
                min={0}
                max={200000}
                step={10000}
                valueLabelFormat={(value) => `$${value.toLocaleString()}`}
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              sx={{ 
                mb: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
              onClick={() => fetchJobs()}
            >
              Apply Filters
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              onClick={clearFilters}
              sx={{ borderColor: '#667eea', color: '#667eea' }}
            >
              Clear Filters
            </Button>
          </FilterSection>
        </Grid>

        {/* Jobs Grid */}
        <Grid size={{xs:12, md:9}}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <Typography>Loading jobs...</Typography>
            </Box>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No jobs found matching your criteria
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your filters or search terms
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="body1" color="text.secondary">
                  Showing {jobs.length} of {totalJobs} jobs
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {jobs.map((job) => (
                  <Grid size={{xs:12, sm:6, lg:4}} key={job._id}>
                    <JobCard>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Typography variant="h6" component="h2" sx={{ flexGrow: 1, pr: 1 }}>
                            {job.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleSaveJob(job._id, e)}
                            sx={{ color: '#667eea' }}
                          >
                            {savedJobIds.includes(job._id) ? <Bookmark /> : <BookmarkBorder />}
                          </IconButton>
                        </Box>
                        
                        <Box display="flex" alignItems="center" mb={1}>
                          <Work sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.employer?.company?.name || 'Company'}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" mb={1}>
                          <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.location}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" mb={2}>
                          <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            ${job.salary?.min?.toLocaleString()} - ${job.salary?.max?.toLocaleString()}
                          </Typography>
                        </Box>

                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                          <Chip label={job.type} size="small" variant="outlined" />
                          {job.experience && (
                            <Chip label={job.experience} size="small" variant="outlined" />
                          )}
                        </Box>

                        <Box mb={2}>
                          {job.skills?.slice(0, 3).map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              sx={{ 
                                mr: 0.5, 
                                mb: 0.5,
                                bgcolor: 'rgba(102, 126, 234, 0.1)',
                                color: '#667eea',
                              }}
                            />
                          ))}
                          {job.skills && job.skills.length > 3 && (
                            <Chip
                              label={`+${job.skills.length - 3}`}
                              size="small"
                              sx={{ mb: 0.5 }}
                            />
                          )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
                          {job.description?.length > 120 
                            ? `${job.description.substring(0, 120)}...` 
                            : job.description
                          }
                        </Typography>

                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleViewJob(job._id)}
                          startIcon={<Visibility />}
                          sx={{ 
                            mt: 'auto',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          }}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </JobCard>
                  </Grid>
                ))}
              </Grid>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(event, value) => setPage(value)}
                    color="primary"
                    size="large"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontWeight: 600,
                      },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}