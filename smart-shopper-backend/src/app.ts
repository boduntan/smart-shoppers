import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { prismaClient } from './config/database';

// Routes
import chatSimpleRoutes from './routes/chat-simple';
// import searchBasicRoutes from './routes/search-basic';
// import chatEnhancedRoutes from './routes/chat-enhanced';
// import searchRoutes from './routes/search';
// import chatRoutes from './routes/chat';  // Temporarily disabled due to TypeScript issues
import productRoutes from './routes/products';
import analyticsRoutes from './routes/analytics';
import faqRoutes from './routes/faq';
import healthRoutes from './routes/health';

// NEW ROUTES FOR FRONTEND COMPATIBILITY
import chatConversationRoutes from './routes/chat-conversation';
import imageUploadRoutes from './routes/image-upload';
import frontendRoutes from './routes/frontend';
import categoriesRoutes from './routes/categories';

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware - configure helmet to allow cross-origin image loading
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', '*'],  // Allow images from any source
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// CORS configuration - allow specific localhost origins
const allowedOrigins = [
  'https://localhost:3001',
  'https://localhost:3002',
  'https://localhost:3003',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003'
];

// Add custom CORS_ORIGIN if provided in environment
if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*') {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()));
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or if CORS_ORIGIN is set to '*'
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression() as any);

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Logging middleware
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatSimpleRoutes);
// app.use('/api/search', searchBasicRoutes);
// app.use('/api/chat', chatEnhancedRoutes);
// app.use('/api/search', searchRoutes);
// Mount categories first so /api/products/category/:name and /api/products/categories/list are matched
app.use('/api/products', categoriesRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/faq', faqRoutes);

// NEW ROUTES FOR FRONTEND COMPATIBILITY - CONVERSATION & IMAGE ENABLED
app.use('/api/chat', chatConversationRoutes);
app.use('/api/upload', imageUploadRoutes);
app.use('/api/frontend', frontendRoutes);

// Error handling middleware (order matters: 404 handler must come before error handler)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prismaClient.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prismaClient.$disconnect();
  process.exit(0);
});

export default app;
