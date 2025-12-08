const express = require('express');
const router = express.Router();
const { 
  getJobs, 
  getJob, 
  createJob, 
  deleteJob, 
  getEmployerJobs,
  getSavedJobs,
  removeSavedJob,
  getDashboardStats,
  getRecentApplications,
  getJobPerformance
} = require('../controllers/jobController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');


// Employer dashboard routes
router.get("/dashboard/stats", protect, authorize("employer"), getDashboardStats);
router.get("/dashboard/recent-applications", protect, authorize("employer"), getRecentApplications);
router.get("/dashboard/job-performance", protect, authorize("employer"), getJobPerformance);

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *         - type
 *         - category
 *         - experience
 *         - salary
 *         - applicationDeadline
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         location:
 *           type: string
 *         type:
 *           type: string
 *           enum: [full-time, part-time, contract, internship, remote]
 *         category:
 *           type: string
 *         experience:
 *           type: string
 *           enum: [entry, mid, senior, executive]
 *         salary:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *         applicationDeadline:
 *           type: string
 *           format: date
 */

/**
 * @swagger
 * /api/jobs/getJobs:
 *   get:
 *     summary: Get all jobs with filters
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: experience
 *         schema:
 *           type: string
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of jobs
 */
router.get('/getJobs', getJobs);

/**
 * @swagger
 * /api/jobs/getJob/{id}:
 *   get:
 *     summary: Get a single job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job data
 *       404:
 *         description: Job not found
 */
router.get('/getJob/:id', getJob);

/**
 * @swagger
 * /api/jobs/createJob:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post('/createJob',protect, authorize('employer'), createJob);

/**
 * @swagger
 * /api/jobs/employer/my-jobs:
 *   get:
 *     summary: Get employer's jobs
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employer's jobs
 *       401:
 *         description: Not authenticated
 */
router.get('/employer/my-jobs', protect, authorize('employer'), getEmployerJobs);

router.get('/getJob/:id', getJob);

router.get('/saved-jobs', protect, getSavedJobs);
router.delete('/saved-jobs/:jobId', protect, removeSavedJob);

/**
 * @swagger
 * /api/jobs/deleteJob/{id}:
 *   delete:
 *     summary: Delete a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to delete this job
 */
router.delete('/deleteJob/:id', protect, authorize('employer'), deleteJob);

module.exports = router;