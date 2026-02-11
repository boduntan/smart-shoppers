import { PrismaClient } from '@prisma/client';
import { config } from './config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
  log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Do not connect or exit here - server.ts connects in background so the HTTP server can start first
export const prismaClient = prisma;
export default prisma;
