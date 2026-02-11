#!/bin/bash

echo "🚀 Starting Staples Smart Shopper Backend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual API keys before continuing!"
    echo "   - OPENAI_API_KEY (required for chat features)"
    echo "   - Other vector search services will use free alternatives"
    read -p "Press enter when you've updated the API keys..."
fi

echo "🔧 Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🗄️  Setting up database..."
docker-compose exec -T backend npm run db:generate
docker-compose exec -T backend npm run db:migrate

echo "✅ Setup complete!"
echo ""
echo "🌐 Service URLs:"
echo "   API: http://localhost:3000"
echo "   Health: http://localhost:3000/api/health"
echo "   pgAdmin: http://localhost:5050 (admin@emraay.com / admin123)"
echo "   ChromaDB: http://localhost:8000"
echo ""
echo "🗄️  Database Connection (for pgAdmin):"
echo "   Host: emraay-postgres"
echo "   Port: 5432"
echo "   Database: staples_smart_shopper"
echo "   Username: postgres"
echo "   Password: postgres123"
echo ""
echo "📝 To view logs: docker-compose logs -f backend"
echo "🛑 To stop: docker-compose down"
