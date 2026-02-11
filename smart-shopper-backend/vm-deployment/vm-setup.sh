#!/bin/bash
# Azure VM Initial Setup Script
# Run this script once on the Azure VM to prepare it for deployments

set -e

echo "=== Azure VM Setup for Staples Chatbot ==="
echo ""

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully"
else
    echo "Docker Compose already installed"
fi

# Install Azure CLI
echo "Installing Azure CLI..."
if ! command -v az &> /dev/null; then
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    echo "Azure CLI installed successfully"
else
    echo "Azure CLI already installed"
fi

# Install Nginx
echo "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    echo "Nginx installed successfully"
else
    echo "Nginx already installed"
fi

# Install Certbot for SSL (Let's Encrypt)
echo "Installing Certbot for SSL certificates..."
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
    echo "Certbot installed successfully"
else
    echo "Certbot already installed"
fi

# Create deployment directories
echo "Creating deployment directories..."
mkdir -p ~/deployments/staples-chatbot
mkdir -p ~/deployments/staples-chatbot/logs
mkdir -p ~/deployments/other-api
mkdir -p ~/deployments/other-api/logs

# Configure firewall
echo "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
echo "Firewall configured"

# Configure Docker to start on boot
echo "Enabling Docker service..."
sudo systemctl enable docker

# Display versions
echo ""
echo "=== Installation Complete ==="
echo ""
echo "Installed versions:"
docker --version
docker-compose --version
az --version | head -n 1
nginx -v
certbot --version
echo ""
echo "=== Next Steps ==="
echo "1. Copy the nginx configuration: vm-deployment/nginx-config.conf to /etc/nginx/sites-available/"
echo "2. Create symlink: sudo ln -s /etc/nginx/sites-available/staples-apis /etc/nginx/sites-enabled/"
echo "3. Remove default nginx site: sudo rm /etc/nginx/sites-enabled/default"
echo "4. Test nginx config: sudo nginx -t"
echo "5. Reload nginx: sudo systemctl reload nginx"
echo "6. (Optional) Setup SSL with certbot: sudo certbot --nginx"
echo "7. Login to Azure: az login"
echo ""
echo "NOTE: You may need to log out and log back in for Docker group changes to take effect"
