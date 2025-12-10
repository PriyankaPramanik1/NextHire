"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Tooltip,
  Tab,
  Tabs,
  TextareaAutosize,
  Rating,
} from "@mui/material";
import {
  Search,
  FilterList,
  MoreVert,
  CheckCircle,
  Cancel,
  Schedule,
  Visibility,
  Email,
  Download,
  Star,
  StarBorder,
  Refresh,
  AccessTime,
  LocationOn,
  Work,
  Business,
  School,
  Phone,
  Link,
  NoteAdd,
  Close,
  Person,
  CalendarToday,
  AttachFile,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import axios from "@/lib/axios";
import Swal from "sweetalert2";

// Types
type ApplicationStatus = "applied" | "shortlisted" | "interviewed" | "hired" | "rejected";

interface ApplicantProfile {
  title?: string;
  skills?: string[];
  experience?: string;
  location?: string;
  phone?: string;
  bio?: string;
  resume?: { url: string; name: string };
  profilePicture?: { url: string };
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    year: number;
  }>;
  linkedin?: string;
  github?: string;
  website?: string;
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
  type?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description?: string;
  requirements?: string[];
}

interface Application {
  _id: string;
  job?: Job;
  applicant?: Applicant;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  coverLetter?: string;
  favorite?: boolean;
  rating?: number;
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

// Styled Components
const StatusChip = styled(Chip)<{ status: ApplicationStatus }>(({ theme, status }) => ({
  fontWeight: 600,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  backgroundColor:
    status === "applied" ? "#e3f2fd" :
    status === "shortlisted" ? "#e8f5e9" :
    status === "interviewed" ? "#fff3e0" :
    status === "hired" ? "#c8e6c9" :
    "#ffebee",
  color:
    status === "applied" ? "#1976d2" :
    status === "shortlisted" ? "#2e7d32" :
    status === "interviewed" ? "#ef6c00" :
    status === "hired" ? "#1b5e20" :
    "#c62828",
}));

const ApplicationCard = styled(Card)(({ theme }) => ({
  height: "100%",
  transition: "all 0.3s ease",
  border: "1px solid #e0e0e0",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 20px rgba(0,0,0,0.1)",
    borderColor: theme.palette.primary.main,
  },
}));

const DetailDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 12,
    maxWidth: "800px",
    width: "100%",
  },
}));

// Helper Functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusIcon = (status: ApplicationStatus) => {
  switch (status) {
    case "applied": return <AccessTime fontSize="small" />;
    case "shortlisted": return <CheckCircle fontSize="small" />;
    case "interviewed": return <Schedule fontSize="small" />;
    case "hired": return <CheckCircle fontSize="small" color="success" />;
    case "rejected": return <Cancel fontSize="small" color="error" />;
    default: return <AccessTime fontSize="small" />;
  }
};

