const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  skills: [String],
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  salary: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  experience: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    required: true
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  applicationsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// MongoDB aggregation for job statistics
jobSchema.statics.getJobStats = async function(employerId = null) {
  const matchStage = employerId ? { employer: new mongoose.Types.ObjectId(employerId) } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalApplications: { $sum: '$applicationsCount' },
        avgSalary: { $avg: { $avg: ['$salary.min', '$salary.max'] } }
      }
    },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: '$count' },
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        },
        overallStats: {
          $push: {
            totalViews: '$totalViews',
            totalApplications: '$totalApplications',
            avgSalary: '$avgSalary'
          }
        }
      }
    }
  ]);
};

// Text search index
jobSchema.index({
  title: 'text',
  description: 'text',
  skills: 'text',
  category: 'text'
});

module.exports = mongoose.models.Job || mongoose.model("Job", jobSchema);
