import { Router } from 'express';
import { prismaClient } from '../config/database';

const router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await prismaClient.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service is unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Database health check
router.get('/db', async (req, res) => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
