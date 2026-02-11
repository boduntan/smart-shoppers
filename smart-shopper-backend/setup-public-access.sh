#!/bin/bash

echo "🌐 Setting up Public Access for Staples Smart Shopper"
echo "======================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Install nginx if not installed
echo "1️⃣ Installing nginx..."
apt-get update
apt-get install -y nginx

# Backup existing nginx config
if [ -f /etc/nginx/sites-available/emraay-chatbot ]; then
    echo "📋 Backing up existing config..."
    cp /etc/nginx/sites-available/emraay-chatbot /etc/nginx/sites-available/emraay-chatbot.backup.$(date +%Y%m%d_%H%M%S)
fi

# Get server IP or hostname
echo ""
read -p "Enter your server's public IP or domain name (e.g., 20.123.45.67 or chat.staples.com): " SERVER_NAME

# Create nginx configuration
echo "2️⃣ Creating nginx configuration..."
cat > /etc/nginx/sites-available/emraay-chatbot << EOF
# Emraay Smart Shopper API - Nginx Configuration
upstream emraay_backend {
    server localhost:3000;
}

# HTTP Server - Redirect to HTTPS (optional, comment out if no SSL)
# server {
#     listen 80;
#     server_name ${SERVER_NAME};
#     return 301 https://\$host\$request_uri;
# }

# Main Server Configuration
server {
    listen 80;
    # listen 443 ssl http2;  # Uncomment for HTTPS
    server_name ${SERVER_NAME};

    # SSL Configuration (uncomment and configure if you have SSL certificates)
    # ssl_certificate /etc/ssl/certs/your-cert.crt;
    # ssl_certificate_key /etc/ssl/private/your-key.key;
    # ssl_protocols TLSv1.2 TLSv1.3;
    # ssl_ciphers HIGH:!aNULL:!MD5;

    # Logging
    access_log /var/log/nginx/emraay-chatbot-access.log;
    error_log /var/log/nginx/emraay-chatbot-error.log;

    # Max upload size for images
    client_max_body_size 10M;

    # API Endpoints
    location /api {
        proxy_pass http://emraay_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://emraay_backend/api/health;
        access_log off;
    }

    # Root path
    location / {
        return 200 '{"status":"ok","message":"Emraay Smart Shopper API","version":"1.0.0","endpoints":{"/api/health":"Health check","/api/products":"Product search","/api/chat":"Chat interface","/api/faq":"FAQ","/pgadmin":"Database management"}}';
        add_header Content-Type application/json;
    }

    # pgAdmin - accessible via /pgadmin path
    location /pgadmin/ {
        proxy_pass http://pgadmin/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Script-Name /pgadmin;
        
        # Required for pgAdmin
        proxy_redirect off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# pgAdmin - Accessible via /pgadmin path (more secure than exposing port 5050)
# This makes pgAdmin available at http://YOUR-IP/pgadmin
# Alternatively, open port 5050 in Azure NSG to access directly
upstream pgadmin {
    server localhost:5050;
}

# Uncomment this section if you want pgAdmin on a separate port
# server {
#     listen 5050;
#     server_name ${SERVER_NAME};
#     
#     location / {
#         proxy_pass http://pgadmin;
#         proxy_set_header Host \$host;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#     }
# }
EOF

# Enable the site
echo "3️⃣ Enabling site..."
ln -sf /etc/nginx/sites-available/emraay-chatbot /etc/nginx/sites-enabled/

# Remove default nginx site if exists
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "4️⃣ Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Restart nginx
    echo "5️⃣ Restarting nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    echo ""
    echo "✅ Setup Complete!"
    echo ""
    echo "🌐 Your API is now publicly accessible at:"
    echo "   http://${SERVER_NAME}/api/health"
    echo "   http://${SERVER_NAME}/api/products"
    echo "   http://${SERVER_NAME}/api/chat"
    echo ""
    echo "🔧 pgAdmin (database management):"
    echo "   http://${SERVER_NAME}:5050"
    echo ""
    echo "🔒 Next Steps for Production:"
    echo "   1. Install SSL certificate (Let's Encrypt recommended)"
    echo "   2. Configure firewall (UFW):"
    echo "      sudo ufw allow 80/tcp"
    echo "      sudo ufw allow 443/tcp"
    echo "      sudo ufw enable"
    echo "   3. Set up rate limiting in nginx"
    echo "   4. Configure monitoring (optional)"
    echo ""
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the error messages above"
    exit 1
fi
