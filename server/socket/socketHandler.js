const { Server } = require('socket.io');
const Message = require('../Models/Message');
const { verifyToken } = require('../utils/jwtUtils');
const User = require('../Models/User');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected`);

    // Join user to their personal room
    socket.join(socket.userId.toString());

    // Handle joining chat room
    socket.on('join_chat', (data) => {
      const { recipientId } = data;
      const roomId = [socket.userId, recipientId].sort().join('_');
      socket.join(roomId);
      console.log(`User ${socket.user.name} joined room ${roomId}`);
    });

    // Handle sending message
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, content, jobId } = data;

        // Create message in database
        const message = new Message({
          sender: socket.userId,
          recipient: recipientId,
          content,
          job: jobId,
          read: false
        });

        await message.save();

        // Populate sender details
        await message.populate('sender', 'name profile.profilePicture');
        await message.populate('recipient', 'name profile.profilePicture');

        // Create room ID for the conversation
        const roomId = [socket.userId, recipientId].sort().join('_');

        // Emit to both users
        io.to(roomId).emit('receive_message', message);
        io.to(recipientId.toString()).emit('new_message_notification', {
          message: 'You have a new message',
          sender: socket.user.name
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { recipientId } = data;
      const roomId = [socket.userId, recipientId].sort().join('_');
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        name: socket.user.name
      });
    });

    socket.on('typing_stop', (data) => {
      const { recipientId } = data;
      const roomId = [socket.userId, recipientId].sort().join('_');
      socket.to(roomId).emit('user_stop_typing', {
        userId: socket.userId
      });
    });

    // Handle message read status
    socket.on('mark_messages_read', async (data) => {
      try {
        const { senderId } = data;
        await Message.updateMany(
          {
            sender: senderId,
            recipient: socket.userId,
            read: false
          },
          { $set: { read: true } }
        );

        // Notify sender that messages were read
        io.to(senderId.toString()).emit('messages_read', {
          readerId: socket.userId
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };