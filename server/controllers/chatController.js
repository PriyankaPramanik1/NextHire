const Message = require('../Models/Message');
const User = require('../Models/User');

// Get conversations for user
const getConversations = async (req, res) => {
  try {
    const conversations = await Message.getConversations(req.user._id);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages between two users
const getMessages = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: recipientId },
        { sender: recipientId, recipient: req.user._id }
      ]
    })
    .populate('sender', 'name profile.profilePicture')
    .populate('recipient', 'name profile.profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      {
        sender: recipientId,
        recipient: req.user._id,
        read: false
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    );

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send message
// In chatController.js
const sendMessage = async (req, res) => {
  try {
    // ✅ Accept both 'recipient' and 'recipientId' for compatibility
    const { recipient, recipientId, content, jobId } = req.body;
    const finalRecipientId = recipientId || recipient;

    if (!finalRecipientId) {
      return res.status(400).json({ 
        success: false,
        message: 'Recipient ID is required' 
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Message content is required' 
      });
    }

    // Check if recipient exists
    const recipientUser = await User.findById(finalRecipientId);
    if (!recipientUser) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipient not found' 
      });
    }

    const message = new Message({
      sender: req.user._id,
      recipient: finalRecipientId,
      content: content.trim(),
      job: jobId
    });

    await message.save();
    
    // Populate sender and recipient details
    await message.populate('sender', 'name profile.profilePicture');
    await message.populate('recipient', 'name profile.profilePicture');

    // Emit socket event if available
    const io = req.app.get('socketio');
    if (io) {
      io.to(finalRecipientId.toString()).emit('receive_message', message);
      io.to(finalRecipientId.toString()).emit('new_message_notification', {
        message: 'You have a new message',
        sender: req.user.name
      });
    }

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send message',
      error: error.message 
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount
};