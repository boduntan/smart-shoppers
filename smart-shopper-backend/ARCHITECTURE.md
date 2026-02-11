# 🏗️ Staples Smart Shopper Backend - Architecture Documentation

## 📋 **System Overview**

The Staples Smart Shopper Backend is a microservices-based AI-powered e-commerce platform built with Node.js, TypeScript, and Docker. It provides intelligent product recommendations, conversational AI chat, and comprehensive FAQ management through a RAG-optimized system.

---

## 🏢 **Service Architecture**

### **Core Application Services**

#### **1. 🚀 Backend API Service (Node.js + Express + TypeScript)**
- **Purpose**: Main application server handling all API requests
- **Port**: 3000
- **Technology Stack**: 
  - Node.js 18+ with TypeScript
  - Express.js framework
  - Prisma ORM for database operations
  - OpenAI SDK for AI integration
- **Key Features**:
  - RESTful API endpoints
  - AI-powered chat system
  - Product catalog management
  - FAQ system with RAG optimization
  - Image upload and processing
  - Session management
  - Authentication and authorization
  - Rate limiting and CORS
  - Comprehensive logging

#### **2. 🐘 PostgreSQL Database**
- **Purpose**: Primary relational database for structured data storage
- **Port**: 5432
- **Technology**: PostgreSQL 15 Alpine
- **Data Storage**:
  - **Products Table**: 9,999 Staples Canada products with metadata
  - **ChatMessage Table**: Conversation history with session management
  - **User Sessions**: Authentication and session persistence
  - **Analytics Data**: Usage metrics and performance data
- **Features**:
  - ACID compliance for data integrity
  - Connection pooling (21 connections)
  - Automated migrations with Prisma
  - Health monitoring and backup support

#### **3. 🔴 Redis Cache Service**
- **Purpose**: In-memory caching and session store
- **Port**: 6379
- **Technology**: Redis 7 Alpine
- **Use Cases**:
  - **API Response Caching**: Fast retrieval of frequent queries
  - **Session Storage**: User authentication sessions
  - **Rate Limiting**: API request throttling data
  - **Temporary Data**: Short-lived application state
  - **Product Search Cache**: Optimized product lookup results
- **Features**:
  - Millisecond response times
  - Automatic expiration policies
  - Memory optimization
  - Cluster-ready configuration

#### **4. 🧠 ChromaDB Vector Database**
- **Purpose**: Vector embeddings and semantic search engine
- **Port**: 8000
- **Technology**: ChromaDB (Python-based)
- **Core Functions**:
  - **FAQ Vector Search**: Semantic similarity matching for intelligent FAQ retrieval
  - **Product Embeddings**: Vector representations of product descriptions
  - **Conversational Context**: Semantic understanding of user queries
  - **RAG Pipeline**: Retrieval-Augmented Generation for enhanced AI responses
- **Features**:
  - High-dimensional vector storage
  - Cosine similarity search
  - Batch embedding operations
  - Persistent storage for embeddings
  - API-first architecture

---

## 🔧 **Administrative & Monitoring Services**

#### **5. 🖥️ pgAdmin Database Administration**
- **Purpose**: PostgreSQL database management interface
- **Port**: 5050 (Web UI)
- **Technology**: pgAdmin 4 Latest
- **Capabilities**:
  - Database schema visualization
  - Query execution and optimization
  - Performance monitoring
  - Data backup and restore
  - User and permission management
  - Real-time connection monitoring

---

## 🌐 **External Service Integrations**

### **AI & Machine Learning**

#### **🤖 OpenAI API Integration**
- **Service**: GPT-4o-mini model
- **Purpose**: Conversational AI and natural language processing
- **Features**:
  - Multi-turn conversation support
  - Context-aware responses
  - Product recommendation generation
  - FAQ interpretation and natural responses
  - Dual support: Standard OpenAI + Azure OpenAI

#### **📚 Staples Help Center Integration**
- **Source**: help.staples.ca
- **Purpose**: Live FAQ data with verified information
- **Data Points**: 10 comprehensive FAQ categories
- **Update Mechanism**: Ready for automated scraping

---

## 🗂️ **Data Flow Architecture**

### **Request Processing Pipeline**

