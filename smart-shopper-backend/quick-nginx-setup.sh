#!/bin/bash

echo "🌐 Setting up Nginx for Public API Access"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run with sudo: sudo ./quick-nginx-setup.sh"
    exit 1
fi

# Install nginx
echo "1️⃣ Installing nginx..."
apt-get update
apt-get install -y nginx

# Create nginx configuration
echo "2️⃣ Creating nginx configuration..."
cat > /etc/nginx/sites-available/staples-api << 'EOF'
server {
    listen 80;
    server_name _;

    # Logging
    access_log /var/log/nginx/staples-api-access.log;
    error_log /var/log/nginx/staples-api-error.log;

    # Max upload size
    client_max_body_size 10M;

    # API endpoints
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }

    # Root endpoint
    location / {
        return 200 '{"status":"ok","message":"Staples Smart Shopper API","endpoints":{"/api/health":"Health check","/api/products":"Products","/api/chat":"Chat","/api/faq":"FAQ"}}';
        add_header Content-Type application/json;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable the site
echo "3️⃣ Enabling site..."
ln -sf /etc/nginx/sites-available/staples-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "4️⃣ Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration is valid"
    
    # Restart nginx
    echo "5️⃣ Starting nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    echo ""
    echo "✅ Setup Complete!"
    echo ""
    echo "🌐 Your API is now publicly accessible:"
    echo ""
    echo "   Health Check:    http://YOUR-VM-IP/api/health"
    echo "   Products:        http://YOUR-VM-IP/api/products"
    echo "   Search:          http://YOUR-VM-IP/api/products/search?q=laptop"
    echo "   Chat:            http://YOUR-VM-IP/api/chat/simple"
    echo "   FAQ:             http://YOUR-VM-IP/api/faq"
    echo ""
    echo "📝 Test from your local machine:"
    echo "   curl http://YOUR-VM-IP/api/health"
    echo ""
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi
