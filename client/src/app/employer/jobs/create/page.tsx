"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  CircularProgress,
  Menu,
  FormGroup,
} from "@mui/material";
import {
  Save,
  ArrowBack,
  Add,
  Delete,
  AttachMoney,
  Work,
  LocationOn,
  AccessTime,
  School,
  Business,
  Category,
  TrendingUp,
  Description,
  EmojiObjects,
  CheckCircle,
} from "@mui/icons-material";
import { styled } from "@mui/system";
import Swal from "sweetalert2";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';



const StyledCard = styled(Card)({
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
});

const steps = [
  "Basic Information",
  "Job Details",
  "Requirements & Skills",
  "Review & Publish",
];

const jobTypes = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
];

const experienceLevels = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "executive", label: "Executive" },
];

const jobCategories = [
  "Technology",
  "Marketing",
  "Sales",
  "Design",
  "Finance",
  "Human Resources",
  "Operations",
  "Healthcare",
  "Education",
  "Engineering",
  "Customer Service",
  "Other",
];

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "INR", label: "INR (₹)" },
];

export default function CreateJobPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    title: "",
    category: "",
    type: "full-time",
    location: "",
    remoteAllowed: false,
    applicationDeadline: null as Date | null,

    // Step 2: Job Details
    description: "",
    requirements: [""],
    responsibilities: [""],
    benefits: [""],
    salary: {
      min: "",
      max: "",
      currency: "USD",
    },

    // Step 3: Requirements
    experience: "mid",
    skills: [] as string[],
    qualifications: [""],
  });

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem("jobDraft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.applicationDeadline) {
          draft.applicationDeadline = new Date(draft.applicationDeadline);
        }
        setFormData(draft);
        Swal.fire({
          title: "Draft Found",
          text: "Would you like to continue from your saved draft?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes, continue",
          cancelButtonText: "No, start fresh",
        }).then((result) => {
          if (!result.isConfirmed) {
            localStorage.removeItem("jobDraft");
          }
        });
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, []);

  // Save draft to localStorage
  const saveDraft = () => {
    localStorage.setItem("jobDraft", JSON.stringify(formData));
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      saveDraft();
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (step: number): boolean => {
    let isValid = true;
    let errorMessage = "";

    switch (step) {
      case 0:
        if (!formData.title.trim()) {
          errorMessage = "Job title is required";
          isValid = false;
        } else if (!formData.location.trim()) {
          errorMessage = "Location is required";
          isValid = false;
        } else if (!formData.category) {
          errorMessage = "Please select a job category";
          isValid = false;
        }
        break;
      case 1:
        if (!formData.description.trim()) {
          errorMessage = "Job description is required";
          isValid = false;
        } else if (!formData.salary.min || !formData.salary.max) {
          errorMessage = "Salary range is required";
          isValid = false;
        } else if (parseFloat(formData.salary.min) > parseFloat(formData.salary.max)) {
          errorMessage = "Minimum salary cannot be greater than maximum salary";
          isValid = false;
        }
        break;
      case 2:
        if (formData.skills.length === 0) {
          errorMessage = "Add at least one required skill";
          isValid = false;
        }
        break;
    }

    if (!isValid) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: errorMessage,
      });
    }

    return isValid;
  };

  const handleAddItem = (
    field: "requirements" | "responsibilities" | "benefits" | "qualifications"
  ) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ""],
    });
  };

  const handleRemoveItem = (
    field: "requirements" | "responsibilities" | "benefits" | "qualifications",
    index: number
  ) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (
    field: "requirements" | "responsibilities" | "benefits" | "qualifications",
    index: number,
    value: string
  ) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({
      ...formData,
      [field]: updated,
    });
  };

  const addSkill = () => {
    if (skillsInput.trim() && !formData.skills.includes(skillsInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillsInput.trim()],
      });
      setSkillsInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillsInput.trim()) {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setSubmitting(true);
    setError("");

    try {
      // Format the data for backend
      const jobData = {
        title: formData.title,
        category: formData.category,
        type: formData.type,
        location: formData.location,
        remoteAllowed: formData.remoteAllowed,
        applicationDeadline: formData.applicationDeadline
          ? formData.applicationDeadline.toISOString()
          : null,
        description: formData.description,
        requirements: formData.requirements.filter((r) => r.trim()),
        responsibilities: formData.responsibilities.filter((r) => r.trim()),
        benefits: formData.benefits.filter((b) => b.trim()),
        salary: {
          min: parseFloat(formData.salary.min),
          max: parseFloat(formData.salary.max),
          currency: formData.salary.currency,
        },
        experience: formData.experience,
        skills: formData.skills,
        qualifications: formData.qualifications.filter((q) => q.trim()),
        status: "active",
      };

      const response = await axios.post("/jobs/createJob", jobData);

      // Clear draft
      localStorage.removeItem("jobDraft");

      await Swal.fire({
        icon: "success",
        title: "Job Posted Successfully!",
        text: "Your job has been published and is now visible to candidates.",
        showConfirmButton: false,
        timer: 2000,
      });

      router.push("/employer/jobs");
    } catch (error: any) {
      console.error("Error posting job:", error);
      setError(error.response?.data?.message || "Failed to post job. Please try again.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to post job. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const saveAsDraft = () => {
    saveDraft();
    Swal.fire({
      icon: "success",
      title: "Draft Saved",
      text: "Your job has been saved as a draft. You can continue later.",
      showConfirmButton: false,
      timer: 1500,
    });
    router.push("/employer/dashboard");
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Job Title *"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Senior Frontend Developer"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Work />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Be specific and descriptive"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category *"
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    startAdornment={
                      <InputAdornment position="start">
                        <Category />
                      </InputAdornment>
                    }
                  >
                    {jobCategories.map((category) => (
                      <MenuItem key={category} value={category.toLowerCase()}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Job Type *</InputLabel>
                  <Select
                    value={formData.type}
                    label="Job Type *"
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    {jobTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="Location *"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., San Francisco, CA or Remote"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <DatePicker
                    label="Application Deadline"
                    value={formData.applicationDeadline}
                    onChange={(newValue: any) =>
                      setFormData({ ...formData, applicationDeadline: newValue })
                    }
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccessTime />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.remoteAllowed}
                      onChange={(e) =>
                        setFormData({ ...formData, remoteAllowed: e.target.checked })
                      }
                    />
                  }
                  label="Remote work allowed"
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Job Description *"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the role, team, company culture, and impact..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description />
                    </InputAdornment>
                  ),
                }}
                helperText="Describe what makes this role unique and exciting"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Key Responsibilities
              </Typography>
              {formData.responsibilities.map((item, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    value={item}
                    onChange={(e) =>
                      handleItemChange(
                        "responsibilities",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="e.g., Develop and maintain web applications using React"
                    size="small"
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem("responsibilities", index)}
                    color="error"
                    disabled={formData.responsibilities.length === 1}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<Add />}
                onClick={() => handleAddItem("responsibilities")}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Add Responsibility
              </Button>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Requirements & Qualifications
              </Typography>
              {formData.requirements.map((item, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    value={item}
                    onChange={(e) =>
                      handleItemChange("requirements", index, e.target.value)
                    }
                    placeholder="e.g., 3+ years of experience in web development"
                    size="small"
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem("requirements", index)}
                    color="error"
                    disabled={formData.requirements.length === 1}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<Add />}
                onClick={() => handleAddItem("requirements")}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Add Requirement
              </Button>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Min Salary *"
                type="number"
                value={formData.salary.min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salary: { ...formData.salary, min: e.target.value },
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Max Salary *"
                type="number"
                value={formData.salary.max}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salary: { ...formData.salary, max: e.target.value },
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.salary.currency}
                  label="Currency"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary: { ...formData.salary, currency: e.target.value },
                    })
                  }
                >
                  {currencyOptions.map((currency) => (
                    <MenuItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Employee Benefits & Perks
              </Typography>
              {formData.benefits.map((item, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    value={item}
                    onChange={(e) =>
                      handleItemChange("benefits", index, e.target.value)
                    }
                    placeholder="e.g., Health insurance, 401(k) matching, Flexible hours"
                    size="small"
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem("benefits", index)}
                    color="error"
                    disabled={formData.benefits.length === 1}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<Add />}
                onClick={() => handleAddItem("benefits")}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Add Benefit
              </Button>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Experience Level *</InputLabel>
                <Select
                  value={formData.experience}
                  label="Experience Level *"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience: e.target.value,
                    })
                  }
                >
                  {experienceLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box display="flex" alignItems="center" height="100%">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.remoteAllowed}
                      onChange={(e) =>
                        setFormData({ ...formData, remoteAllowed: e.target.checked })
                      }
                    />
                  }
                  label="Remote work option"
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Required Skills *
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  label="Add a skill"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., React, Node.js, MongoDB"
                  size="small"
                />
                <Button variant="contained" onClick={addSkill} disabled={!skillsInput.trim()}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {formData.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => removeSkill(skill)}
                    color="primary"
                    variant="outlined"
                    deleteIcon={<Delete />}
                  />
                ))}
              </Box>
              {formData.skills.length === 0 && (
                <FormHelperText error>Please add at least one skill</FormHelperText>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Additional Qualifications
              </Typography>
              {formData.qualifications.map((item, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    value={item}
                    onChange={(e) =>
                      handleItemChange("qualifications", index, e.target.value)
                    }
                    placeholder="e.g., Bachelor's degree in Computer Science"
                    size="small"
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem("qualifications", index)}
                    color="error"
                    disabled={formData.qualifications.length === 1}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<Add />}
                onClick={() => handleAddItem("qualifications")}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Add Qualification
              </Button>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Review Your Job Posting
            </Typography>

            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h5" fontWeight="700" color="primary" gutterBottom>
                    {formData.title}
                  </Typography>
                  <Box display="flex" gap={2} mt={1} flexWrap="wrap">
                    <Chip 
                      label={jobTypes.find(t => t.value === formData.type)?.label || formData.type}
                      size="small" 
                      color="primary"
                    />
                    <Chip
                      label={formData.location}
                      size="small"
                      icon={<LocationOn />}
                      variant="outlined"
                    />
                    {formData.remoteAllowed && (
                      <Chip
                        label="Remote Available"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label={`${formData.experience.charAt(0).toUpperCase() + formData.experience.slice(1)} Level`}
                      size="small"
                      icon={<TrendingUp />}
                    />
                    <Chip
                      label={`${formData.salary.currency} ${formData.salary.min} - ${formData.salary.max}`}
                      size="small"
                      color="success"
                      icon={<AttachMoney />}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom fontWeight="600">
                    Job Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {formData.description || "No description provided"}
                  </Typography>
                </Grid>

                {formData.responsibilities.length > 0 && formData.responsibilities[0].trim() && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="600">
                      Responsibilities
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {formData.responsibilities.map((responsibility, index) => (
                        responsibility.trim() && (
                          <li key={index}>
                            <Typography variant="body2" color="text.secondary">
                              {responsibility}
                            </Typography>
                          </li>
                        )
                      ))}
                    </ul>
                  </Grid>
                )}

                {formData.requirements.length > 0 && formData.requirements[0].trim() && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="600">
                      Requirements
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {formData.requirements.map((requirement, index) => (
                        requirement.trim() && (
                          <li key={index}>
                            <Typography variant="body2" color="text.secondary">
                              {requirement}
                            </Typography>
                          </li>
                        )
                      ))}
                    </ul>
                  </Grid>
                )}

                {formData.skills.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="600">
                      Required Skills
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {formData.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {formData.benefits.length > 0 && formData.benefits[0].trim() && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="600">
                      Benefits & Perks
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formData.benefits.map((benefit, index) => (
                        benefit.trim() && (
                          <Chip
                            key={index}
                            label={benefit}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Your job will be published immediately after submission. 
                You can edit, pause, or close it anytime from your employer dashboard.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4} gap={2}>
          <IconButton onClick={() => router.back()} size="large">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              Create New Job Posting
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Fill in the details to attract the best candidates
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Form */}
        <StyledCard>
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {renderStepContent(activeStep)}

                <Box display="flex" justifyContent="space-between" mt={4} gap={2}>
                  <Box display="flex" gap={1}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      variant="outlined"
                      startIcon={<ArrowBack />}
                    >
                      Back
                    </Button>
                    
                    <Button
                      onClick={saveAsDraft}
                      variant="text"
                      color="secondary"
                    >
                      Save as Draft
                    </Button>
                  </Box>

                  <Box display="flex" gap={2}>
                    {activeStep === steps.length - 1 ? (
                      <>
                        <Button
                          variant="outlined"
                          onClick={handleBack}
                        >
                          Edit Details
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleSubmit}
                          disabled={submitting}
                          startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircle />}
                          sx={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            px: 4,
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                            },
                          }}
                        >
                          {submitting ? "Publishing..." : "Publish Job"}
                        </Button>
                      </>
                    ) : (
                      <Button variant="contained" onClick={handleNext}>
                        Continue to {steps[activeStep + 1]}
                      </Button>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </StyledCard>

        {/* Help & Tips */}
        <Box mt={3}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Pro Tip:</strong> Be specific about requirements and responsibilities. 
              Clear job descriptions attract more qualified candidates and reduce unqualified applications.
              {activeStep === 1 && " Include salary ranges to attract more applicants."}
              {activeStep === 2 && " List both technical and soft skills for better matching."}
            </Typography>
          </Alert>
        </Box>

        {/* Progress Indicator */}
        <Box mt={2} display="flex" justifyContent="center">
          <Typography variant="caption" color="text.secondary">
            Step {activeStep + 1} of {steps.length}
          </Typography>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}