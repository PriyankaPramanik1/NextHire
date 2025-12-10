"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  Paper,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  LinearProgress,
  Alert,
  Avatar,
  Stack,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Delete,
  Share,
  Visibility,
  People,
  AccessTime,
  LocationOn,
  AttachMoney,
  Work,
  TrendingUp,
  Description,
  MoreVert,
  CheckCircle,
  PauseCircle,
  Close,
  Refresh,
  Download,
  CalendarToday,
} from "@mui/icons-material";
import { styled } from "@mui/system";
import Swal from "sweetalert2";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StyledCard = styled(Card)({
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  border: "1px solid rgba(0, 0, 0, 0.05)",
});

const JobHeader = styled(Box)({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  padding: "2rem",
  borderRadius: 16,
  marginBottom: "2rem",
});

interface JobData {
  _id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  category: string;
  experience: string;
  status: "active" | "draft" | "closed" | "paused";
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  remoteAllowed: boolean;
  applicationDeadline: string | null;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  qualifications: string[];
  createdAt: string;
  updatedAt: string;
  stats?: {
    views: number;
    applications: number;
    shortlisted: number;
    hired: number;
  };
  applicationData?: Array<{
    date: string;
    count: number;
  }>;
}

export default function JobDetailPage() {
 const params = useParams();
  const router = useRouter();
  

  const jobId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : null;

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`/employer/jobs/${jobId}`);
      setJob(response.data.job);

      // Generate share link
      const baseUrl = window.location.origin;
      setShareLink(`${baseUrl}/jobs/${jobId}`);
    } catch (error) {
      console.error("Error fetching job details:", error);
      Swal.fire("Error!", "Failed to load job details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await axios.patch(`/employer/jobs/${jobId}/status`, {
        status: newStatus,
      });

      Swal.fire({
        icon: "success",
        title: "Status Updated!",
        text: `Job status changed to ${newStatus}.`,
        showConfirmButton: false,
        timer: 1500,
      });

      if (job) {
        setJob({ ...job, status: newStatus as any });
      }
    } catch (error) {
      Swal.fire("Error!", "Failed to update job status.", "error");
    }
  };

  const handleDeleteJob = async () => {
    try {
      await axios.delete(`/employer/jobs/${jobId}`);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Job has been deleted successfully.",
        showConfirmButton: false,
        timer: 1500,
      });

      router.push("/employer/jobs");
    } catch (error) {
      Swal.fire("Error!", "Failed to delete job.", "error");
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    Swal.fire({
      icon: "success",
      title: "Copied!",
      text: "Share link copied to clipboard.",
      showConfirmButton: false,
      timer: 1000,
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "draft":
        return "warning";
      case "closed":
        return "error";
      case "paused":
        return "info";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <LinearProgress sx={{ width: "50%", height: 8, borderRadius: 4 }} />
      </Box>
    );
  }

  if (!job) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          Job not found
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push("/employer/jobs")}
          sx={{ mt: 2 }}
        >
          Back to Jobs
        </Button>
      </Box>
    );
  }

  const tabs = [
    { label: "Overview", value: 0 },
    { label: "Applications", value: 1 },
    { label: "Analytics", value: 2 },
    { label: "Settings", value: 3 },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      {/* Header Actions */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => router.push("/employer/jobs")}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="700">
              {job.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              <Chip
                label={job.status.toUpperCase()}
                size="small"
                color={getStatusColor(job.status)}
              />
              <Typography variant="body2" color="text.secondary">
                Posted: {new Date(job.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Share />}
            onClick={() => setShareDialog(true)}
          >
            Share
          </Button>
          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={() => router.push(`/employer/jobs/${jobId}/applicants`)}
          >
            View Applicants ({job.stats?.applications || 0})
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => router.push(`/employer/jobs/edit/${jobId}`)}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            Edit Job
          </Button>
          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
        >
          {tabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Job Header Card */}
      <JobHeader>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h3" fontWeight="700" gutterBottom>
              {job.title}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {job.description.substring(0, 150)}...
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                background: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <LocationOn />
                  <Typography>{job.location}</Typography>
                  {job.remoteAllowed && (
                    <Chip label="Remote" size="small" color="primary" />
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Work />
                  <Typography textTransform="capitalize">
                    {job.type.replace("-", " ")}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <AttachMoney />
                  <Typography fontWeight="600">
                    {formatCurrency(job.salary.min, job.salary.currency)} -{" "}
                    {formatCurrency(job.salary.max, job.salary.currency)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrendingUp />
                  <Typography textTransform="capitalize">
                    {job.experience} Level
                  </Typography>
                </Box>
                {job.applicationDeadline && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CalendarToday />
                    <Typography>
                      Deadline:{" "}
                      {new Date(job.applicationDeadline).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </JobHeader>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Job Description */}
            <StyledCard sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  <Description sx={{ mr: 1 }} />
                  Job Description
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {job.description}
                </Typography>
              </CardContent>
            </StyledCard>

            {/* Requirements */}
            <StyledCard sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Requirements
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {job.requirements.map((req, index) => (
                    <li key={index}>
                      <Typography color="text.secondary">{req}</Typography>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </StyledCard>

            {/* Responsibilities */}
            <StyledCard sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Responsibilities
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {job.responsibilities.map((resp, index) => (
                    <li key={index}>
                      <Typography color="text.secondary">{resp}</Typography>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Quick Stats */}
            <StyledCard sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Quick Stats
                </Typography>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Total Views</Typography>
                    <Typography fontWeight="600">
                      {job.stats?.views || 0}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Applications</Typography>
                    <Typography fontWeight="600">
                      {job.stats?.applications || 0}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Shortlisted</Typography>
                    <Typography fontWeight="600">
                      {job.stats?.shortlisted || 0}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Hired</Typography>
                    <Typography fontWeight="600">
                      {job.stats?.hired || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </StyledCard>

            {/* Skills */}
            <StyledCard sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Required Skills
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {job.skills.map((skill, index) => (
                    <Chip key={index} label={skill} size="small" />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>

            {/* Benefits */}
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Benefits & Perks
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {job.benefits.map((benefit, index) => (
                    <Chip
                      key={index}
                      label={benefit}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Job Performance Analytics
            </Typography>
            {job.applicationData && job.applicationData.length > 0 ? (
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={job.applicationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#667eea"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Alert severity="info">
                No analytics data available yet. Check back later for insights.
              </Alert>
            )}
          </CardContent>
        </StyledCard>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Proceed with caution. These actions cannot be undone.
            </Alert>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Job Status
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Change the current status of this job posting.
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {["active", "paused", "closed"].map((status) => (
                    <Button
                      key={status}
                      variant={job.status === status ? "contained" : "outlined"}
                      onClick={() => handleStatusChange(status)}
                      disabled={job.status === status}
                      startIcon={
                        status === "active" ? (
                          <CheckCircle />
                        ) : status === "paused" ? (
                          <PauseCircle />
                        ) : (
                          <Close />
                        )
                      }
                      sx={{ textTransform: "capitalize" }}
                    >
                      {status}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  fontWeight="600"
                  color="error"
                >
                  Danger Zone
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Once you delete a job, there is no going back. Please be
                  certain.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteDialog(true)}
                >
                  Delete This Job
                </Button>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      )}

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200, borderRadius: 2 },
        }}
      >
        <MenuItem
          onClick={() => router.push(`/employer/jobs/${jobId}/applicants`)}
        >
          <People sx={{ mr: 2 }} />
          View All Applicants
        </MenuItem>
        <MenuItem onClick={() => setShareDialog(true)}>
          <Share sx={{ mr: 2 }} />
          Share Job
        </MenuItem>
        <MenuItem onClick={fetchJobDetails}>
          <Refresh sx={{ mr: 2 }} />
          Refresh Data
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() =>
            handleStatusChange(job.status === "active" ? "paused" : "active")
          }
        >
          {job.status === "active" ? (
            <>
              <PauseCircle sx={{ mr: 2 }} />
              Pause Job
            </>
          ) : (
            <>
              <CheckCircle sx={{ mr: 2 }} />
              Activate Job
            </>
          )}
        </MenuItem>
        <MenuItem
          onClick={() => setDeleteDialog(true)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 2 }} />
          Delete Job
        </MenuItem>
      </Menu>

      {/* Share Dialog */}
      <Dialog
        open={shareDialog}
        onClose={() => setShareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Job</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Share this job posting with others:
          </Typography>
          <TextField
            fullWidth
            value={shareLink}
            InputProps={{
              readOnly: true,
            }}
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            Anyone with this link can view the job posting.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCopyShareLink}
            startIcon={<Share />}
          >
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{job.title}"? This action cannot be
            undone.
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            This will also delete all associated applications and data.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteJob} color="error" variant="contained">
            Delete Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
