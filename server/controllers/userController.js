const User = require('../Models/User');
const Job = require('../Models/Job');
const Application = require('../Models/Application');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { validateProfile } = require('../utils/validators');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Ensure profile and company objects exist
    if (!user.profile) {
      user.profile = {};
    }
    if (!user.company) {
      user.company = {};
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { error } = validateProfile(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Clean up the data before updating
    const updateData = { ...req.body };
    
    // Ensure profilePicture is always an object
    if (updateData.profile && updateData.profile.profilePicture === undefined) {
      updateData.profile.profilePicture = { url: '', publicId: '' };
    }
    
    // Ensure resume is always an object
    if (updateData.profile && updateData.profile.resume === undefined) {
      updateData.profile.resume = { url: '', publicId: '' };
    }
    
    // Ensure company.logo is always an object for employers
    if (updateData.company && updateData.company.logo === undefined) {
      updateData.company.logo = { url: '', publicId: '' };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user.profile) {
      user.profile = {};
    }

    // Delete old profile picture if exists
    if (user.profile.profilePicture && user.profile.profilePicture.publicId) {
      await deleteFromCloudinary(user.profile.profilePicture.publicId);
    }

    // Upload new picture to Cloudinary
    const result = await uploadToCloudinary(req.file.path, 'nexthire/profile-pictures');

    // Update user profile
    user.profile.profilePicture = {
      url: result.secure_url,
      publicId: result.public_id
    };

    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: user.profile.profilePicture
    });
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload resume
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user.profile) {
      user.profile = {};
    }

    // Delete old resume if exists
    if (user.profile.resume && user.profile.resume.publicId) {
      await deleteFromCloudinary(user.profile.resume.publicId);
    }

    // Upload new resume to Cloudinary
    const result = await uploadToCloudinary(req.file.path, 'nexthire/resumes');

    // Update user profile
    user.profile.resume = {
      url: result.secure_url,
      publicId: result.public_id
    };

    await user.save();

    res.json({
      message: 'Resume uploaded successfully',
      resume: user.profile.resume
    });
  } catch (error) {
    console.error('Error in uploadResume:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    let stats = {};
    
    // First, ensure the user's profile is properly initialized
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'jobseeker') {
      // Job seeker stats
      const applications = await Application.aggregate([
        { $match: { applicant: req.user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const savedJobsCount = 0; // You'll need to implement saved jobs functionality
      const interviewsCount = applications.find(app => app._id === 'shortlisted')?.count || 0;

      stats = {
        applications: applications.reduce((sum, app) => sum + app.count, 0),
        savedJobs: savedJobsCount,
        interviews: interviewsCount,
        profileStrength: calculateProfileStrength(user)
      };
    } else if (req.user.role === 'employer') {
      // Employer stats
      const jobStats = await Job.getJobStats(req.user._id);
      const applicationStats = await Application.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'job'
          }
        },
        { $unwind: '$job' },
        { $match: { 'job.employer': req.user._id } },
        {
          $group: {
            _id: null,
            totalApplications: { $sum: 1 },
            newApplications: {
              $sum: {
                $cond: [{ $eq: ['$status', 'applied'] }, 1, 0]
              }
            }
          }
        }
      ]);

      const statsResult = jobStats[0] || {};
      const appStats = applicationStats[0] || {};

      stats = {
        totalJobs: statsResult.totalJobs || 0,
        activeJobs: statsResult.statusBreakdown?.find(s => s.status === 'active')?.count || 0,
        totalApplications: appStats.totalApplications || 0,
        newApplications: appStats.newApplications || 0
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Error in getUserStats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user statistics',
      error: error.message 
    });
  }
};

// Calculate profile strength for job seeker
const calculateProfileStrength = (user) => {
  if (!user || !user.profile) return 0;

  let strength = 0;
  const profile = user.profile;

  if (profile.title) strength += 20;
  if (profile.skills && profile.skills.length > 0) strength += 20;
  if (profile.experience) strength += 15;
  if (profile.education && profile.education.length > 0) strength += 15;
  if (profile.bio) strength += 10;
  if (profile.location) strength += 10;
  if (profile.resume && profile.resume.url) strength += 10;
  
  // Note: profilePicture is not required for profile strength calculation

  return strength;
};

// Search users (for employers to find candidates)
const searchCandidates = async (req, res) => {
  try {
    const { skills, experience, location, page = 1, limit = 10 } = req.query;

    const matchStage = { 
      role: 'jobseeker', 
      isVerified: true,
      'profile.profilePicture': { $exists: true } // Ensure profilePicture exists
    };

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      matchStage['profile.skills'] = { $in: skillsArray };
    }

    if (experience) {
      matchStage['profile.experience'] = experience;
    }

    if (location) {
      matchStage['profile.location'] = new RegExp(location, 'i');
    }

    const candidates = await User.aggregate([
      { $match: matchStage },
      {
        $project: {
          name: 1,
          email: 1,
          'profile.title': 1,
          'profile.skills': 1,
          'profile.experience': 1,
          'profile.location': 1,
          'profile.bio': 1,
          'profile.resume': 1,
          'profile.profilePicture': 1,
          'profile.profileCompletion': 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    // Ensure profilePicture is always an object in results
    const sanitizedCandidates = candidates.map(candidate => {
      if (candidate.profile && (!candidate.profile.profilePicture || typeof candidate.profile.profilePicture !== 'object')) {
        candidate.profile.profilePicture = { url: '', publicId: '' };
      }
      return candidate;
    });

    const total = await User.countDocuments(matchStage);

    res.json({
      candidates: sanitizedCandidates,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCandidates: total
    });
  } catch (error) {
    console.error('Error in searchCandidates:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete profile picture
const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.profile || !user.profile.profilePicture) {
      return res.status(400).json({ message: 'No profile picture to delete' });
    }

    // Delete from Cloudinary
    if (user.profile.profilePicture.publicId) {
      await deleteFromCloudinary(user.profile.profilePicture.publicId);
    }

    // Set to empty object
    user.profile.profilePicture = { url: '', publicId: '' };
    await user.save();

    res.json({
      message: 'Profile picture deleted successfully',
      profilePicture: user.profile.profilePicture
    });
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadResume,
  getUserStats,
  searchCandidates,
  deleteProfilePicture
};