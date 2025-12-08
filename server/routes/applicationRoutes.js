// routes/applicationRoute.js
const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getApplications,
  getEmployerApplications,
  getEmployerStats,
  getApplicationById,
  updateApplicationStatus,
  downloadResume,
  getApplicationStats,
  addNote,
  toggleFavorite,
  updateRating,
  getEmployerJobs
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public: apply for job
router.post('/apply/:jobId', protect, authorize('jobseeker'), applyForJob);

// Jobseeker: get user's applications
router.get('/', protect, authorize('jobseeker'), getApplications);

// Employer: get all applications for employer's jobs
router.get('/employer', protect, authorize('employer'), getEmployerApplications);

// Employer: get employer's jobs for filter dropdown
router.get('/employer/jobs', protect, authorize('employer'), getEmployerJobs);

// Employer: get aggregated stats
router.get('/employer/stats', protect, authorize('employer'), getEmployerStats);

// Employer: get single application details
router.get('/employer/applications/:applicationId', protect, authorize('employer'), getApplicationById);

// Employer: update application status
router.put('/employer/applications/:id/status', protect, authorize('employer'), updateApplicationStatus);

// Employer: add note to application
router.post('/employer/applications/:id/notes', protect, authorize('employer'), addNote);

// Employer: toggle favorite status
router.patch('/employer/applications/:id/favorite', protect, authorize('employer'), toggleFavorite);

// Employer: update rating
router.patch('/employer/applications/:id/rating', protect, authorize('employer'), updateRating);

// Resume download (both employer and applicant)
router.get('/:id/resume', protect, downloadResume);

// Jobseeker: general stats
router.get('/stats', protect, getApplicationStats);

module.exports = router;