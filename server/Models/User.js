const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['jobseeker', 'employer', 'admin'],
    default: 'jobseeker',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // Job Seeker specific fields
  profile: {
    title: String,
    skills: [String],
    experience: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'executive']
    },
    education: [{
      institution: String,
      degree: String,
      field: String,
      year: Number
    }],
    resume: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }
    },
    profilePicture: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }
    },
    bio: String,
    location: String,
    phone: String
  },

  // Employer specific fields
  company: {
    name: String,
    description: String,
    website: String,
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    industry: String,
    founded: Number
  },
  savedJobs: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }
]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to ensure profilePicture and resume are always objects
userSchema.pre('save', function (next) {
  // Ensure profile exists
  if (!this.profile) {
    this.profile = {};
  }

  // Ensure profilePicture is an object
  if (!this.profile.profilePicture || typeof this.profile.profilePicture !== 'object') {
    this.profile.profilePicture = { url: '', publicId: '' };
  }

  // Ensure resume is an object
  if (!this.profile.resume || typeof this.profile.resume !== 'object') {
    this.profile.resume = { url: '', publicId: '' };
  }

  // Ensure company exists if user is employer
  if (this.role === 'employer' && !this.company) {
    this.company = {};
  }

  // Ensure company.logo is an object
  if (this.company && (!this.company.logo || typeof this.company.logo !== 'object')) {
    this.company.logo = { url: '', publicId: '' };
  }

  next();
});

// Middleware to fix data after init (when loading from database)
userSchema.post('init', function (doc) {
  if (doc.profile) {
    if (!doc.profile.profilePicture || typeof doc.profile.profilePicture !== 'object') {
      doc.profile.profilePicture = { url: '', publicId: '' };
    }
    if (!doc.profile.resume || typeof doc.profile.resume !== 'object') {
      doc.profile.resume = { url: '', publicId: '' };
    }
  }
  if (doc.company && (!doc.company.logo || typeof doc.company.logo !== 'object')) {
    doc.company.logo = { url: '', publicId: '' };
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// MongoDB aggregation for user statistics
userSchema.statics.getUserStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        verified: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        },
        recent: {
          $sum: {
            $cond: [
              { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
              1, 0
            ]
          }
        }
      }
    }
  ]);
};

// Virtual for getting profile completion percentage
userSchema.virtual('profileCompletion').get(function () {
  if (!this.profile) return 0;

  let completion = 0;
  const fields = [
    'title', 'skills', 'experience', 'education', 'bio',
    'location', 'resume', 'profilePicture'
  ];

  fields.forEach(field => {
    if (field === 'skills' && this.profile.skills && this.profile.skills.length > 0) {
      completion += 12.5;
    } else if (field === 'education' && this.profile.education && this.profile.education.length > 0) {
      completion += 12.5;
    } else if (field === 'resume' && this.profile.resume && this.profile.resume.url) {
      completion += 12.5;
    } else if (field === 'profilePicture' && this.profile.profilePicture && this.profile.profilePicture.url) {
      completion += 12.5;
    } else if (this.profile[field]) {
      completion += 12.5;
    }
  });

  return Math.min(100, completion);
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);