"use client";

import React, { useState, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Tabs,
  Tab,
  Badge,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Paper,
  Stack,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  MoreVert,
  Visibility,
  Work,
  Refresh,
  CheckCircle,
  Cancel,
  Schedule,
  Email,
  Download,
  FilterList,
  TrendingUp,
  People,
  AccessTime,
  LocationOn,
  School,
  Business,
  Star,
  StarBorder,
  ArrowBack,
  NoteAdd,
} from "@mui/icons-material";
import { styled } from "@mui/system";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

// Styled Components
const ApplicationCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  border: "1px solid rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
    borderColor: theme.palette.primary.light,
  },
}));

const StatusBadge = styled(Chip)<{ status: string }>(({ theme, status }) => ({
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  backgroundColor: getStatusColor(status, theme).background,
  color: getStatusColor(status, theme).color,
  "& .MuiChip-label": {
    paddingLeft: 8,
    paddingRight: 8,
  },
}));

const StatsCard = styled(Card)({
  borderRadius: 12,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  padding: "1.5rem",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "scale(1.03)",
  },
});

const FloatingActionButton = styled(Button)({
  position: "fixed",
  bottom: 30,
  right: 30,
  borderRadius: 50,
  minWidth: "auto",
  width: 56,
  height: 56,
  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
  zIndex: 1000,
});

// Types
type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interviewed"
  | "hired"
  | "rejected";

interface ApplicantProfile {
  title?: string;
  resume?: { url: string; name: string };
  skills?: string[];
  profilePicture?: { url: string };
  experience?: string;
  location?: string;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    year: number;
  }>;
}

interface Applicant {
  _id: string;
  name?: string;
  email?: string;
  profile?: ApplicantProfile;
}

interface Job {
  _id: string;
  title?: string;
  location?: string;
  department?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
}

interface Application {
  _id: string;
  job?: Job;
  applicant?: Applicant;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  coverLetter?: string;
  resume?: string;
  favorite?: boolean;
  notes?: Array<{
    note: string;
    addedAt: string;
    addedBy: string;
  }>;
}

interface Stats {
  total: number;
  applied: number;
  shortlisted: number;
  interviewed: number;
  hired: number;
  rejected: number;
}

interface FilterState {
  status: string;
  job: string;
  sortBy: "newest" | "oldest" | "name";
  search: string;
}

// Helper Functions
const getStatusColor = (status: string, theme: any) => {
  const colors: Record<string, { background: string; color: string }> = {
    applied: { background: "#e0f2fe", color: "#0369a1" },
    shortlisted: { background: "#dbeafe", color: "#1d4ed8" },
    interviewed: { background: "#fef3c7", color: "#d97706" },
    hired: { background: "#dcfce7", color: "#15803d" },
    rejected: { background: "#fee2e2", color: "#dc2626" },
  };
  return colors[status] || { background: "#f3f4f6", color: "#6b7280" };
};

