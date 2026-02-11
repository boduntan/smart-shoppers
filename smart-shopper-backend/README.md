# Staples Smart Shopper Backend

AI-powered shopping assistant backend for Staples Canada built with Node.js, TypeScript, and modern web technologies.

**🎉 Current Status: PRODUCTION READY** ✅  
**📊 Data: 600 curated Staples products with demo database**  
**🤖 AI: OpenAI GPT-4 integration with multilingual support**  
**📚 [Frontend Developer Guide](./FRONTEND-GUIDE.md) | [API Reference](./API-REFERENCE.md)**

## 🚀 Production-Ready Features

### **AI-Powered Product Comparison**
✅ **Category Comparison**: `"compare laptops"` → Returns top laptops with specs  
✅ **Brand Comparison**: `"compare dell and lenovo"` → Cross-brand comparison  
✅ **Brand + Category**: `"compare dell laptop vs lenovo laptop"` → Smart filtering  
✅ **Detailed Specifications**: CPU, RAM, Storage, Screen Size, etc.  
✅ **Price Comparison**: Highlights cost differences  
✅ **TypeScript Safe**: Discriminated union responses  

### **Multilingual Support**
✅ **English**: Native language support  
✅ **French**: `"Bonjour! Montrez-moi des ordinateurs"`  
✅ **Spanish**: `"¡Hola! Muéstrame computadoras"`  
✅ **GPT-4 Native**: Automatic language detection and response  

### **Database & Architecture**
- **AI Chat Assistant**: GPT-4 powered conversational shopping assistant
- **Product Search & Recommendations**: Advanced product matching and filtering
- **Product Comparison Engine**: Multi-criteria comparison with specifications
- **FAQ Integration**: Automated customer support with Staples FAQ
- **Analytics Tracking**: Comprehensive user interaction analytics
- **Microservices Architecture**: Full containerization with Docker Compose

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Search**: Elasticsearch (optional)
- **AI/ML**: OpenAI GPT-4o-mini + Pinecone Vector DB
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- OpenAI API key
- Pinecone account and API key

## 🚀 Quick Start with Demo Database

### **Option 1: Complete Setup with Demo Data (RECOMMENDED)**
```bash
# 1. Clone repository
git clone [repository-url]
cd smart-shopper-backend

# 2. Setup environment
cp .env.example .env
# Edit .env with your actual API keys

# 3. Import demo database (600 curated products)
./import-database.sh

# 4. Start all services
docker-compose up -d --build

# 5. Verify setup
curl http://localhost:3000/api/health

# 6. Test AI chat with product comparison
curl -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{"message": "compare laptops"}'

# 7. Test multilingual support
curl -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Bonjour! Montrez-moi des ordinateurs"}'
```

### **Option 2: Fresh Setup (Empty Database)**

1. **Clone and setup environment**:
```bash
cd /Users/akiaa001/Documents/smart-shopper-backend
cp .env.example .env
# Edit .env with your actual API keys
```

2. **Add your API keys to .env**:
```bash
OPENAI_API_KEY=sk-your-actual-openai-key
PINECONE_API_KEY=your-actual-pinecone-key
PINECONE_ENVIRONMENT=your-pinecone-environment
```

3. **Start all services with Docker Compose**:
```bash
# Build and start all services (PostgreSQL, Redis, Backend API)
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

4. **Initialize empty database**:
```bash
# Generate Prisma client and run migrations
docker-compose exec backend npm run db:generate
docker-compose exec backend npm run db:migrate

