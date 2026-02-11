# Staples Smart Shopper - Frontend Container

## 🐳 Docker Setup

This directory contains the containerized frontend for the Staples Smart Shopper application.

### Prerequisites

- Docker and Docker Compose installed
- Backend services running at `http://localhost:3000/api`

### Quick Start

1. **Start the container:**
   ```bash
   docker-compose up --build -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:8080
   - Chat widget will appear in bottom-right corner

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Configuration

Environment variables can be configured in `.env`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_MODE=live

# Application Configuration  
VITE_APP_TITLE=Staples Smart Shopper
VITE_APP_LOCALE=en-CA
```

### Architecture

- **Base Image:** Node.js 18 Alpine
- **Build Tool:** Vite + TypeScript
- **Static Server:** `serve` package
- **Port:** 8080 (mapped from internal port 3000)

### Features

- ✅ Containerized React/TypeScript frontend
- ✅ AI-powered shopping assistant
- ✅ Product browsing and search
- ✅ Image upload for product recommendations
- ✅ Conversation memory
- ✅ CORS-compatible with backend API

### Deployment Notes

The container is production-ready and includes:
- Optimized Vite build
- Health checks
- Proper environment variable handling
- Clean static file serving