const statusOptions = [
  { value: "shortlisted", label: "Shortlist", icon: <CheckCircle />, color: "#4caf50", description: "Shortlist candidate for further review" },
  { value: "interviewed", label: "Schedule Interview", icon: <Schedule />, color: "#ff9800", description: "Schedule interview with candidate" },
  { value: "hired", label: "Hire", icon: <CheckCircle />, color: "#2e7d32", description: "Hire the candidate" },
  { value: "rejected", label: "Reject", icon: <Cancel />, color: "#f44336", description: "Reject the application" },
];

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    applied: 0,
    shortlisted: 0,
    interviewed: 0,
    hired: 0,
    rejected: 0,
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");
  const [newNote, setNewNote] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchApplications();
    fetchStats();
    fetchJobs();
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    filterApplications();
  }, [applications, search, statusFilter, jobFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/applications/employer", {
        params: {
          page: 1,
          limit: 100,
          status: statusFilter !== "all" ? statusFilter : undefined,
          jobId: jobFilter !== "all" ? jobFilter : undefined,
          search: search || undefined,
        },
      });

      if (response.data.success) {
        setApplications(response.data.applications || []);
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

  const fetchStats = async () => {
    try {
      const response = await axios.get("/applications/employer/stats");
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      const response = await axios.get(`/applications/employer/applications/${applicationId}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error("Error fetching application details:", error);
    }
    return null;
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Search filter
    if (search) {
      const query = search.toLowerCase();
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
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Job filter
    if (jobFilter !== "all") {
      filtered = filtered.filter((app) => app.job?._id === jobFilter);
    }

    setFilteredApplications(filtered);
  };

  const handleViewDetails = async (application: Application) => {
    setSelectedApplication(application);
    setDetailDialogOpen(true);
    setTabValue(0);
    setNewNote("");
    
    // Fetch full application details
    const details = await fetchApplicationDetails(application._id);
    if (details) {
      setSelectedApplication(details);
      setRating(details.rating || 0);
      setNotes(details.notes || []);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus, note?: string) => {
    try {
      const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      
      const result = await Swal.fire({
        title: `Change status to "${statusText}"?`,
        text: note || "This will update the application status and notify the applicant.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, update status",
        cancelButtonText: "Cancel",
        input: newStatus === "rejected" || newStatus === "shortlisted" ? "textarea" : undefined,
        inputLabel: newStatus === "rejected" ? "Rejection reason (optional)" : 
                   newStatus === "shortlisted" ? "Notes for shortlisting (optional)" : "",
        inputPlaceholder: newStatus === "rejected" ? "Enter reason for rejection..." : 
                        newStatus === "shortlisted" ? "Add notes about why you're shortlisting..." : "",
        showLoaderOnConfirm: true,
        preConfirm: (inputValue) => {
          return { note: inputValue };
        },
      });

      if (!result.isConfirmed) return;

      const response = await axios.put(
        `/applications/employer/applications/${applicationId}/status`,
        { 
          status: newStatus,
          note: result.value?.note 
        }
      );

      if (response.data.success) {
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app._id === applicationId
              ? { ...app, status: newStatus, ...response.data.data }
              : app
          )
        );

        // Update selected application if open
        if (selectedApplication?._id === applicationId) {
          setSelectedApplication((prev) => prev ? { ...prev, status: newStatus } : null);
        }

        // Update stats
        fetchStats();

        Swal.fire({
          icon: "success",
          title: "Status Updated!",
          text: `Application has been ${newStatus}.`,
          timer: 2000,
          showConfirmButton: false,
        });

        // Close dialog if rejecting
        if (newStatus === "rejected") {
          setDetailDialogOpen(false);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update status. Please try again.",
      });
    }
  };

  const handleAddNote = async () => {
    if (!selectedApplication || !newNote.trim()) return;

    try {
      const response = await axios.post(
        `/applications/employer/applications/${selectedApplication._id}/notes`,
        { note: newNote.trim() }
      );

      if (response.data.success) {
        setSelectedApplication((prev) => 
          prev ? { 
            ...prev, 
            notes: [...(prev.notes || []), response.data.note] 
          } : null
        );
        setNewNote("");
        
        Swal.fire({
          icon: "success",
          title: "Note Added!",
          text: "Your note has been saved.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error adding note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add note. Please try again.",
      });
    }
  };

  const handleUpdateRating = async (newRating: number | null) => {
    if (!selectedApplication || newRating === null) return;

    try {
      const response = await axios.patch(
        `/applications/employer/applications/${selectedApplication._id}/rating`,
        { rating: newRating }
      );

      if (response.data.success) {
        setSelectedApplication((prev) => 
          prev ? { ...prev, rating: newRating } : null
        );
        setRating(newRating);
      }
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  };

  const handleToggleFavorite = async (applicationId: string, currentFavorite: boolean) => {
    try {
      await axios.patch(`/applications/employer/applications/${applicationId}/favorite`, {
        favorite: !currentFavorite,
      });
      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId
            ? { ...app, favorite: !currentFavorite }
            : app
        )
      );
      
      // Update selected application if open
      if (selectedApplication?._id === applicationId) {
        setSelectedApplication((prev) => 
          prev ? { ...prev, favorite: !currentFavorite } : null
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDownloadResume = (resumeUrl: string) => {
    if (resumeUrl) {
      window.open(resumeUrl, "_blank");
    } else {
      Swal.fire({
        icon: "warning",
        title: "Resume Not Available",
        text: "This applicant hasn't uploaded a resume.",
      });
    }
  };

  const handleSendEmail = (email: string) => {
    const subject = encodeURIComponent("Regarding Your Job Application");
    const body = encodeURIComponent(
      "Dear Applicant,\n\nThank you for your application.\n\nBest regards,\nRecruitment Team"
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  // Loading state
  if (loading && applications.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Applications Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review, shortlist, and manage job applications
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchApplications}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} mb={4}>
        {Object.entries(stats).map(([key, value]) => (
          <Grid size={{xs:6, sm:4, md:2.4}} key={key}>
            <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                {key}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs:12, md:4}}>
            <TextField
              fullWidth
              placeholder="Search by name, email, job, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
              size="small"
            />
          </Grid>
          <Grid size={{xs:12, md:3}}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Job</InputLabel>
              <Select
                value={jobFilter}
                label="Filter by Job"
                onChange={(e) => setJobFilter(e.target.value)}
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
          <Grid size={{xs:12, md:3}}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="applied">Applied</MenuItem>
                <MenuItem value="shortlisted">Shortlisted</MenuItem>
                <MenuItem value="interviewed">Interviewed</MenuItem>
                <MenuItem value="hired">Hired</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, md:2}}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FilterList />}
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setJobFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Applications Grid */}
      {filteredApplications.length > 0 ? (
        <Grid container spacing={3}>
          {filteredApplications.map((application) => (
            <Grid size={{xs:12, sm:6, md:4}} key={application._id}>
              <ApplicationCard>
                <CardContent>
                  {/* Applicant Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={application.applicant?.profile?.profilePicture?.url}
                        sx={{ width: 56, height: 56, border: "2px solid #e0e0e0" }}
                      >
                        {application.applicant?.name?.charAt(0) || "A"}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" noWrap>
                          {application.applicant?.name || "Unknown Applicant"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {application.applicant?.email}
                        </Typography>
                        {application.applicant?.profile?.title && (
                          <Typography variant="caption" color="primary">
                            {application.applicant.profile.title}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Tooltip title={application.favorite ? "Remove from favorites" : "Add to favorites"}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleFavorite(application._id, application.favorite || false)}
                        >
                          {application.favorite ? (
                            <Star color="warning" />
                          ) : (
                            <StarBorder />
                          )}
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(application)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Job Info */}
                  <Box mb={2} p={1.5} bgcolor="#f8f9fa" borderRadius={1}>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      {application.job?.title}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                      <Chip
                        icon={<LocationOn fontSize="small" />}
                        label={application.job?.location}
                        size="small"
                        variant="outlined"
                      />
                      {application.job?.salary && (
                        <Chip
                          icon={<Work fontSize="small" />}
                          label={`${application.job.salary.currency} ${application.job.salary.min}k - ${application.job.salary.max}k`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Status and Date */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(application.status)}
                      <StatusChip
                        label={application.status}
                        status={application.status}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <CalendarToday fontSize="small" />
                      {formatDate(application.appliedAt)}
                    </Typography>
                  </Box>

                  {/* Skills Preview */}
                  {application.applicant?.profile?.skills && (
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Skills:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {application.applicant.profile.skills.slice(0, 4).map((skill, idx) => (
                          <Chip key={idx} label={skill} size="small" variant="outlined" />
                        ))}
                        {application.applicant.profile.skills.length > 4 && (
                          <Chip label={`+${application.applicant.profile.skills.length - 4}`} size="small" />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(application)}
                      fullWidth
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Email />}
                      onClick={() => handleSendEmail(application.applicant?.email || "")}
                    >
                      Email
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownloadResume(application.applicant?.profile?.resume?.url || "")}
                    >
                      Resume
                    </Button>
                  </Box>

                  {/* Quick Status Actions */}
                  <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckCircle />}
                      sx={{ bgcolor: "#4caf50", "&:hover": { bgcolor: "#388e3c" } }}
                      onClick={() => handleStatusChange(application._id, "shortlisted")}
                      fullWidth
                    >
                      Shortlist
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Cancel />}
                      sx={{ bgcolor: "#f44336", "&:hover": { bgcolor: "#d32f2f" } }}
                      onClick={() => handleStatusChange(application._id, "rejected")}
                      fullWidth
                    >
                      Reject
                    </Button>
                  </Box>
                </CardContent>
              </ApplicationCard>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 8, textAlign: "center", borderRadius: 2 }}>
          <Search sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No applications found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {search || statusFilter !== "all" || jobFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No applications received yet"}
          </Typography>
          <Button variant="contained" onClick={() => {
            setSearch("");
            setStatusFilter("all");
            setJobFilter("all");
          }}>
            Clear All Filters
          </Button>
        </Paper>
      )}

      {/* Application Detail Dialog */}
      <DetailDialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedApplication && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight="bold">
                  Application Details
                </Typography>
                <IconButton onClick={() => setDetailDialogOpen(false)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                <Tab label="Applicant Info" />
                <Tab label="Job Details" />
                <Tab label="Cover Letter" />
                <Tab label="Notes" />
                <Tab label="Actions" />
              </Tabs>

              {tabValue === 0 && (
                <Box>
                  {/* Applicant Header */}
                  <Box display="flex" alignItems="center" gap={3} mb={3}>
                    <Avatar
                      src={selectedApplication.applicant?.profile?.profilePicture?.url}
                      sx={{ width: 80, height: 80 }}
                    />
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold">
                        {selectedApplication.applicant?.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {selectedApplication.applicant?.email}
                      </Typography>
                      {selectedApplication.applicant?.profile?.title && (
                        <Typography variant="body1" color="primary" fontWeight="500">
                          {selectedApplication.applicant.profile.title}
                        </Typography>
                      )}
                      <Box display="flex" gap={2} mt={1}>
                        <StatusChip
                          label={selectedApplication.status}
                          status={selectedApplication.status}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Applied: {formatDate(selectedApplication.appliedAt)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Rating
                        value={selectedApplication.rating || 0}
                        onChange={(event, newValue) => handleUpdateRating(newValue)}
                        size="large"
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Applicant Details */}
                  <Grid container spacing={3}>
                    <Grid size={{xs:12, md:6}}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Contact Information
                      </Typography>
                      <List dense>
                        {selectedApplication.applicant?.profile?.phone && (
                          <ListItem>
                            <ListItemAvatar>
                              <Phone fontSize="small" />
                            </ListItemAvatar>
                            <ListItemText primary={selectedApplication.applicant.profile.phone} />
                          </ListItem>
                        )}
                        <ListItem>
                          <ListItemAvatar>
                            <LocationOn fontSize="small" />
                          </ListItemAvatar>
                          <ListItemText primary={selectedApplication.applicant?.profile?.location || "Not specified"} />
                        </ListItem>
                        <ListItem>
                          <ListItemAvatar>
                            <Work fontSize="small" />
                          </ListItemAvatar>
                          <ListItemText primary={selectedApplication.applicant?.profile?.experience || "Not specified"} />
                        </ListItem>
                      </List>
                    </Grid>

                    <Grid size={{xs:12}}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Skills
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {selectedApplication.applicant?.profile?.skills?.map((skill, idx) => (
                          <Chip key={idx} label={skill} color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>

                    {selectedApplication.applicant?.profile?.education && selectedApplication.applicant.profile.education.length > 0 && (
                      <Grid size={{xs:12}}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Education
                        </Typography>
                        <List dense>
                          {selectedApplication.applicant.profile.education.map((edu, idx) => (
                            <ListItem key={idx}>
                              <ListItemAvatar>
                                <School fontSize="small" />
                              </ListItemAvatar>
                              <ListItemText 
                                primary={`${edu.degree} in ${edu.field}`}
                                secondary={`${edu.institution} (${edu.year})`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    {selectedApplication.applicant?.profile?.bio && (
                      <Grid size={{xs:12}}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          About
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="body2">
                            {selectedApplication.applicant.profile.bio}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {tabValue === 1 && selectedApplication.job && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedApplication.job.title}
                  </Typography>
                  <Box display="flex" gap={2} mb={3}>
                    <Chip icon={<LocationOn />} label={selectedApplication.job.location} />
                    {selectedApplication.job.type && <Chip label={selectedApplication.job.type} />}
                    {selectedApplication.job.salary && (
                      <Chip 
                        label={`${selectedApplication.job.salary.currency} ${selectedApplication.job.salary.min}k - ${selectedApplication.job.salary.max}k`}
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {selectedApplication.job.description && (
                    <Box mb={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Job Description
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="body2">
                          {selectedApplication.job.description}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {selectedApplication.job.requirements && selectedApplication.job.requirements.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Requirements
                      </Typography>
                      <List dense>
                        {selectedApplication.job.requirements.map((req, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={`• ${req}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}

              {tabValue === 2 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Cover Letter
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
                    <Typography variant="body1">
                      {selectedApplication.coverLetter || "No cover letter provided."}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {tabValue === 3 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Box mb={3}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this candidate..."
                      variant="outlined"
                      size="small"
                    />
                    <Box display="flex" justifyContent="flex-end" mt={1}>
                      <Button
                        variant="contained"
                        startIcon={<NoteAdd />}
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                      >
                        Add Note
                      </Button>
                    </Box>
                  </Box>

                  {selectedApplication.notes && selectedApplication.notes.length > 0 ? (
                    <List>
                      {selectedApplication.notes.map((note, idx) => (
                        <ListItem key={idx} alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <Person fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                {note.note}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(note.addedAt)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        No notes yet. Add your first note above.
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}

              {tabValue === 4 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom mb={2}>
                    Change Application Status
                  </Typography>
                  <Grid container spacing={2}>
                    {statusOptions.map((option) => (
                      <Grid size={{xs:12, md:6}} key={option.value}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={option.icon}
                          sx={{
                            height: 80,
                            borderColor: option.color,
                            color: option.color,
                            "&:hover": {
                              borderColor: option.color,
                              backgroundColor: `${option.color}10`,
                            },
                          }}
                          onClick={() => handleStatusChange(selectedApplication._id, option.value as ApplicationStatus)}
                          disabled={selectedApplication.status === option.value}
                        >
                          <Box textAlign="left">
                            <Typography variant="subtitle1" fontWeight="bold">
                              {option.label}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {option.description}
                            </Typography>
                          </Box>
                        </Button>
                      </Grid>
                    ))}
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom mb={2}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{xs:12, md:6}}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Email />}
                        onClick={() => handleSendEmail(selectedApplication.applicant?.email || "")}
                      >
                        Send Email
                      </Button>
                    </Grid>
                    <Grid size={{xs:12, md:6}}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => handleDownloadResume(selectedApplication.applicant?.profile?.resume?.url || "")}
                      >
                        Download Resume
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  if (selectedApplication.status === "applied") {
                    handleStatusChange(selectedApplication._id, "shortlisted");
                  } else if (selectedApplication.status === "shortlisted") {
                    handleStatusChange(selectedApplication._id, "interviewed");
                  }
                }}
                disabled={selectedApplication.status === "rejected" || selectedApplication.status === "hired"}
              >
                {selectedApplication.status === "applied" ? "Shortlist" : 
                 selectedApplication.status === "shortlisted" ? "Schedule Interview" : 
                 "Next Step"}
              </Button>
            </DialogActions>
          </>
        )}
      </DetailDialog>

      {/* Footer Stats */}
      <Box mt={4} pt={3} borderTop="1px solid #e0e0e0">
        <Typography variant="body2" color="text.secondary">
          Showing {filteredApplications.length} of {applications.length} applications
          • Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Container>
  );
}
