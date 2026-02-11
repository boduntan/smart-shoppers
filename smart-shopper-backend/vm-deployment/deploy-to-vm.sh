#!/bin/bash
set -e

# VM Deployment Script for Staples Chatbot
# This script deploys the Docker container to an Azure VM

echo "Starting deployment to Azure VM..."

# Configuration from environment variables
VM_HOST="${VM_HOST}"
VM_USER="${VM_USER}"
VM_SSH_KEY="${VM_SSH_KEY_PATH:-$HOME/.ssh/id_rsa}"
APP_NAME="${APP_NAME:-staples-chatbot}"
APP_PORT="${APP_PORT:-3001}"
DOCKER_IMAGE="${DOCKER_IMAGE}"
DOCKER_TAG="${DOCKER_TAG}"
CONTAINER_NAME="${CONTAINER_NAME:-staples-chatbot-api}"

# Create deployment directory on VM
echo "Preparing deployment directory on VM..."
ssh -i "$VM_SSH_KEY" -o StrictHostKeyChecking=no "$VM_USER@$VM_HOST" << 'ENDSSH'
    mkdir -p ~/deployments/staples-chatbot
    mkdir -p ~/deployments/staples-chatbot/logs
ENDSSH

# Copy environment file to VM
echo "Copying environment configuration to VM..."
scp -i "$VM_SSH_KEY" -o StrictHostKeyChecking=no .env "$VM_USER@$VM_HOST:~/deployments/staples-chatbot/.env"

# Deploy Docker container on VM
echo "Deploying Docker container on VM..."
ssh -i "$VM_SSH_KEY" -o StrictHostKeyChecking=no "$VM_USER@$VM_HOST" << ENDSSH
    # Login to Azure Container Registry
    echo "Logging into ACR..."
    az acr login --name ${ACR_NAME}
    
    # Pull the latest image
    echo "Pulling Docker image: ${DOCKER_IMAGE}:${DOCKER_TAG}"
    docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}
    
    # Stop and remove existing container if it exists
    echo "Stopping existing container if any..."
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    
    # Run new container
    echo "Starting new container..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        -p 127.0.0.1:${APP_PORT}:3000 \
        --env-file ~/deployments/staples-chatbot/.env \
        -v ~/deployments/staples-chatbot/logs:/app/logs \
        ${DOCKER_IMAGE}:${DOCKER_TAG}
    
    # Check container status
    echo "Container status:"
    docker ps | grep ${CONTAINER_NAME}
    
    # Wait for application to start
    echo "Waiting for application to start..."
    sleep 10
    
    # Health check
    echo "Performing health check..."
    curl -f http://localhost:${APP_PORT}/api/health || echo "Health check failed - please verify manually"
    
    # Clean up old images (keep last 3)
    echo "Cleaning up old Docker images..."
    docker images ${DOCKER_IMAGE} --format "{{.ID}} {{.CreatedAt}}" | sort -rk 2 | awk 'NR>3 {print \$1}' | xargs -r docker rmi || true
ENDSSH

echo "Deployment completed successfully!"
echo "Application is running on http://${VM_HOST}:${APP_PORT}"
echo "Check logs with: ssh ${VM_USER}@${VM_HOST} 'docker logs ${CONTAINER_NAME}'"
