const User = require('../Models/User');
const Job = require('../Models/Job');
const Application = require('../Models/Application');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendEmail } = require('../config/email');
const { validateAdminLogin } = require('../utils/validators');

// Admin login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      req.flash('error', 'Email and password are required');
      return res.render('admin/login', {
        title: 'Login',
        error: 'Email and password are required',
        email: email || ''
      });
    }

    // Find admin by email
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      req.flash('error', 'Invalid email');
      return res.render('admin/login', {
        title: 'Login',
        error: 'Invalid email',
        email
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid password');
      return res.render('admin/login', {
        title: 'Login',
        error: 'Invalid password',
        email
      });
    }

    // Set admin session
    req.session.admin = {
      id: admin._id,
      name: admin.name,
      email: admin.email
    };

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Admin login error:', error);
    req.flash('error', 'Server error occurred');
    res.render('admin/login', {
      title: 'Login',
      error: 'Server error occurred',
      email: req.body.email || ''
    });
  }
};

//Admin dashboard    
const dashboard = async (req, res) => {
  try {
    const userStats = await User.getUserStats();

    const jobAgg = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const jobStats = {
      totalJobs: jobAgg.reduce((a, b) => a + b.count, 0),
      statusBreakdown: jobAgg
    };

    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('admin/dashboard', {   // ✅ THIS MUST MATCH FILE PATH
      title: 'Admin Dashboard',
      admin: req.session.admin,
      userStats,
      jobStats,
      recentJobs,
      recentUsers
    });

  } catch (error) {
    console.error(error);
    res.redirect('/admin/login');
  }
};



// Create employer account
const createEmployer = async (req, res) => {
  try {
    const { name, email, companyName, companyDescription, companyWebsite, companyIndustry } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'User with this email already exists');
      return res.redirect('/admin/create-employer');
    }

    // Generate random password
    const password = generatePassword(12);

    // Create employer account
    const employer = new User({
      name,
      email,
      password,
      role: 'employer',
      isVerified: true,
      company: {
        name: companyName,
        description: companyDescription,
        website: companyWebsite,
        industry: companyIndustry,
        size: '1-10' // Default size
      }
    });

    await employer.save();

    // Send credentials email
    await sendEmail(
      email,
      'Your Employer Account - NextHire',
      'employer-credentials.ejs',
      {
        name,
        companyName,
        email,
        password,
        loginUrl: `${process.env.CLIENT_URL}/`
      }
    );

    req.flash('success', 'Employer account created successfully. Credentials have been emailed.');
    res.redirect('/admin/employers');
  } catch (error) {
    console.error('Create employer error:', error);
    req.flash('error', 'Error creating employer account');
    res.redirect('/admin/create-employer');
  }
};

// Get all job seekers
const getJobSeekers = async (req, res) => {
  try {
    const { page = 1, search, status } = req.query;
    const limit = 10;

    const matchStage = { role: 'jobseeker' };
    
    if (search) {
      matchStage.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { 'profile.title': new RegExp(search, 'i') }
      ];
    }

    if (status === 'verified') {
      matchStage.isVerified = true;
    } else if (status === 'unverified') {
      matchStage.isVerified = false;
    }

    const jobSeekers = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'applicant',
          as: 'applications'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          isVerified: 1,
          'profile.title': 1,
          'profile.skills': 1,
          'profile.experience': 1,
          'profile.location': 1,
          createdAt: 1,
          applicationCount: { $size: '$applications' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    const total = await User.countDocuments(matchStage);

    res.render('admin/job-seekers', {
      title: 'Job Seekers',
      jobSeekers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      search: search || '',
      status: status || '',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Get job seekers error:', error);
    req.flash('error', 'Error loading job seekers');
    res.redirect('/admin/job-seekers');
  }
};

// Get all employers
const getEmployers = async (req, res) => {
  try {
    const { page = 1, search } = req.query;
    const limit = 10;

    const matchStage = { role: 'employer' };
    
    if (search) {
      matchStage.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { 'company.name': new RegExp(search, 'i') }
      ];
    }

    const employers = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'employer',
          as: 'jobs'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          isVerified: 1,
          'company.name': 1,
          'company.industry': 1,
          'company.size': 1,
          createdAt: 1,
          jobCount: { $size: '$jobs' },
          totalApplications: {
            $sum: '$jobs.applicationsCount'
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    const total = await User.countDocuments(matchStage);

    res.render('admin/employers', {
      title: 'Employers',
      employers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      search: search || '',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Get employers error:', error);
    req.flash('error', 'Error loading employers');
    res.redirect('/admin/employers');
  }
};

// Get all jobs
const getJobs = async (req, res) => {
  try {
    const { page = 1, search, status } = req.query;
    const limit = 10;

    const matchStage = {};
    
    if (search) {
      matchStage.$text = { $search: search };
    }

    if (status) {
      matchStage.status = status;
    }

    const jobs = await Job.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'employer',
          foreignField: '_id',
          as: 'employer'
        }
      },
      { $unwind: '$employer' },
      {
        $project: {
          title: 1,
          location: 1,
          type: 1,
          status: 1,
          views: 1,
          applicationsCount: 1,
          applicationDeadline: 1,
          createdAt: 1,
          'employer.company.name': 1,
          'employer.name': 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    const total = await Job.countDocuments(matchStage);

    res.render('admin/jobs', {
      title: 'Jobs',
      jobs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      search: search || '',
      status: status || '',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    req.flash('error', 'Error loading jobs');
    res.redirect('/admin/jobs');
  }
};

// Logout
const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

module.exports = {
  login,
  dashboard,
  createEmployer,
  getJobSeekers,
  getEmployers,
  getJobs,
  logout
};