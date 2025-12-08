const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadResume,
  getUserStats,
  searchCandidates,
  deleteProfilePicture
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProfilePicture: uploadProfilePictureMiddleware, uploadResume: uploadResumeMiddleware } = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', protect, getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               profile:
 *                 type: object
 *               company:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/users/profile/picture:
 *   post:
 *     summary: Upload profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: File upload error
 *       401:
 *         description: Not authenticated
 */
router.post('/profile/picture', protect, uploadProfilePictureMiddleware, uploadProfilePicture);

/**
 * @swagger
 * /api/users/profile/picture:
 *   delete:
 *     summary: Delete profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile picture deleted successfully
 *       400:
 *         description: No profile picture to delete
 *       401:
 *         description: Not authenticated
 */
router.delete('/profile/picture', protect, deleteProfilePicture);

/**
 * @swagger
 * /api/users/profile/resume:
 *   post:
 *     summary: Upload resume
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded successfully
 *       400:
 *         description: File upload error
 *       401:
 *         description: Not authenticated
 */
router.post('/profile/resume', protect, uploadResumeMiddleware, uploadResume);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Not authenticated
 */
router.get('/stats', protect, getUserStats);

/**
 * @swagger
 * /api/users/candidates/search:
 *   get:
 *     summary: Search candidates
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *       - in: query
 *         name: experience
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of candidates
 *       401:
 *         description: Not authenticated
 */
router.get('/candidates/search', protect, authorize('employer'), searchCandidates);

module.exports = router;