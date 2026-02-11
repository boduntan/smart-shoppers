#!/bin/bash

echo "🔍 Diagnosing API Routes"
echo "======================="
echo ""

# Get your VM IP
VM_IP="20.220.23.102"

echo "Testing API endpoints on $VM_IP:3000"
echo ""

echo "1️⃣ Testing root endpoint..."
curl -s http://$VM_IP:3000/ | jq '.' 2>/dev/null || curl -s http://$VM_IP:3000/
echo -e "\n"

echo "2️⃣ Testing /api/health..."
curl -s http://$VM_IP:3000/api/health | jq '.' 2>/dev/null || curl -s http://$VM_IP:3000/api/health
echo -e "\n"

echo "3️⃣ Testing /api/health/ (with trailing slash)..."
curl -s http://$VM_IP:3000/api/health/ | jq '.' 2>/dev/null || curl -s http://$VM_IP:3000/api/health/
echo -e "\n"

echo "4️⃣ Testing /api/products..."
curl -s http://$VM_IP:3000/api/products | jq '.' 2>/dev/null || curl -s http://$VM_IP:3000/api/products
echo -e "\n"

echo "5️⃣ Testing /api/faq..."
curl -s http://$VM_IP:3000/api/faq | jq '.' 2>/dev/null || curl -s http://$VM_IP:3000/api/faq
echo -e "\n"

echo "6️⃣ Testing /api/products/search?q=test..."
curl -s "http://$VM_IP:3000/api/products/search?q=test" | jq '.' 2>/dev/null || curl -s "http://$VM_IP:3000/api/products/search?q=test"
echo -e "\n"

echo "✅ Diagnostic complete!"
echo ""
echo "📋 On your VM, check backend logs with:"
echo "   docker compose logs backend --tail 50"
