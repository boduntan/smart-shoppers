import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  elasticsearchUrl: string;
  chromaUrl: string;
  
  // OpenAI Configuration
  openaiApiKey: string;
  openaiModel: string;
  openaiMaxTokens: number;
  openaiTemperature: number;
  
  // Azure OpenAI Configuration
  azureOpenaiApiKey: string;
  azureOpenaiEndpoint: string;
  azureOpenaiDeploymentName: string;
  azureOpenaiApiVersion: string;
  
  // Pinecone Configuration
  pineconeApiKey: string;
  pineconeEnvironment: string;
  pineconeIndexName: string;
  
  // JWT Configuration
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // Logging
  logLevel: string;
  
  // Analytics
  analyticsEnabled: boolean;
  
  // File Upload
  maxFileSize: number;
  uploadPath: string;
  
  // Staples API
  staplesApiBaseUrl: string;
  staplesApiKey: string;
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/staples_smart_shopper',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiMaxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
  openaiTemperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  
  // Azure OpenAI
  azureOpenaiApiKey: process.env.AZURE_OPENAI_API_KEY || '',
  azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
  azureOpenaiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '',
  azureOpenaiApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  
  // Pinecone
  pineconeApiKey: process.env.PINECONE_API_KEY || '',
  pineconeEnvironment: process.env.PINECONE_ENVIRONMENT || '',
  pineconeIndexName: process.env.PINECONE_INDEX_NAME || 'staples-products',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Analytics
  analyticsEnabled: process.env.ANALYTICS_ENABLED === 'true',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  
  // Staples API
  staplesApiBaseUrl: process.env.STAPLES_API_BASE_URL || '',
  staplesApiKey: process.env.STAPLES_API_KEY || '',
};

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push('PINECONE_API_KEY', 'PINECONE_ENVIRONMENT');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}
