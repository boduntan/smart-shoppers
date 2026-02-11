#!/bin/bash

# 📊 Staples Smart Shopper Database Import Script
# This script imports the exported database with 600 products and AI comparison features

echo "🚀 Starting Staples Smart Shopper Database Import..."
echo "📊 Database: staples_smart_shopper_v2 (600 products)"
echo "✨ Features: AI-powered comparison, 11 categories, normalized data"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if export file exists
if [ ! -f "emraay_smart_shopper_v2_export.sql" ]; then
    if [ -f "emraay_smart_shopper_v2_export.sql.gz" ]; then
        echo "📦 Extracting compressed database export..."
        gunzip emraay_smart_shopper_v2_export.sql.gz
    else
        echo "❌ Error: Database export file not found!"
        echo "Please ensure 'emraay_smart_shopper_v2_export.sql' or 'emraay_smart_shopper_v2_export.sql.gz' exists."
        exit 1
    fi
fi

echo "🐘 Starting PostgreSQL container..."
docker-compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

echo "🗄️  Creating database..."
docker-compose exec -T postgres createdb -U postgres staples_smart_shopper_v2 2>/dev/null || echo "Database already exists, proceeding..."

echo "📥 Importing database from export..."
docker-compose exec -T postgres psql -U postgres -d staples_smart_shopper_v2 < emraay_smart_shopper_v2_export.sql

echo "✅ Database import completed successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Start all services: docker-compose up -d"
echo "2. Test the API: curl http://localhost:3000/api/health"
echo "3. Test comparison: curl -X POST http://localhost:3000/api/frontend/message -H 'Content-Type: application/json' -d '{\"message\": \"compare laptops\"}'"
echo ""
echo "📚 Available Features:"
echo "   • 600 products across 11 categories"
echo "   • AI-powered product comparison"
echo "   • Brand vs brand comparison"
echo "   • Category-specific search"
echo "   • TypeScript-safe API responses"
