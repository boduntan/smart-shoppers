#!/bin/bash

# Staples Chatbot Docker Setup Script

echo "🚀 Setting up Staples Omni ChatBot..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << EOF
# API Configuration
# Update this to match your backend service location
VITE_API_BASE_URL=http://localhost:3000
VITE_API_MODE=live

# Application Configuration  
VITE_APP_TITLE=Staples Smart Shopper
VITE_APP_LOCALE=en-CA

# Docker Configuration
COMPOSE_PROJECT_NAME=staples-chatbot
EOF
    echo "✅ .env file created. Please update VITE_API_BASE_URL if needed."
fi

# Build and start the service
echo "🔨 Building and starting chatbot service..."
docker-compose up -d --build

# Wait for service to be healthy
echo "⏳ Waiting for chatbot to be ready..."
sleep 10

# Check service status
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Chatbot is running successfully!"
    echo ""
    echo "🌐 Access Points:"
    echo "   Frontend: http://localhost:8080"
    echo ""
    echo "📋 Useful Commands:"
    echo "   View logs:     docker-compose logs -f"
    echo "   Stop service:  docker-compose down"
    echo "   Restart:       docker-compose restart"
    echo ""
else
    echo "❌ Failed to start chatbot. Check logs with: docker-compose logs"
    exit 1
fi