# Optional: Seed with sample data
docker-compose exec backend npm run db:seed
```

## 📊 **Demo Database**

**Included Files:**
- `emraay_smart_shopper_v2_export.sql` (274KB) - Full database with 600 products
- `emraay_smart_shopper_v2_export.sql.gz` (28KB) - Compressed version  
- `import-database.sh` - Automated import script

**Database Contents:**
- ✅ **600 Products** - Curated, high-quality Staples dataset  
- ✅ **11 Categories** - Laptop, Printer, Desk, Chair, Monitor, Bag, etc.  
- ✅ **Rich Specifications** - CPU, RAM, Storage, Screen sizes, prices
- ✅ **Normalized Data** - Clean, consistent product information
- ✅ **AI-Ready** - Optimized for comparison and search queries

5. **Access the services**:
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Database Admin (pgAdmin)**: http://localhost:5050
  - Email: admin@staples.com
  - Password: admin123

## 🧪 API Endpoints

### Health & Status
- `GET /api/health` - Service health check

### AI Chat Assistant (MAIN ENDPOINT)
- `POST /api/frontend/message` - Send message to AI assistant
  - **Product Comparison**: `"compare laptops"`
  - **Brand Comparison**: `"compare dell and lenovo"`
  - **Multilingual**: French, Spanish, English support

### Products & Search
- `POST /api/products/search` - Search products
- `GET /api/products/:id` - Get product details
- `POST /api/products/compare` - Compare products
- `POST /api/image-upload` - Image upload for visual search

### Additional Features
- `GET /api/categories` - Product categories
- `POST /api/analytics/event` - Track user interactions

### Analytics
- `POST /api/analytics/event` - Track events

## 📚 **Documentation**

### **For Frontend Developers**
- **📖 [Frontend Guide](./FRONTEND-GUIDE.md)** - Complete API integration guide with examples
- **📋 [API Quick Reference](./API-REFERENCE.md)** - All endpoints with TypeScript types
- **🤖 AI Chat Integration** - Ready-to-use chat components and multilingual examples
- **🚀 [Deployment Ready Guide](./DEPLOYMENT-READY.md)** - Production deployment checklist

### **For Backend Developers**  
- **📝 [Changelog](./CHANGELOG.md)** - Version history and release notes
- **📊 [Current Status](./STATUS.md)** - Project status and achievements  
- **🗺️ [Roadmap](./ROADMAP.md)** - Development roadmap and future features

### **Production Features**
- ✅ **600 Curated products** with rich specifications and metadata
- ✅ **AI Chat with GPT-4** - Real-time product recommendations and comparisons
- ✅ **Multilingual Support** - English, French, Spanish with native responses
- ✅ **Production-ready infrastructure** - Full Docker deployment with demo database
- ✅ **TypeScript Safe APIs** - Complete type definitions for all responses

## �📦 Development Setup (Local)

If you prefer to run locally without Docker:

1. **Install dependencies**:
```bash
npm install
```

2. **Start PostgreSQL and Redis**:
```bash
# Start only the databases
docker-compose up postgres redis -d
```

3. **Setup database**:
```bash
npm run db:generate
npm run db:migrate
```

4. **Start development server**:
```bash
npm run dev
```

## 🗂 Project Structure

```
src/
├── app.ts              # Express app configuration
├── server.ts           # Server entry point
├── config/
│   ├── config.ts       # Environment configuration
│   └── database.ts     # Database connection
├── controllers/        # Route controllers (TODO)
├── services/          # Business logic services (TODO)
├── models/            # Data models (TODO)
├── middleware/
│   ├── errorHandler.ts
│   └── notFoundHandler.ts
├── routes/
│   ├── health.ts       # Health check routes
│   ├── chat.ts         # Chat assistant routes
│   ├── products.ts     # Product routes
│   ├── analytics.ts    # Analytics routes
│   └── faq.ts         # FAQ routes
└── utils/
    └── logger.ts       # Winston logger configuration
```

## 🚢 Deployment

### Production Docker Build
```bash
# Build production image
docker build -t staples-smart-shopper-backend .

# Run with demo database
./import-database.sh
docker-compose up -d

# Or run production container directly
docker run -p 3000:3000 --env-file .env.production staples-smart-shopper-backend
```

### Environment Variables
Create `.env.production` for production deployment:
```bash
# Required API Keys
OPENAI_API_KEY=sk-your-production-openai-key
PINECONE_API_KEY=your-production-pinecone-key
PINECONE_ENVIRONMENT=your-pinecone-environment

# Database
DATABASE_URL=postgresql://user:pass@host:5432/staples_smart_shopper_v2

# Security
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGIN=https://your-frontend-domain.com

# Optional
PORT=3000
NODE_ENV=production
```

## 📊 Database Schema

**Production Database: `staples_smart_shopper_v2`**

Key models with Prisma ORM:
- `Product` - 600 curated products with specifications
- `Category` - 11 product categories (Laptop, Printer, etc.)
- `Conversation` - AI chat conversations and history
- `AnalyticsEvent` - User interaction tracking and metrics

**Demo Database Features:**
- ✅ Normalized product data with rich specifications
- ✅ Consistent pricing and availability information  
- ✅ Optimized for AI comparison and search queries
- ✅ Ready for production deployment

## 🧑‍💻 Development Tasks

### Completed ✅
- [x] Docker Compose setup with all services
- [x] Basic Express.js application structure
- [x] TypeScript configuration
- [x] Database schema design (Prisma)
- [x] Basic route structure
- [x] Health check endpoints
- [x] Error handling middleware
- [x] Logging system

### In Progress 🚧
- [ ] Product data ingestion pipeline
- [ ] OpenAI integration
- [ ] Pinecone vector database setup
- [ ] Chat message processing
- [ ] Product search implementation

### TODO 📝
- [ ] FAQ system implementation
- [ ] Analytics event tracking
- [ ] Product comparison engine
- [ ] Session management
- [ ] Rate limiting enhancements
- [ ] API documentation (Swagger)
- [ ] Unit and integration tests
- [ ] Performance monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Docker build fails**: Ensure Docker is running and you have sufficient disk space
2. **Database connection fails**: Check PostgreSQL is running and DATABASE_URL is correct
3. **API key errors**: Verify your OpenAI and Pinecone keys are valid
4. **Port conflicts**: Ensure ports 3000, 5432, 6379 are available

### Logs
```bash
# View container logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f backend
```

## 📄 License

MIT License - see LICENSE file for details.

## 👨‍💻 Author

**Aanu** - Backend Development Lead
