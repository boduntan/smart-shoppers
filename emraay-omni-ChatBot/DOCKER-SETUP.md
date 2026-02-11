# 🐳 Chatbot Docker Setup

## Quick Start

```bash
# 1. Navigate to chatbot directory
cd emraay-omni-ChatBot

# 2. Run the setup script
./start-chatbot.sh

# 3. Access the application
open http://localhost:8080
```

## Configuration

### Environment Variables

The chatbot uses environment variables for configuration. Update `.env` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000  # Your backend URL
VITE_API_MODE=live                       # 'live' or 'mock'

# Application Configuration  
VITE_APP_TITLE=Staples Smart Shopper
VITE_APP_LOCALE=en-CA
```

### Environment Files

- `.env` - Default configuration
- `.env.local` - Local development (backend running via npm)
- `.env.docker` - Docker environment (backend in Docker)

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check service health
docker-compose ps
```

## Connecting to Backend

### Backend running locally (npm start)
```bash
cp .env.local .env
docker-compose up -d
```

### Backend running in Docker
```bash
cp .env.docker .env
docker-compose up -d
```

## Troubleshooting

### Port conflicts
If port 8080 is in use, update `docker-compose.yml`:
```yaml
ports:
  - "8081:3000"  # Change 8080 to another port
```

### Backend connection issues
1. Check backend is running: `curl http://localhost:3000/health`
2. Update `VITE_API_BASE_URL` in `.env`
3. For Docker backend, use `host.docker.internal:3000`

### Build issues
If the build fails due to Azure Artifacts authentication:
1. Ensure `.npmrc` is present with valid token
2. Or remove the staples-hk dependency temporarily

## Service Information

- **Container Name**: `staples-omni-chatbot`
- **Port**: `8080:3000`
- **Health Check**: `http://localhost:8080/`
- **Network**: `chatbot-network`
