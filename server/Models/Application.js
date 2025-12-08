const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interviewed', 'hired', 'rejected'],
    default: 'applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resume: {
    type: String,
    default: ''
  },
  favorite: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  notes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
applicationSchema.index({ employer: 1, status: 1 });
applicationSchema.index({ job: 1 });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ employer: 1, job: 1 });
applicationSchema.index({ employer: 1, appliedAt: -1 });

module.exports = mongoose.models.Application || mongoose.model("Application", applicationSchema);