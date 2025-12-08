const Job = require('../Models/Job');
const Application = require('../Models/Application');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');



const getDashboardStats = async (req, res) => {
  try {
    const employerId = req.user._id;

    const employerJobs = await Job.find({ employer: employerId }).select('_id');
    const jobIds = employerJobs.map(job => job._id);

    const totalJobs = jobIds.length;

    const totalApplications = await Application.countDocuments({
      job: { $in: jobIds }
    });

    const recentApplications = await Application.countDocuments({
      job: { $in: jobIds },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalJobs,
      totalApplications,
      recentApplications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getRecentApplications = async (req, res) => {
  try {
    const employerId = req.user._id;

    const employerJobs = await Job.find({ employer: employerId }).select('_id');
    const jobIds = employerJobs.map(job => job._id);

    const apps = await Application.find({
      job: { $in: jobIds }
    })
      .populate("job", "title")
      .populate("applicant", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getJobPerformance = async (req, res) => {
  try {
    const employerId = req.user._id;

    const jobs = await Job.aggregate([
      { $match: { employer: employerId } },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "job",
          as: "applications"
        }
      },
      {
        $project: {
          title: 1,
          views: 1,
          totalApplications: { $size: "$applications" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      type,
      category,
      experience,
      minSalary,
      maxSalary,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const matchStage = { status: 'active' };
    
    if (search) {
      matchStage.$text = { $search: search };
    }
    
    if (location) {
      matchStage.location = new RegExp(location, 'i');
    }
    
    if (type) {
      matchStage.type = type;
    }
    
    if (category) {
      matchStage.category = category;
    }
    
    if (experience) {
      matchStage.experience = experience;
    }
    
    if (minSalary || maxSalary) {
      matchStage['salary.min'] = {};
      if (minSalary) matchStage['salary.min'].$gte = parseInt(minSalary);
      if (maxSalary) matchStage['salary.min'].$lte = parseInt(maxSalary);
    }

    const aggregationPipeline = [
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
          description: 1,
          requirements: 1,
          skills: 1,
          location: 1,
          type: 1,
          category: 1,
          experience: 1,
          salary: 1,
          applicationDeadline: 1,
          views: 1,
          applicationsCount: 1,
          createdAt: 1,
          // ✅ CRITICAL: Include employer._id for chat
          'employer._id': 1,
          'employer.name': 1,
          'employer.email': 1,
          'employer.company.name': 1,
          'employer.company.logo': 1,
          'employer.company.description': 1
        }
      },
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ];

    const totalCount = await Job.countDocuments(matchStage);
    const jobs = await Job.aggregate(aggregationPipeline);

    res.json({
      jobs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalJobs: totalCount,
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error in getJobs:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single job with employer details
const getJob = async (req, res) => {
  try {
    const job = await Job.aggregate([
      { $match: { _id: req.params.id } },
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
          description: 1,
          requirements: 1,
          skills: 1,
          location: 1,
          type: 1,
          category: 1,
          experience: 1,
          salary: 1,
          applicationDeadline: 1,
          views: 1,
          applicationsCount: 1,
          'employer._id': 1,
          'employer.name': 1,
          'employer.company.name': 1,
          'employer.company.description': 1,
          'employer.company.logo': 1,
          'employer.company.website': 1,
          createdAt: 1
        }
      }
    ]);

    if (!job.length) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment views
    await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json(job[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Create new job
const createJob = async (req, res) => {
  try {
    const job = new Job({
      ...req.body,
      employer: req.user._id
    });

    await job.save();
    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET saved jobs
const getSavedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedJobs',
        populate: {
          path: 'employer',
          select: 'company'
        }
      });

    res.status(200).json({
      savedJobs: user.savedJobs || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE saved job
const removeSavedJob = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedJobs: req.params.jobId } }
    );

    res.status(200).json({ message: 'Job removed from saved jobs' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete job
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get employer's jobs with statistics
const getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.aggregate([
      { $match: { employer: req.user._id } },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      {
        $project: {
          title: 1,
          status: 1,
          views: 1,
          applicationsCount: 1,
          applicationDeadline: 1,
          createdAt: 1,
          totalApplications: { $size: '$applications' },
          newApplications: {
            $size: {
              $filter: {
                input: '$applications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'applied'] }
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// In jobController.js
exports.getJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user?._id; // If you have user authentication
    
    // MongoDB aggregation pipeline
    const result = await Job.aggregate([
      // Stage 1: Match the job by ID
      { 
        $match: { 
          _id: mongoose.Types.ObjectId(jobId),
          status: 'active' // Only fetch active jobs
        } 
      },
      
      // Stage 2: Lookup employer with company details
      {
        $lookup: {
          from: 'users',
          let: { employerId: '$employer' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$employerId'] } } },
            {
              $lookup: {
                from: 'companies',
                localField: 'company',
                foreignField: '_id',
                as: 'company'
              }
            },
            { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                name: 1,
                email: 1,
                avatar: 1,
                'company.name': 1,
                'company.description': 1,
                'company.website': 1,
                'company.location': 1,
                'company.logo': 1,
                'company.industry': 1,
                'company.size': 1
              }
            }
          ],
          as: 'employer'
        }
      },
      
      // Stage 3: Get similar jobs (optional)
      {
        $lookup: {
          from: 'jobs',
          let: { 
            jobCategory: '$category',
            jobId: '$_id',
            jobExperience: '$experience'
          },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $ne: ['$_id', '$$jobId'] }, // Exclude current job
                    { $eq: ['$category', '$$jobCategory'] }, // Same category
                    { $eq: ['$status', 'active'] }, // Only active
                    { $eq: ['$experience', '$$jobExperience'] } // Same experience level
                  ]
                }
              }
            },
            { $limit: 3 }, // Limit to 3 similar jobs
            {
              $project: {
                title: 1,
                location: 1,
                type: 1,
                salary: 1,
                createdAt: 1
              }
            }
          ],
          as: 'similarJobs'
        }
      },
      
      // Stage 4: Get application count (if needed)
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      
      // Stage 5: Check if user has applied (if authenticated)
      userId ? {
        $lookup: {
          from: 'applications',
          let: { jobId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ['$job', '$$jobId'] },
                    { $eq: ['$applicant', mongoose.Types.ObjectId(userId)] }
                  ]
                }
              }
            },
            { $limit: 1 },
            { $project: { status: 1, appliedAt: 1 } }
          ],
          as: 'userApplication'
        }
      } : { $addFields: { userApplication: [] } },
      
      // Stage 6: Unwind employer array
      { 
        $unwind: {
          path: '$employer',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Stage 7: Unwind userApplication array
      { 
        $unwind: {
          path: '$userApplication',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Stage 8: Add computed fields
      {
        $addFields: {
          applicationsCount: { $size: '$applications' },
          hasApplied: { $gt: [{ $size: { $ifNull: ['$userApplication', []] } }, 0] },
          isRemote: { 
            $cond: {
              if: { $eq: ['$type', 'remote'] },
              then: true,
              else: { $ifNull: ['$remoteAllowed', false] }
            }
          },
          daysSincePosted: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$createdAt'] },
                1000 * 60 * 60 * 24 // Milliseconds in a day
              ]
            }
          }
        }
      },
      
      // Stage 9: Project final structure
      {
        $project: {
          // Job details
          title: 1,
          description: 1,
          location: 1,
          type: 1,
          category: 1,
          experience: 1,
          salary: 1,
          requirements: 1,
          responsibilities: 1,
          skills: 1,
          benefits: 1,
          qualifications: 1,
          applicationDeadline: 1,
          status: 1,
          views: 1,
          createdAt: 1,
          updatedAt: 1,
          
          // Employer details
          employer: 1,
          
          // Statistics
          applicationsCount: 1,
          similarJobs: 1,
          
          // User-specific
          hasApplied: 1,
          userApplication: {
            $cond: {
              if: { $eq: ['$hasApplied', true] },
              then: '$userApplication',
              else: '$$REMOVE'
            }
          },
          
          // Computed fields
          isRemote: 1,
          daysSincePosted: 1,
          
          // URL for sharing (if needed)
          shareUrl: {
            $concat: [
              `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/`,
              { $toString: '$_id' }
            ]
          }
        }
      }
    ]);
    
    // Check if job was found
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or has been removed'
      });
    }
    
    const job = result[0];
    
    // Increment job views asynchronously (don't wait for this to complete)
    Job.updateOne(
      { _id: jobId },
      { $inc: { views: 1 } }
    ).catch(err => console.error('Error incrementing views:', err));
    
    res.status(200).json({
      success: true,
      data: job
    });
    
  } catch (error) {
    console.error('Error fetching job:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



module.exports = {
  getJobPerformance,
  getRecentApplications,
  getDashboardStats,
  getJobs,
  getJob,
  removeSavedJob,
  getSavedJobs,
  createJob,
  getEmployerJobs,
  deleteJob
};
