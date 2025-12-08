const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {  authorize } = require('../middleware/roleMiddleware');
const {  getJobSeekers, getEmployers, getJobs } = require('../controllers/adminController');

const router = express.Router();

// Admin login 


// Admin dashboard
router.get('/dashboard', protect, authorize('admin'), (req, res) => {
  res.render('admin/dashboard');
});
// Admin main
router.get('/main', async (req, res) => {
  try {
    // You can add data fetching here if needed
    res.render('admin/main', {
      title: 'Admin Dashboard',
      admin: req.session.admin,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Main page error:', error);
    req.flash('error', 'Error loading main page');
    res.redirect('/admin/dashboard');
  }
});
// Job seekers list
router.get('/job-seekers', protect, authorize('admin'), getJobSeekers);

// Employers list
router.get('/employers', protect, authorize('admin'), getEmployers);

// Create employer form
router.get('/create-employer', protect, authorize('admin'), (req, res) => {
  res.render('admin/create-employer');
});

// Jobs management
router.get('/jobs', protect, authorize('admin'), getJobs);

module.exports = router;