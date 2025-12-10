'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Grid,
  Divider,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  People,
  AccessTime,
  TrendingUp,
  Search,
  FilterList,
  Refresh,
  CheckCircle,
  Cancel,
  PauseCircle,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import Swal from 'sweetalert2';

const StyledCard = styled(Card)({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
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

const statusColors: any = {
  active: 'success',
  draft: 'warning',
  closed: 'error',
  paused: 'info',
};

export default function EmployerJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    closed: 0,
    applications: 0,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter]);

  const fetchJobs = async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        axios.get('/jobs/employer/my-jobs'),
        axios.get('/applications/stats'),
      ]);
      setJobs(jobsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Tab filter
    if (tabValue === 1) {
      filtered = filtered.filter(job => job.status === 'active');
    } else if (tabValue === 2) {
      filtered = filtered.filter(job => job.status === 'draft');
    } else if (tabValue === 3) {
      filtered = filtered.filter(job => job.status === 'closed');
    }

    setFilteredJobs(filtered);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, job: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const handleViewApplicants = () => {
    if (selectedJob) {
      router.push(`/employer/jobs/${selectedJob._id}/applicants`);
      handleMenuClose();
    }
  };

  const handleEditJob = () => {
    if (selectedJob) {
      router.push(`/employer/jobs/edit/${selectedJob._id}`);
      handleMenuClose();
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You won't be able to revert this! Job "${selectedJob.title}" will be deleted permanently.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/jobs/deleteJob/${selectedJob._id}`);
        setJobs(jobs.filter(job => job._id !== selectedJob._id));
        Swal.fire('Deleted!', 'Job has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error!', 'Failed to delete job.', 'error');
      }
    }

    setDeleteDialog(false);
    handleMenuClose();
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await axios.patch(`/employer/jobs/${jobId}/status`, { status: newStatus });
      setJobs(jobs.map(job => 
        job._id === jobId ? { ...job, status: newStatus } : job
      ));
      Swal.fire('Success!', `Job status updated to ${newStatus}.`, 'success');
    } catch (error) {
      Swal.fire('Error!', 'Failed to update job status.', 'error');
    }
  };

  const tabs = [
    { label: 'All Jobs', count: stats.total },
    { label: 'Active', count: stats.active },
    { label: 'Drafts', count: stats.draft },
    { label: 'Closed', count: stats.closed },
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="700" gutterBottom>
            Job Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your job postings and track applications
          </Typography>
        </Box>
        <StyledButton
          startIcon={<Add />}
          onClick={() => router.push('/employer/jobs/create')}
        >
          Post New Job
        </StyledButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <StyledCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="700" color="#667eea">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Jobs
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <StyledCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="700" color="#059669">
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Jobs
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <StyledCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="700" color="#ea580c">
                {stats.draft}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drafts
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <StyledCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="700" color="#dc2626">
                {stats.closed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Closed Jobs
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid size={{xs:12, sm:6, md:2.4}}>
          <StyledCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="700" color="#7c3aed">
                {stats.applications}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Applications
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              fullWidth
              placeholder="Search jobs by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setStatusFilter(statusFilter === 'all' ? 'active' : 'all')}
            >
              {statusFilter === 'all' ? 'All Status' : 'Active Only'}
            </Button>
            <IconButton onClick={fetchJobs}>
              <Refresh />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {tab.label}
                  <Chip 
                    label={tab.count} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Jobs Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell>Job Title</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Applications</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Posted Date</TableCell>
              <TableCell>Salary</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow key={job._id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {job.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.department}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    {job.location}
                  </Box>
                </TableCell>
                <TableCell>
                  <Badge badgeContent={job.applicationCount} color="primary">
                    <People />
                  </Badge>
                </TableCell>
                <TableCell>
                  <Chip
                    label={job.status}
                    size="small"
                    color={statusColors[job.status] || 'default'}
                    icon={job.status === 'active' ? <CheckCircle /> : job.status === 'paused' ? <PauseCircle /> : undefined}
                  />
                </TableCell>
                <TableCell>
                  {new Date(job.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Typography fontWeight="600">
                    ${job.salary?.min?.toLocaleString()} - ${job.salary?.max?.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/employer/jobs/${job._id}/applicants`)}
                      title="View Applicants"
                    >
                      <People fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/employer/jobs/edit/${job._id}`)}
                      title="Edit Job"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, job)}
                      title="More Options"
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredJobs.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No jobs found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by posting your first job!'}
          </Typography>
          {!searchTerm && statusFilter === 'all' && (
            <StyledButton
              startIcon={<Add />}
              onClick={() => router.push('/employer/jobs/create')}
            >
              Post Your First Job
            </StyledButton>
          )}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200, borderRadius: 2 },
        }}
      >
        <MenuItem onClick={handleViewApplicants}>
          <People sx={{ mr: 2 }} fontSize="small" />
          View Applicants
        </MenuItem>
        <MenuItem onClick={handleEditJob}>
          <Edit sx={{ mr: 2 }} fontSize="small" />
          Edit Job
        </MenuItem>
        {selectedJob?.status === 'active' && (
          <MenuItem onClick={() => handleStatusChange(selectedJob._id, 'paused')}>
            <PauseCircle sx={{ mr: 2 }} fontSize="small" />
            Pause Job
          </MenuItem>
        )}
        {selectedJob?.status === 'paused' && (
          <MenuItem onClick={() => handleStatusChange(selectedJob._id, 'active')}>
            <CheckCircle sx={{ mr: 2 }} fontSize="small" />
            Activate Job
          </MenuItem>
        )}
        {selectedJob?.status === 'active' && (
          <MenuItem onClick={() => handleStatusChange(selectedJob._id, 'closed')}>
            <Cancel sx={{ mr: 2 }} fontSize="small" />
            Close Job
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => setDeleteDialog(true)} sx={{ color: '#dc2626' }}>
          <Delete sx={{ mr: 2 }} fontSize="small" />
          Delete Job
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedJob?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteJob} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}