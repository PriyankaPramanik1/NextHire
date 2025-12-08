// controllers/applicationController.js
const Application = require('../Models/Application');
const Job = require('../Models/Job');
const User = require('../Models/User');
const mongoose = require('mongoose');

// Get employer applications with aggregation (using lookup instead of populate)
exports.getEmployerApplications = async (req, res) => {
  try {
    const employerId = req.user.id;
    
    if (!employerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { page = 1, limit = 10, status, jobId, search } = req.query;
    const skip = (page - 1) * limit;

    // Build match query
    const matchStage = { employer: new mongoose.Types.ObjectId(employerId) };
    
    if (status && status !== 'all') {
      matchStage.status = status;
    }
    
    if (jobId && jobId !== 'all') {
      matchStage.job = new mongoose.Types.ObjectId(jobId);
    }

    // Aggregation pipeline
    const aggregationPipeline = [
      { $match: matchStage },
      
      // Lookup job details
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'job'
        }
      },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
      
      // Lookup applicant details
      {
        $lookup: {
          from: 'users',
          localField: 'applicant',
          foreignField: '_id',
          as: 'applicant'
        }
      },
      { $unwind: { path: '$applicant', preserveNullAndEmptyArrays: true } },
      
      // Filter by search term if provided
      ...(search ? [{
        $match: {
          $or: [
            { 'applicant.name': { $regex: search, $options: 'i' } },
            { 'applicant.email': { $regex: search, $options: 'i' } },
            { 'job.title': { $regex: search, $options: 'i' } },
            { 'applicant.profile.skills': { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),
      
      // Sort by applied date (newest first)
      { $sort: { appliedAt: -1 } },
      
      // Add total count
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: parseInt(skip) },
            { $limit: parseInt(limit) },
            // Project only needed fields
            {
              $project: {
                _id: 1,
                status: 1,
                appliedAt: 1,
                updatedAt: 1,
                coverLetter: 1,
                resume: 1,
                favorite: 1,
                notes: 1,
                rating: 1,
                // Job fields
                'job._id': 1,
                'job.title': 1,
                'job.location': 1,
                'job.type': 1,
                'job.salary': 1,
                'job.department': 1,
                // Applicant fields
                'applicant._id': 1,
                'applicant.name': 1,
                'applicant.email': 1,
                'applicant.profile.title': 1,
                'applicant.profile.skills': 1,
                'applicant.profile.experience': 1,
                'applicant.profile.location': 1,
                'applicant.profile.phone': 1,
                'applicant.profile.resume': 1,
                'applicant.profile.profilePicture': 1,
                'applicant.profile.education': 1,
                'applicant.profile.linkedin': 1,
                'applicant.profile.github': 1,
                'applicant.profile.website': 1
              }
            }
          ]
        }
      },
      // Reshape the output
      {
        $project: {
          applications: '$data',
          total: { $arrayElemAt: ['$metadata.total', 0] }
        }
      }
    ];

    const result = await Application.aggregate(aggregationPipeline);
    
    const applications = result[0]?.applications || [];
    const total = result[0]?.total || 0;

    res.status(200).json({
      success: true,
      applications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      hasMore: (page * limit) < total
    });
  } catch (error) {
    console.error('Error fetching employer applications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get single application details for employer
exports.getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const employerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid application ID' 
      });
    }

    const aggregationPipeline = [
      {
        $match: { 
          _id: new mongoose.Types.ObjectId(applicationId),
          employer: new mongoose.Types.ObjectId(employerId)
        }
      },
      
      // Lookup job details
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'job'
        }
      },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
      
      // Lookup applicant details
      {
        $lookup: {
          from: 'users',
          localField: 'applicant',
          foreignField: '_id',
          as: 'applicant'
        }
      },
      { $unwind: { path: '$applicant', preserveNullAndEmptyArrays: true } },
      
      // Project only needed fields
      {
        $project: {
          _id: 1,
          status: 1,
          appliedAt: 1,
          updatedAt: 1,
          coverLetter: 1,
          resume: 1,
          favorite: 1,
          rating: 1,
          notes: 1,
          // Job details
          'job._id': 1,
          'job.title': 1,
          'job.location': 1,
          'job.type': 1,
          'job.salary': 1,
          'job.department': 1,
          'job.description': 1,
          'job.requirements': 1,
          'job.skills': 1,
          'job.experience': 1,
          'job.applicationDeadline': 1,
          // Applicant details
          'applicant._id': 1,
          'applicant.name': 1,
          'applicant.email': 1,
          'applicant.profile.title': 1,
          'applicant.profile.bio': 1,
          'applicant.profile.skills': 1,
          'applicant.profile.experience': 1,
          'applicant.profile.location': 1,
          'applicant.profile.phone': 1,
          'applicant.profile.resume': 1,
          'applicant.profile.profilePicture': 1,
          'applicant.profile.education': 1,
          'applicant.profile.linkedin': 1,
          'applicant.profile.github': 1,
          'applicant.profile.website': 1
        }
      }
    ];

    const result = await Application.aggregate(aggregationPipeline);
    
    if (!result || result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found or unauthorized' 
      });
    }

    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const employerId = req.user.id;

    // First verify ownership
    const application = await Application.findOne({
      _id: id,
      employer: employerId
    });

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found or unauthorized' 
      });
    }

    // Update status
    application.status = status;
    
    // Add note if provided
    if (note) {
      application.notes = application.notes || [];
      application.notes.push({
        note,
        addedBy: employerId,
        addedAt: new Date()
      });
    }

    application.updatedAt = new Date();
    await application.save();

    // Get updated application with populated data
    const updatedApp = await Application.aggregate([
      {
        $match: { _id: application._id }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'job'
        }
      },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'applicant',
          foreignField: '_id',
          as: 'applicant'
        }
      },
      { $unwind: { path: '$applicant', preserveNullAndEmptyArrays: true } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: updatedApp[0]
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get employer stats
exports.getEmployerStats = async (req, res) => {
  try {
    const employerId = new mongoose.Types.ObjectId(req.user.id);

    // Get job IDs for this employer
    const employerJobs = await Job.find({ employer: employerId }).select('_id');
    const jobIds = employerJobs.map(job => job._id);

    // Get application stats
    const statsAggregation = await Application.aggregate([
      {
        $match: { job: { $in: jobIds } }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate totals
    const total = await Application.countDocuments({ job: { $in: jobIds } });
    
    // Format stats
    const stats = {
      total,
      applied: 0,
      shortlisted: 0,
      interviewed: 0,
      hired: 0,
      rejected: 0
    };

    statsAggregation.forEach(item => {
      if (stats.hasOwnProperty(item._id)) {
        stats[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching employer stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Add note to application
exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const employerId = req.user.id;

    if (!note || !note.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Note content is required' 
      });
    }

    const application = await Application.findOneAndUpdate(
      { _id: id, employer: employerId },
      {
        $push: {
          notes: {
            note: note.trim(),
            addedBy: employerId,
            addedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found or unauthorized' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      note: application.notes[application.notes.length - 1]
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Toggle favorite status
exports.toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { favorite } = req.body;
    const employerId = req.user.id;

    const application = await Application.findOneAndUpdate(
      { _id: id, employer: employerId },
      { $set: { favorite: favorite } },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found or unauthorized' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Favorite status updated',
      favorite: application.favorite
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update rating
exports.updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const employerId = req.user.id;

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 0 and 5' 
      });
    }

    const application = await Application.findOneAndUpdate(
      { _id: id, employer: employerId },
      { $set: { rating: rating } },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found or unauthorized' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      rating: application.rating
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get jobs for filter dropdown
exports.getEmployerJobs = async (req, res) => {
  try {
    const employerId = req.user.id;
    
    const jobs = await Job.find({ employer: employerId })
      .select('_id title location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};
// Apply for a job
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const applicantId = req.user.id;

    // Validate job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: applicantId
    });
    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'Already applied' });
    }

    const application = await Application.create({
      job: jobId,
      applicant: applicantId,
      employer: job.employer,
      coverLetter
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get jobseeker's applications
exports.getApplications = async (req, res) => {
  try {
    const applicantId = req.user.id;

    const applications = await Application.find({ applicant: applicantId })
      .populate('job', '_id title location type salary department')
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
// controllers/applicationController.js

// Apply for a job (jobseeker)
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const applicantId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const existingApplication = await Application.findOne({ job: jobId, applicant: applicantId });
    if (existingApplication)
      return res.status(400).json({ success: false, message: 'Already applied' });

    const application = await Application.create({
      job: jobId,
      applicant: applicantId,
      employer: job.employer,
      coverLetter,
    });

    res.status(201).json({ success: true, message: 'Applied successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get all applications of logged-in jobseeker
exports.getApplications = async (req, res) => {
  try {
    const applicantId = req.user.id;
    const applications = await Application.find({ applicant: applicantId })
      .populate('job', '_id title location type salary department')
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get application stats for jobseeker
exports.getApplicationStats = async (req, res) => {
  try {
    const applicantId = req.user.id;

    const total = await Application.countDocuments({ applicant: applicantId });
    const statsAggregation = await Application.aggregate([
      { $match: { applicant: new mongoose.Types.ObjectId(applicantId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats = { total, applied: 0, shortlisted: 0, interviewed: 0, hired: 0, rejected: 0 };
    statsAggregation.forEach(item => { if (stats[item._id] !== undefined) stats[item._id] = item.count; });

    res.status(200).json({ success: true, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Download resume (both employer & applicant)
exports.downloadResume = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate('applicant');

    if (!application || !application.resume)
      return res.status(404).json({ success: false, message: 'Resume not found' });

    // Assuming resume stored as file path
    const filePath = application.resume; 
    res.download(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
