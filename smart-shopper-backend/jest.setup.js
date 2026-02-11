// Jest setup file for environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.OPENAI_API_KEY = 'test-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.CHROMA_URL = 'http://localhost:8000';
process.env.REDIS_URL = 'redis://localhost:6379';
