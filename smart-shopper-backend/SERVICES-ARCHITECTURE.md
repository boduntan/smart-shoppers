# 🏗️ Services Architecture Documentation

## 🔧 **Backend Services Overview**

The Staples Smart Shopper Backend consists of 5 core services orchestrated via Docker Compose, each serving a specific purpose in the AI-powered e-commerce platform.

---

## 🏢 **Core Services**

### **1. 🚀 Backend API Service**
- **Container**: `emraay-backend`
- **Technology**: Node.js 18 + Express + TypeScript
- **Port**: 3000
- **Purpose**: Main application server and API gateway
- **Key Functions**:
  - RESTful API endpoints (`/api/products`, `/api/chat`, `/api/faq`)
  - AI chat integration with OpenAI GPT-4o-mini
  - FAQ system with RAG optimization
  - Product catalog management (9,999 products)
  - Session management and authentication
  - Image upload and processing
  - Rate limiting and CORS handling

### **2. 🐘 PostgreSQL Database**
- **Container**: `emraay-postgres`
- **Technology**: PostgreSQL 15 Alpine
- **Port**: 5432
- **Purpose**: Primary relational database for structured data
- **Data Storage**:
  - Products catalog (9,999 Staples Canada items)
  - Chat conversation history and sessions
  - User authentication data
  - Analytics and usage metrics
- **Features**:
  - Connection pooling (21 connections)
  - ACID compliance for data integrity
  - Prisma ORM integration
  - Health monitoring

### **3. 🔴 Redis Cache**
- **Container**: `emraay-redis`
- **Technology**: Redis 7 Alpine
- **Port**: 6379
- **Purpose**: In-memory caching and session store
- **Use Cases**:
  - API response caching for faster queries
  - User session storage
  - Rate limiting data
  - Product search result caching
  - Temporary application state
- **Performance**: Millisecond response times

### **4. 🧠 ChromaDB Vector Database**
- **Container**: `emraay-chroma`
- **Technology**: ChromaDB (Python-based vector database)
- **Port**: 8000
- **Purpose**: Vector embeddings and semantic search
- **Core Functions**:
  - FAQ semantic similarity search for RAG
  - Product description embeddings
  - Conversational context understanding
  - High-dimensional vector storage
- **Features**:
  - Cosine similarity search
  - Persistent vector storage
  - API-first architecture
  - Batch embedding operations

### **5. 🖥️ pgAdmin Database Administration**
- **Container**: `emraay-pgadmin`
- **Technology**: pgAdmin 4 Latest
- **Port**: 5050 (Web UI)
- **Purpose**: PostgreSQL database management interface
- **Capabilities**:
  - Database schema visualization
  - Query execution and performance monitoring
  - Data backup and restore operations
  - User and permission management

---

## 🌐 **External Service Integrations**

### **🤖 OpenAI API**
- **Model**: GPT-4o-mini
- **Purpose**: Conversational AI and natural language processing
- **Integration**: Standard OpenAI + Azure OpenAI support
- **Features**:
  - Multi-turn conversations with context
  - FAQ interpretation and natural responses
  - Product recommendation generation

### **📚 Staples Help Center**
- **Source**: help.staples.ca
- **Purpose**: Live FAQ data source
- **Data**: 10 comprehensive FAQ categories
- **Status**: Verified information integration

---

## 🔄 **Service Communication Flow**

```
Client Request
    ↓
Backend API (Port 3000)
    ├── Authentication & Rate Limiting → Redis (Port 6379)
    ├── FAQ Queries → ChromaDB (Port 8000) → Vector Search
    ├── Product Data → PostgreSQL (Port 5432) → Structured Data
    ├── AI Processing → OpenAI API → GPT-4o-mini
    └── Database Admin → pgAdmin (Port 5050)
```

## 📊 **Service Dependencies**

```
Backend API Service
├── Depends on: PostgreSQL (database operations)
├── Depends on: Redis (caching & sessions)
├── Depends on: ChromaDB (vector search)
└── Integrates with: OpenAI API (AI responses)

pgAdmin Service
└── Connects to: PostgreSQL (administration)
```

---

## 🐳 **Docker Infrastructure**

### **Container Orchestration**
- **Management**: Docker Compose
- **Health Monitoring**: Built-in health checks for all services
- **Restart Policies**: Automatic recovery from failures
- **Volume Persistence**: Data persistence for databases

### **Network Configuration**
- **Internal Network**: Services communicate via Docker internal network
- **External Access**: Only Backend API (3000) and pgAdmin (5050) exposed
- **Security**: Internal service communication isolated from external access

---

## 🚀 **Performance Characteristics**

### **Response Times**
- **FAQ Queries**: < 50ms (cached via Redis)
- **Product Search**: < 100ms (PostgreSQL + cache)
- **Vector Search**: < 100ms (ChromaDB semantic search)
- **AI Chat**: < 2 seconds (OpenAI + context enrichment)

### **Scalability**
- **Concurrent Users**: 1000+ supported
- **Database Connections**: 21-connection pool
- **Caching**: Redis significantly reduces database load
- **Async Processing**: Non-blocking I/O throughout

---

## 🔒 **Security & Reliability**

### **Security Layers**
- **API Rate Limiting**: 100 requests per 15-minute window
- **CORS Protection**: Controlled cross-origin access
- **Environment Variables**: Sensitive configuration isolated
- **Container Isolation**: Services run in isolated Docker containers

### **Reliability Features**
- **Health Check Endpoints**: `/api/health` for system monitoring
- **Graceful Error Handling**: Fallback mechanisms for service failures
- **Data Persistence**: PostgreSQL and ChromaDB with persistent volumes
- **Auto-Recovery**: Container restart policies for fault tolerance

---

**📅 Last Updated**: January 27, 2026  
**🏷️ Version**: 1.6.0  
**🏗️ Services**: 5 Containerized Microservices + External AI Integration
