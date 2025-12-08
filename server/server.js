const app = require('./app');
const connectDB = require('./config/database');
const { initializeSocket } = require('./socket/socketHandler');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const ClIent_PORT =3000;
// Connect to database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`👨‍💼 Local: http://localhost:${ClIent_PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin`);
});

// Initialize Socket.IO
initializeSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(' Unhandled Rejection at:', promise, 'reason:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception thrown:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Process terminated');
  });
});