const express = require('express');
const router = express.Router();
const { 
  login, 
  dashboard, 
  createEmployer, 
  getJobSeekers, 
  getEmployers, 
  getJobs, 
  logout 
} = require('../controllers/adminController');
const { adminOnly } = require('../middleware/roleMiddleware');

// Admin login page
router.get('/login', (req, res) => {
  if (req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { 
    title: 'Login',
    error: req.flash('error')
  });
});

// Admin login handler
router.post('/login', login);

// Admin dashboard
router.get('/dashboard', adminOnly, dashboard);

// Job seekers management
router.get('/job-seekers', adminOnly, getJobSeekers);

// Employers management
router.get('/employers', adminOnly, getEmployers);

// Create employer page
router.get('/create-employer', adminOnly, (req, res) => {
  res.render('admin/create-employer', {
    title: 'Create Employer',
    admin: req.session.admin,
    success: req.flash('success'),
    error: req.flash('error')
  });
});

// Create employer handler
router.post('/create-employer', adminOnly, createEmployer);

// Jobs management
router.get('/jobs', adminOnly, getJobs);

// View single employer
router.get('/employer/:id', adminOnly, async (req, res) => {
  try {
    const employer = await User.findById(req.params.id)
      .populate({
        path: 'jobs',
        options: { sort: { createdAt: -1 } }
      });
    
    if (!employer) {
      req.flash('error', 'Employer not found');
      return res.redirect('/admin/employers');
    }

    res.render('admin/employer-details', {
      title: 'Employer Details',
      admin: req.session.admin,
      employer,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Get employer error:', error);
    req.flash('error', 'Error loading employer details');
    res.redirect('/admin/employers');
  }
});

// View single job seeker
router.get('/job-seeker/:id', adminOnly, async (req, res) => {
  try {
    const jobSeeker = await User.findById(req.params.id)
      .populate({
        path: 'applications',
        populate: {
          path: 'job',
          select: 'title company'
        }
      });
    
    if (!jobSeeker) {
      req.flash('error', 'Job seeker not found');
      return res.redirect('/admin/job-seekers');
    }

    res.render('admin/jobseeker-details', {
      title: 'Job Seeker Details',
      admin: req.session.admin,
      jobSeeker,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Get job seeker error:', error);
    req.flash('error', 'Error loading job seeker details');
    res.redirect('/admin/job-seekers');
  }
});

// View single job
router.get('/job/:id', adminOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name email company')
      .populate('applications');
    
    if (!job) {
      req.flash('error', 'Job not found');
      return res.redirect('/admin/jobs');
    }

    res.render('admin/job-details', {
      title: 'Job Details',
      admin: req.session.admin,
      job,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Get job error:', error);
    req.flash('error', 'Error loading job details');
    res.redirect('/admin/jobs');
  }
});
// Toggle job seeker status
router.post('/job-seeker/:id/toggle-status', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/job-seekers');
    }
    user.isActive = !user.isActive;
    await user.save();
    req.flash('success', `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
    res.redirect('/admin/job-seekers');
  } catch (error) {
    req.flash('error', 'Error updating user status');
    res.redirect('/admin/job-seekers');
  }
});

// Toggle employer status
router.post('/employer/:id/toggle-status', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'Employer not found');
      return res.redirect('/admin/employers');
    }
    user.isActive = !user.isActive;
    await user.save();
    req.flash('success', `Employer ${user.isActive ? 'activated' : 'deactivated'} successfully`);
    res.redirect('/admin/employers');
  } catch (error) {
    req.flash('error', 'Error updating employer status');
    res.redirect('/admin/employers');
  }
});

// Toggle job status
router.post('/job/:id/toggle-status', adminOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      req.flash('error', 'Job not found');
      return res.redirect('/admin/jobs');
    }
    job.status = job.status === 'active' ? 'closed' : 'active';
    await job.save();
    req.flash('success', 'Job status updated successfully');
    res.redirect('/admin/jobs');
  } catch (error) {
    req.flash('error', 'Error updating job status');
    res.redirect('/admin/jobs');
  }
});

// Delete job
router.post('/job/:id/delete', adminOnly, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    req.flash('success', 'Job deleted successfully');
    res.redirect('/admin/jobs');
  } catch (error) {
    req.flash('error', 'Error deleting job');
    res.redirect('/admin/jobs');
  }
});


// Logout
router.get('/logout', logout);

module.exports = router;