const statusIcons: Record<ApplicationStatus, React.ReactElement> = {
  applied: <AccessTime fontSize="small" />,
  shortlisted: <CheckCircle fontSize="small" />,
  interviewed: <Schedule fontSize="small" />,
  hired: <CheckCircle fontSize="small" color="success" />,
  rejected: <Cancel fontSize="small" />,
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function EmployerApplications(): JSX.Element {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    applied: 0,
    shortlisted: 0,
    interviewed: 0,
    hired: 0,
    rejected: 0,
  });

  // UI States
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    job: "all",
    sortBy: "newest",
    search: "",
  });
  const [tabValue, setTabValue] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notesDialog, setNotesDialog] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [viewDialog, setViewDialog] = useState<boolean>(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch Data
  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, []);

  // Filter Applications
  useEffect(() => {
    filterApplications();
  }, [applications, filters, tabValue]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/applications/employer", {
        params: {
          page: 1,
          limit: 50,
          status: filters.status !== "all" ? filters.status : undefined,
          jobId: filters.job !== "all" ? filters.job : undefined,
          search: filters.search || undefined,
        },
      });

      if (response.data.success) {
        setApplications(response.data.applications || []);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load applications. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get("/applications/employer/jobs");
      if (response.data.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          (app.applicant?.name || "").toLowerCase().includes(query) ||
          (app.applicant?.email || "").toLowerCase().includes(query) ||
          (app.job?.title || "").toLowerCase().includes(query) ||
          (app.applicant?.profile?.skills || []).some((skill) =>
            skill.toLowerCase().includes(query)
          )
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((app) => app.status === filters.status);
    }

    // Job filter
    if (filters.job !== "all") {
      filtered = filtered.filter((app) => app.job?._id === filters.job);
    }

    // Tab filter
    const tabFilters: Record<number, ApplicationStatus | null> = {
      1: "applied",
      2: "shortlisted",
      3: "hired",
      4: "rejected",
    };

    if (tabValue in tabFilters && tabFilters[tabValue]) {
      filtered = filtered.filter((app) => app.status === tabFilters[tabValue]);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return (
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
          );
        case "name":
          return (a.applicant?.name || "").localeCompare(
            b.applicant?.name || ""
          );
        default:
          return 0;
      }
    });

    setFilteredApps(filtered);
  };

  const handleStatusChange = async (
    applicationId: string,
    newStatus: string
  ) => {
    setUpdating(applicationId);
    try {
      const response = await axios.put(
        `/api/applications/employer/applications/${applicationId}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === applicationId
              ? { ...app, status: newStatus, ...response.data.data }
              : app
          )
        );

        Swal.fire({
          icon: "success",
          title: "Status Updated!",
          text: `Application status changed to ${newStatus}`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update status. Please try again.",
      });
    } finally {
      setUpdating(null);
      handleMenuClose();
    }
  };

  const handleAddNotes = async () => {
  if (!selectedApp) return;
  
  try {
    const response = await axios.post(
      `/api/applications/employer/applications/${selectedApp._id}/notes`,
      { note: notes }
    );
    
    if (response.data.success) {
      setApplications(prev =>
        prev.map(app =>
          app._id === selectedApp._id
            ? {
                ...app,
                notes: [...(app.notes || []), response.data.note],
              }
            : app
        )
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Note Added!',
        text: 'Note has been saved successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      
      setNotes('');
      setNotesDialog(false);
    }
  } catch (error) {
    console.error('Error adding note:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to add note. Please try again.',
    });
  }
};


  const handleDownloadResume = (resumeUrl: string) => {
    window.open(resumeUrl, "_blank");
  };

  const handleSendEmail = (email: string) => {
    const subject = encodeURIComponent("Regarding Your Job Application");
    const body = encodeURIComponent(
      "Dear Applicant,\n\nThank you for your application."
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  };

  const toggleFavorite = async (
    applicationId: string,
    currentFavorite: boolean
  ) => {
    try {
      await axios.patch(
        `/applications/employer/applications/${applicationId}/favorite`,
        {
          favorite: !currentFavorite,
        }
      );

      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId
            ? { ...app, favorite: !currentFavorite }
            : app
        )
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    app: Application
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedApp(app);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedApp(null);
  };

  const handleViewApplicant = (applicationId: string) => {
    router.push(`/employer/applications/${applicationId}`);
  };

  const handleViewJob = (jobId?: string) => {
    if (jobId) {
      router.push(`/employer/jobs/${jobId}`);
    }
  };

  const tabs = [
    { label: "All Applications", count: stats.total, color: "#667eea" },
    { label: "New", count: stats.applied, color: "#3b82f6" },
    { label: "Shortlisted", count: stats.shortlisted, color: "#8b5cf6" },
    { label: "Hired", count: stats.hired, color: "#10b981" },
    { label: "Rejected", count: stats.rejected, color: "#ef4444" },
  ];

  const sortOptions = [
    { label: "Newest First", value: "newest", icon: <TrendingUp /> },
    { label: "Oldest First", value: "oldest", icon: <AccessTime /> },
    { label: "By Name", value: "name", icon: <People /> },
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
          Loading applications...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={4}
      >
        <Box>
          <Typography
            variant="h3"
            fontWeight="800"
            gutterBottom
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Applications Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and review all job applications in one place
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchApplications}
          sx={{ borderRadius: 3 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
        {Object.entries(stats).map(
          ([key, value]) =>
            key !== "total" && (
              <Grid size={{ xs: 6, sm: 4, lg: 2.4 }} key={key}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: parseFloat(`0.${key.length}`) }}
                >
                  <StatsCard>
                    <Typography variant="h2" fontWeight="800" mb={1}>
                      {value}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, textTransform: "capitalize" }}
                    >
                      {key.replace("_", " ")}
                    </Typography>
                  </StatsCard>
                </motion.div>
              </Grid>
            )
        )}
      </Grid>

      {/* Filters Section */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          p: 3,
          mb: 4,
          background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search by name, email, job, or skills..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3, background: "white" },
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Job</InputLabel>
              <Select
                value={filters.job}
                label="Filter by Job"
                onChange={(e) =>
                  setFilters({ ...filters, job: e.target.value })
                }
                sx={{ borderRadius: 3, background: "white" }}
              >
                <MenuItem value="all">All Jobs</MenuItem>
                {jobs.map((job) => (
                  <MenuItem key={job._id} value={job._id}>
                    {job.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filters.status}
                label="Filter by Status"
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                sx={{ borderRadius: 3, background: "white" }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="applied">New</MenuItem>
                <MenuItem value="shortlisted">Shortlisted</MenuItem>
                <MenuItem value="interviewed">Interviewed</MenuItem>
                <MenuItem value="hired">Hired</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
              startIcon={<FilterList />}
              sx={{ borderRadius: 3, py: 1 }}
            >
              Sort
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 4, mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              py: 2,
              px: 3,
              minHeight: 60,
            },
            "& .Mui-selected": {
              color: "primary.main",
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {tab.label}
                  <Badge
                    badgeContent={tab.count}
                    color="default"
                    sx={{
                      "& .MuiBadge-badge": {
                        background: tab.color,
                        color: "white",
                        fontWeight: "bold",
                      },
                    }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Applications Grid */}
      {filteredApps.length > 0 ? (
        <Grid container spacing={3}>
          {filteredApps.map((application, index) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={application._id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <ApplicationCard>
                  <CardContent>
                    {/* Header with Avatar and Actions */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          src={
                            application.applicant?.profile?.profilePicture?.url
                          }
                          sx={{
                            width: 64,
                            height: 64,
                            border: "3px solid #667eea",
                          }}
                        >
                          {application.applicant?.name?.charAt(0) || "?"}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="h6"
                            fontWeight="700"
                            color="text.primary"
                          >
                            {application.applicant?.name || "Unknown Applicant"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {application.applicant?.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            toggleFavorite(
                              application._id,
                              application.favorite || false
                            )
                          }
                          color={application.favorite ? "warning" : "default"}
                        >
                          {application.favorite ? (
                            <Star fontSize="small" />
                          ) : (
                            <StarBorder fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, application)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Job Info */}
                    <Box
                      mb={2}
                      p={2}
                      sx={{
                        background: "rgba(102, 126, 234, 0.05)",
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="600"
                        gutterBottom
                      >
                        {application.job?.title}
                      </Typography>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                        flexWrap="wrap"
                      >
                        <Chip
                          icon={<LocationOn fontSize="small" />}
                          label={application.job?.location}
                          size="small"
                          variant="outlined"
                        />
                        {application.job?.salary && (
                          <Chip
                            icon={<TrendingUp fontSize="small" />}
                            label={`${application.job.salary.currency} ${application.job.salary.min} - ${application.job.salary.max}`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Status and Date */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        {statusIcons[application.status]}
                        <StatusBadge
                          label={application.status}
                          status={application.status}
                          size="small"
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                      >
                        <AccessTime fontSize="small" />
                        {formatDate(application.appliedAt)}
                      </Typography>
                    </Box>

                    {/* Skills */}
                    {application.applicant?.profile?.skills && (
                      <Box mb={2}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mb={0.5}
                        >
                          Skills:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {application.applicant.profile.skills
                            .slice(0, 5)
                            .map((skill, idx) => (
                              <Chip
                                key={idx}
                                label={skill}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 1 }}
                              />
                            ))}
                        </Box>
                      </Box>
                    )}

                    {/* Actions */}
                    <Box display="flex" gap={1} mt={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Visibility />}
                        onClick={() => handleViewApplicant(application._id)}
                        sx={{ borderRadius: 2 }}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Work />}
                        onClick={() => handleViewJob(application.job?._id)}
                        disabled={!application.job?._id}
                        sx={{ borderRadius: 2 }}
                      >
                        Job
                      </Button>
                    </Box>
                  </CardContent>
                </ApplicationCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          textAlign="center"
          py={10}
          sx={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            borderRadius: 4,
          }}
        >
          <Search sx={{ fontSize: 80, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No applications found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {filters.search || filters.status !== "all" || filters.job !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No applications received yet. Applications will appear here."}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setFilters({
                status: "all",
                job: "all",
                sortBy: "newest",
                search: "",
              });
              setTabValue(0);
            }}
            sx={{ borderRadius: 3 }}
          >
            Clear Filters
          </Button>
        </Box>
      )}

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2, minWidth: 200 },
        }}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              setFilters({ ...filters, sortBy: option.value as any });
              setSortMenuAnchor(null);
            }}
            selected={filters.sortBy === option.value}
          >
            <Box display="flex" alignItems="center" gap={2} width="100%">
              {option.icon}
              <Typography>{option.label}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2, minWidth: 220 },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedApp?.applicant?.email) {
              handleSendEmail(selectedApp.applicant.email);
            }
            handleMenuClose();
          }}
        >
          <Email sx={{ mr: 2 }} fontSize="small" />
          Send Email
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedApp?.applicant?.profile?.resume?.url) {
              handleDownloadResume(selectedApp.applicant.profile.resume.url);
            }
            handleMenuClose();
          }}
        >
          <Download sx={{ mr: 2 }} fontSize="small" />
          Download Resume
        </MenuItem>
        <MenuItem
          onClick={() => {
            setNotesDialog(true);
            handleMenuClose();
          }}
        >
          <NoteAdd sx={{ mr: 2 }} fontSize="small" />
          Add Notes
        </MenuItem>
        <Divider />
        <Typography
          variant="caption"
          sx={{ px: 2, py: 1, color: "text.secondary" }}
        >
          Change Status
        </Typography>
        {["shortlisted", "interviewed", "hired", "rejected"].map((status) => (
          <MenuItem
            key={status}
            onClick={() => {
              if (selectedApp && selectedApp.status !== status) {
                handleStatusChange(
                  selectedApp._id,
                  status as ApplicationStatus
                );
              }
            }}
            disabled={
              updating === selectedApp?._id || selectedApp?.status === status
            }
          >
            <Box display="flex" alignItems="center" gap={2} width="100%">
              {status === "shortlisted" && (
                <CheckCircle sx={{ color: "#3b82f6" }} />
              )}
              {status === "interviewed" && (
                <Schedule sx={{ color: "#f59e0b" }} />
              )}
              {status === "hired" && <CheckCircle sx={{ color: "#10b981" }} />}
              {status === "rejected" && <Cancel sx={{ color: "#ef4444" }} />}
              <Typography textTransform="capitalize">{status}</Typography>
              {updating === selectedApp?._id && (
                <CircularProgress size={16} sx={{ ml: "auto" }} />
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Notes Dialog */}
      <Dialog
        open={notesDialog}
        onClose={() => setNotesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            Add Notes for {selectedApp?.applicant?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add private notes about this candidate..."
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
            onClick={handleAddNotes}
            variant="contained"
            disabled={!notes.trim()}
          >
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <FloatingActionButton
        color="primary"
        variant="contained"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <TrendingUp />
      </FloatingActionButton>

      {/* Pagination/Stats Footer */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={6}
        pt={3}
        sx={{ borderTop: "1px solid rgba(0, 0, 0, 0.08)" }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {filteredApps.length} of {applications.length} applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last updated:{" "}
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Box>
    </Box>
  );
}
