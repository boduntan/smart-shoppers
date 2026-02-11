import app from './app';
import { config } from './config/config';
import { logger } from './utils/logger';
import { prismaClient } from './config/database';

const startServer = async (): Promise<void> => {
  try {
    // Start the server first so we always respond to health/curl (even if DB is down)
    // Bind to 0.0.0.0 so Docker/external connections can reach it
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`📊 Health check available at http://localhost:${config.port}/api/health`);
      if (config.nodeEnv === 'development') {
        logger.info(`🔍 API Documentation: http://localhost:${config.port}/api/docs`);
        logger.info(`📝 Database Admin (pgAdmin): http://localhost:5050`);
      }
    });

    // Connect to database in background (health endpoint will return 503 if DB is down)
    prismaClient.$connect()
      .then(() => logger.info('Database connected successfully'))
      .catch((err) => logger.warn('Database connection failed (health will return 503):', err.message));

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        try {
          await prismaClient.$disconnect();
          logger.info('Database connection closed');
          logger.info('Server shut down successfully');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
