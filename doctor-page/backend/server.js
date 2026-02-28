require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Init Firebase Admin (non-blocking — app starts even if Firebase fails in dev)
  initFirebase();

  // Connect to MongoDB (exits on failure)
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`🚀 MediRx API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`   Health: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`[${signal}] Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

start();
