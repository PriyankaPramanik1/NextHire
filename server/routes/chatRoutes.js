const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - recipient
 *         - content
 *       properties:
 *         recipient:
 *           type: string
 *         content:
 *           type: string
 *         job:
 *           type: string
 */

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get user's conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *       401:
 *         description: Not authenticated
 */
router.get('/conversations', protect, getConversations);

/**
 * @swagger
 * /api/chat/messages/{recipientId}:
 *   get:
 *     summary: Get messages between users
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
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
 *         description: List of messages
 *       401:
 *         description: Not authenticated
 */
router.get('/messages/:recipientId', protect, getMessages);

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Send a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post('/send', protect, sendMessage);

/**
 * @swagger
 * /api/chat/unread-count:
 *   get:
 *     summary: Get unread message count
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message count
 *       401:
 *         description: Not authenticated
 */
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;