```
1. Client Request → API Gateway (Express.js)
2. Authentication & Rate Limiting (Redis)
3. Business Logic Processing (Services Layer)
4. Data Retrieval Strategy:
   ├── FAQ Queries → ChromaDB (Vector Search)
   ├── Product Queries → PostgreSQL + Redis Cache
   ├── Chat Context → PostgreSQL (History) + ChromaDB (Semantic)
   └── AI Processing → OpenAI API + Local Context
5. Response Formation & Caching
6. Client Response
```

### **AI Chat Flow**

```
User Message → FAQ Context Lookup (ChromaDB) → Product Context (PostgreSQL) 
             → OpenAI GPT-4o-mini → Natural Language Response
```

### **RAG (Retrieval-Augmented Generation) Pipeline**

```
Query → Vector Embedding → ChromaDB Similarity Search → Context Enrichment 
      → OpenAI Prompt Engineering → Enhanced AI Response
```

---

## 🏗️ **Infrastructure Layer**

### **🐳 Docker Containerization**

All services run in isolated Docker containers managed by Docker Compose:

- **Backend Container**: Node.js application with TypeScript compilation
- **PostgreSQL Container**: Database with persistent volume mounting
- **Redis Container**: In-memory cache with persistence options
- **ChromaDB Container**: Vector database with persistent embeddings
- **pgAdmin Container**: Web-based database administration

### **📊 Service Health Monitoring**

- **Health Check Endpoints**: `/api/health` with comprehensive system status
- **Database Connection Monitoring**: PostgreSQL connection pool health
- **Cache Performance Metrics**: Redis hit/miss ratios
- **External API Health**: OpenAI service availability
- **Container Resource Monitoring**: Memory, CPU, and storage metrics

---

## 📈 **Performance & Scalability**

### **Current Capacity**
- **Products**: 9,999 Staples Canada products loaded and searchable
- **Concurrent Users**: Designed for 1000+ simultaneous connections
- **Response Times**: 
  - FAQ Queries: < 50ms (cached)
  - Product Search: < 100ms
  - AI Chat: < 2 seconds
  - Vector Search: < 100ms

### **Scalability Features**
- **Connection Pooling**: PostgreSQL optimized for 21 concurrent connections
- **Horizontal Scaling Ready**: Microservices architecture supports load balancing
- **Cache Optimization**: Redis reduces database load significantly
- **Async Processing**: Non-blocking I/O for better throughput

---

## 🔒 **Security & Reliability**

### **Security Measures**
- **API Rate Limiting**: 100 requests per 15-minute window
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variable Protection**: Sensitive data in .env files
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses without data leakage

### **Reliability Features**
- **Health Checks**: Automatic service monitoring
- **Graceful Error Handling**: Fallback mechanisms for service failures
- **Data Persistence**: PostgreSQL and ChromaDB with persistent storage
- **Container Restart Policies**: Automatic recovery from failures

---

## 🚀 **Development & Deployment**

### **Technology Stack**
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with modern middleware
- **Database ORM**: Prisma for type-safe database operations
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git with Azure DevOps integration

### **Environment Support**
- **Development**: Local Docker Compose setup
- **Production Ready**: Environment-specific configuration
- **CI/CD Integration**: Azure DevOps pipeline compatible
- **Monitoring Ready**: Structured logging and health endpoints

---

## 📊 **Business Value**

### **Core Capabilities**
✅ **AI-Powered Product Discovery**: 9,999+ searchable products  
✅ **Intelligent Customer Support**: RAG-optimized FAQ system  
✅ **Conversational Commerce**: Natural language product recommendations  
✅ **Scalable Architecture**: Microservices for enterprise growth  
✅ **Real-time Performance**: Sub-second response times  
✅ **Production Ready**: Full monitoring and reliability features  

### **Integration Ready**
- **Frontend Applications**: RESTful API for any frontend technology
- **Mobile Applications**: API-first design for mobile integration
- **Third-party Systems**: Webhook and API integration capabilities
- **Analytics Platforms**: Structured logging and metrics export

---

**📅 Last Updated**: January 27, 2026  
**🏷️ Version**: 1.6.0  
**🏗️ Architecture**: Microservices + AI-Enhanced RAG System
