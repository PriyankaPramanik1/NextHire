"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Pagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Person,
  Work,
  Send,
  Bookmark,
  Visibility,
  Chat,
  Search,
  FilterList,
} from "@mui/icons-material";
import { styled } from "@mui/system";
import axios from "@/lib/axios";
import { Job, Application } from "@/types";
import { useSocket } from "@/context/SocketContext";

const StatCard = styled(Card)({
  height: "100%",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  transition: "transform 0.2s",
  "&:hover": {
    transform: "translateY(-5px)",
  },
});

const QuickActionCard = styled(Card)({
  height: "100%",
  textAlign: "center",
  padding: "1rem",
  cursor: "pointer",
  transition: "all 0.3s",
  "&:hover": {
    backgroundColor: "#f5f5f5",
    transform: "scale(1.05)",
  },
});

interface JobFilters {
  search: string;
  location: string;
  type: string;
  category: string;
  experience: string;
  minSalary: number | "";
  maxSalary: number | "";
}

export default function JobSeekerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    applications: 0,
    savedJobs: 0,
    interviews: 0,
    profileStrength: 0,
  });
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });
  const [applyDialog, setApplyDialog] = useState({
    open: false,
    jobId: "",
    jobTitle: "",
  });
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    resume: null as File | null,
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filters, setFilters] = useState<JobFilters>({
    search: "",
    location: "",
    type: "",
    category: "",
    experience: "",
    minSalary: "",
    maxSalary: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      setupSocketListeners();
    }
  }, [user, page, filters]);

  const setupSocketListeners = () => {
    if (socket) {
      socket.on("connect", () => {
        console.log("Socket connected");
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      // Listen for new chat messages
      socket.on("receive_message", (message) => {
        console.log("New message received:", message);
        showSnackbar(`New message from ${message.sender?.name}`, "info");
      });

      // Listen for new message notifications
      socket.on("new_message_notification", (notification) => {
        console.log("New message notification:", notification);
        showSnackbar(
          `${notification.message} from ${notification.sender}`,
          "info"
        );
      });

      // Listen for typing indicators
      socket.on("user_typing", (data) => {
        console.log(`${data.name} is typing...`);
      });

      socket.on("user_stop_typing", (data) => {
        console.log(`${data.userId} stopped typing`);
      });

      // Listen for messages read status
      socket.on("messages_read", (data) => {
        console.log("Messages were read by:", data.readerId);
      });

      // Listen for message errors
      socket.on("message_error", (error) => {
        console.error("Message error:", error);
        showSnackbar(error.error || "Error sending message", "error");
      });

      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("receive_message");
        socket.off("new_message_notification");
        socket.off("user_typing");
        socket.off("user_stop_typing");
        socket.off("messages_read");
        socket.off("message_error");
      };
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", "12");

      if (filters.search) queryParams.append("search", filters.search);
      if (filters.location) queryParams.append("location", filters.location);
      if (filters.type) queryParams.append("type", filters.type);
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.experience)
        queryParams.append("experience", filters.experience);
      if (filters.minSalary)
        queryParams.append("minSalary", filters.minSalary.toString());
      if (filters.maxSalary)
        queryParams.append("maxSalary", filters.maxSalary.toString());

      const [statsRes, jobsRes, applicationsRes] = await Promise.all([
        axios.get("/users/stats"),
        axios.get(`/jobs/getJobs?${queryParams}`),
        axios.get("/applications?limit=5"),
      ]);

      setStats(statsRes.data);
      setAllJobs(jobsRes.data.jobs || jobsRes.data);
      setTotalPages(jobsRes.data.totalPages || 1);
      setTotalJobs(jobsRes.data.totalJobs || jobsRes.data.length || 0);
      setRecentApplications(
        applicationsRes.data.applications || applicationsRes.data || []
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showSnackbar("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleViewJob = (jobId: string) => {
    router.push(`/jobseeker/jobs/${jobId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "primary";
      case "shortlisted":
        return "secondary";
      case "hired":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleApplyClick = (jobId: string, jobTitle: string) => {
    setApplyDialog({
      open: true,
      jobId,
      jobTitle,
    });
  };

  const handleApplySubmit = async () => {
    try {
      // Prepare form data for resume upload if exists
      let resumeUrl = "";
      if (applicationData.resume) {
        try {
          const resumeFormData = new FormData();
          resumeFormData.append("resume", applicationData.resume);

          const resumeResponse = await axios.post(
            "/users/profile/resume",
            resumeFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (resumeResponse.data.success) {
            resumeUrl =
              resumeResponse.data.resumeUrl ||
              resumeResponse.data.profile?.resume;
          }
        } catch (resumeError) {
          console.error("Error uploading resume:", resumeError);
          // Continue without resume if upload fails
        }
      }

      // Submit application
      const applicationPayload: any = {
        coverLetter: applicationData.coverLetter,
      };

      // Only add resume if we have a URL
      if (resumeUrl) {
        applicationPayload.resume = resumeUrl;
      }

      const response = await axios.post(
        `http://localhost:5000/api/applications/apply/${applyDialog.jobId}`,
        applicationPayload,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        showSnackbar("Application submitted successfully!", "success");
        setApplyDialog({ open: false, jobId: "", jobTitle: "" });
        setApplicationData({ coverLetter: "", resume: null });

        // Refresh data
        fetchDashboardData();
      } else {
        showSnackbar(
          response.data.message || "Error applying for job",
          "error"
        );
      }
    } catch (error: any) {
      console.error("Error applying for job:", error);

      // Detailed error logging
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);

        // Handle specific error cases
        if (error.response.status === 400) {
          showSnackbar(
            error.response.data?.message ||
              "Bad request. Please check your application.",
            "error"
          );
        } else if (error.response.status === 404) {
          showSnackbar("Job not found or no longer available", "error");
        } else {
          showSnackbar(
            error.response.data?.message || "Error applying for job",
            "error"
          );
        }
      } else if (error.request) {
        showSnackbar(
          "No response from server. Please check your connection.",
          "error"
        );
      } else {
        showSnackbar("Error submitting application", "error");
      }
    }
  };

  // In your page.tsx (dashboard)
  const handleStartChat = async (job: Job) => {
    if (!socket || !socket.connected) {
      showSnackbar("Chat connection not available. Please try again.", "error");
      return;
    }

    try {
      // ✅ Better employer ID extraction
      const employerId =
        job.employer?._id ||
        job.employer?.id ||
        (typeof job.employer === "string" ? job.employer : null);

      console.log("Job object:", job); // Debug log
      console.log("Employer ID:", employerId); // Debug log

      if (!employerId) {
        showSnackbar("Employer information not available", "error");
        return;
      }

      // Send initial message via REST API
      const chatResponse = await axios.post("/chat/send", {
        recipientId: employerId, // ✅ Changed from 'recipient' to 'recipientId'
        content: `Hi, I'm interested in your job posting: "${job.title}"`,
        jobId: job._id,
      });

      if (chatResponse.data) {
        // Join chat room via socket
        socket.emit("join_chat", { recipientId: employerId });

        // Navigate to chat page
        router.push(
          `/jobseeker/chat?recipientId=${employerId}&jobId=${job._id}`
        );

        showSnackbar("Chat started successfully!", "success");
      }
    } catch (error: any) {
      console.error("Error starting chat:", error);
      console.error("Error response:", error.response?.data); // Debug log
      showSnackbar(
        error.response?.data?.message ||
          "Error starting chat. Please try again.",
        "error"
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setApplicationData({
        ...applicationData,
        resume: e.target.files[0],
      });
    }
  };

  const isAlreadyApplied = (jobId: string) => {
    return recentApplications.some((app) => app.job?._id === jobId);
  };

  const handleFilterChange = (
    key: keyof JobFilters,
    value: string | number
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      location: "",
      type: "",
      category: "",
      experience: "",
      minSalary: "",
      maxSalary: "",
    });
    setPage(1);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user.name}!
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h3" component="div">
                    {stats.applications}
                  </Typography>
                  <Typography variant="body2">Applications</Typography>
                </Box>
                <Send sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </StatCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h3" component="div">
                    {stats.savedJobs}
                  </Typography>
                  <Typography variant="body2">Saved Jobs</Typography>
                </Box>
                <Bookmark sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </StatCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h3" component="div">
                    {stats.interviews}
                  </Typography>
                  <Typography variant="body2">Interviews</Typography>
                </Box>
                <Work sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </StatCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h3" component="div">
                    {stats.profileStrength}%
                  </Typography>
                  <Typography variant="body2">Profile Strength</Typography>
                </Box>
                <Person sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h5" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <QuickActionCard onClick={() => router.push("/jobseeker/jobs")}>
                <Work color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Browse Jobs</Typography>
                <Typography variant="body2" color="text.secondary">
                  Find new opportunities
                </Typography>
              </QuickActionCard>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <QuickActionCard
                onClick={() => router.push("/jobseeker/profile")}
              >
                <Person color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Update Profile</Typography>
                <Typography variant="body2" color="text.secondary">
                  Improve your profile
                </Typography>
              </QuickActionCard>
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h5" gutterBottom>
            Recent Applications
          </Typography>
          <Paper sx={{ p: 2 }}>
            {recentApplications.length === 0 ? (
              <Typography color="text.secondary" textAlign="center">
                No applications yet
              </Typography>
            ) : (
              recentApplications.map((application) => (
                <Box
                  key={application._id}
                  sx={{ mb: 2, pb: 2, borderBottom: "1px solid #eee" }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {application.job?.title}
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      {application.job?.employer?.company?.name}
                    </Typography>
                    <Chip
                      label={application.status}
                      size="small"
                      color={getStatusColor(application.status) as any}
                    />
                  </Box>
                </Box>
              ))
            )}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => router.push("/jobseeker/applications")}
            >
              View All Applications
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* All Jobs - Dynamically Loaded */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5">All Available Jobs ({totalJobs})</Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push("/jobseeker/jobs")}
            >
              Browse More Jobs
            </Button>
          </Box>
        </Box>

        {/* Filters Section */}
        {showFilters && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: "#f9f9f9" }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Search Jobs"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Location"
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                  placeholder="City, State, or Remote"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Job Type"
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="full-time">Full-time</MenuItem>
                    <MenuItem value="part-time">Part-time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="internship">Internship</MenuItem>
                    <MenuItem value="remote">Remote</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={filters.experience}
                    label="Experience Level"
                    onChange={(e) =>
                      handleFilterChange("experience", e.target.value)
                    }
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    <MenuItem value="entry">Entry Level</MenuItem>
                    <MenuItem value="mid">Mid Level</MenuItem>
                    <MenuItem value="senior">Senior Level</MenuItem>
                    <MenuItem value="executive">Executive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Min Salary"
                  type="number"
                  value={filters.minSalary}
                  onChange={(e) =>
                    handleFilterChange("minSalary", e.target.value)
                  }
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Max Salary"
                  type="number"
                  value={filters.maxSalary}
                  onChange={(e) =>
                    handleFilterChange("maxSalary", e.target.value)
                  }
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box display="flex" justifyContent="space-between">
                  <Button onClick={clearFilters} color="inherit">
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => setShowFilters(false)}
                    variant="contained"
                  >
                    Apply Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : allJobs.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" py={4}>
            No jobs available at the moment
          </Typography>
        ) : (
          <>
            <Grid container spacing={3}>
              {allJobs.map((job) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={job._id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 3,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ fontWeight: "bold" }}
                      >
                        {job.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        <Box component="span" sx={{ fontWeight: "medium" }}>
                          {job.employer?.company?.name || job.employer?.name}
                        </Box>
                        {job.location && ` • ${job.location}`}
                      </Typography>

                      <Typography
                        variant="body2"
                        gutterBottom
                        sx={{ color: "primary.main", fontWeight: "medium" }}
                      >
                        ${job.salary?.min?.toLocaleString() || "0"} - $
                        {job.salary?.max?.toLocaleString() || "0"} • {job.type}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ mb: 2, color: "text.secondary" }}
                      >
                        {job.description?.substring(0, 100)}...
                      </Typography>

                      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                        {job.skills?.slice(0, 4).map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        ))}
                        {job.skills?.length > 4 && (
                          <Chip
                            label={`+${job.skills.length - 4} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        )}
                      </Box>

                      <Box
                        display="flex"
                        gap={1}
                        flexWrap="wrap"
                        sx={{ mt: "auto" }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewJob(job._id)}
                          fullWidth
                          sx={{ mb: 1 }}
                        >
                          View Details
                        </Button>

                        <Button
                          variant="contained"
                          size="small"
                          disabled={isAlreadyApplied(job._id)}
                          onClick={() => handleApplyClick(job._id, job.title)}
                          fullWidth
                          sx={{ mb: 1 }}
                        >
                          {isAlreadyApplied(job._id) ? "Applied" : "Apply Now"}
                        </Button>

                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<Chat />}
                          onClick={() => handleStartChat(job)}
                          fullWidth
                          disabled={!socket || !socket.connected}
                        >
                          {socket && socket.connected
                            ? "Chat with Employer"
                            : "Connecting..."}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Apply Dialog */}
      <Dialog
        open={applyDialog.open}
        onClose={() => setApplyDialog({ ...applyDialog, open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Apply for: {applyDialog.jobTitle}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your profile resume will be used for this application. You can
              upload a new resume below if needed.
            </Typography>

            <TextField
              label="Cover Letter"
              multiline
              rows={6}
              fullWidth
              value={applicationData.coverLetter}
              onChange={(e) =>
                setApplicationData({
                  ...applicationData,
                  coverLetter: e.target.value,
                })
              }
              placeholder="Tell the employer why you're a good fit for this position..."
              variant="outlined"
              sx={{ mb: 3, mt: 2 }}
              required
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upload New Resume (Optional)
              </Typography>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="resume-upload"
              />
              <label htmlFor="resume-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ height: 56 }}
                >
                  {applicationData.resume
                    ? applicationData.resume.name
                    : "Choose Resume File"}
                </Button>
              </label>
              {applicationData.resume && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Selected: {applicationData.resume.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setApplyDialog({ ...applyDialog, open: false })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplySubmit}
            variant="contained"
            disabled={!applicationData.coverLetter.trim()}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
