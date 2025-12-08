const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.fieldname === 'resume') {
    // Allow PDF, DOC, DOCX for resumes
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes'), false);
    }
  } else if (file.fieldname === 'profilePicture' || file.fieldname === 'logo') {
    // Allow images for profile pictures and logos
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and GIF images are allowed'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Configure upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware for different upload types
const uploadResume = upload.single('resume');
const uploadProfilePicture = upload.single('profilePicture');
const uploadCompanyLogo = upload.single('logo');

module.exports = {
  uploadResume,
  uploadProfilePicture,
  uploadCompanyLogo
};