# 📋 API Quick Reference
**Staples Smart Shopper Backend v1.4.0**

## 🔗 **Base URL**
```
http://localhost:3000/api
```

## 🎯 **FOR FRONTEND DEVELOPERS - START HERE** ⚡

### **✅ Recommended Endpoint: `/frontend/message`**
This endpoint provides **TypeScript-safe, discriminated union responses** perfect for React/Vue/Angular:

**Request:**
```bash
curl -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{"message": "hello", "sessionId": "test-123"}'
```

**Response Types Available:**
- **`message`** - Text responses with optional formatting
- **`suggested_prompts`** - Interactive prompt buttons with icons
- **`options`** - Multiple choice selections  
- **`products`** - Product listings with full metadata
- **`comparison`** - **🆕 AI-powered product comparison with detailed specifications**

**🆕 New AI Comparison Features:**
- **Category Comparison**: `"compare laptops"` - Compare top products in a category
- **Brand Comparison**: `"compare dell and lenovo"` - Compare products from different brands  
- **Brand + Category**: `"compare dell laptop vs lenovo laptop"` - Smart category-aware brand comparison
- **Detailed Specs**: Returns specifications, pricing, and highlights differences

**Example Comparison Request:**
```bash
curl -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{"message": "compare dell laptop vs lenovo laptop"}'
```

**Comparison Response Structure:**
```json
{
  "success": true,
  "response": {
    "type": "comparison",
    "data": {
      "message": "Here's a comparison of dell vs lenovo products:",
      "products": [
        {
          "id": "LAP-068",
          "name": "Dell 14.0\" Business Laptop",
          "price": 901.73,
          "brand": "Dell",
          "category": "Laptop",
          "specifications": [
            {"name": "Cpu", "value": "Intel Core i9-13900H"},
            {"name": "Ram", "value": "8"},
            {"name": "Storage", "value": "256"}
          ]
        }
      ],
      "highlightDifferences": true
    }
  }
}
```

**TypeScript Types:** Available at `/src/types/chatTypes.ts`

### **🔧 Integration Steps:**
1. **Start Services:** `docker-compose up -d`
2. **Health Check:** `curl http://localhost:3000/api/health`
3. **Test Chat:** Use `/api/frontend/message` endpoint
4. **Copy Types:** Import from `chatTypes.ts` for full type safety

---

## ⚡ **Quick Start for Frontend Engineers**
```bash
# Prerequisites: Docker & Docker Compose installed
# Start all services
docker-compose up -d

# Verify system is ready
curl http://localhost:3000/api/health

# 🎯 Test Frontend Chat Endpoint (RECOMMENDED)
curl -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me find office supplies?", "sessionId": "frontend-test"}'

# Test AI chat (legacy)  
curl -X POST http://localhost:3000/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me find office supplies?"}'
```

## 📡 **Available Endpoints**

### **System**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health check |

### **Products** 
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/products` | List products (paginated) |
| `GET` | `/products/:id` | Get product details |

**Query Parameters for `/products`:**
- `page=1` (default) - Page number  
- `limit=10` (default, max 100) - Items per page

### **AI Chat**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat/simple` | Basic chat with AI assistant |
| `POST` | `/chat/conversation` | Advanced chat with session memory |
| `GET` | `/chat/history/:sessionId` | Get conversation history |
| `DELETE` | `/chat/conversation/:sessionId` | Clear conversation |
| `GET` | `/chat/test-openai` | Test OpenAI connection |

### **🆕 Frontend-Compatible Chat** ⚡
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/frontend/message` | 🎯 **Frontend-optimized chat with TypeScript types** |

### **Image Upload & Analysis**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload/image-chat` | Upload image with AI analysis |
| `GET` | `/upload/images/:filename` | Serve uploaded images |

### **FAQ & Knowledge Base** 🧠
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/faq/search?q=query&limit=10` | Search FAQ with text matching |
| `GET` | `/faq/categories` | Get all FAQ categories |
| `GET` | `/faq/category/:categoryId` | Get FAQs by category |
| `GET` | `/faq/:id` | Get specific FAQ by ID |
| `GET` | `/faq/rag?q=query&limit=5` | 🆕 **RAG-optimized FAQ search for AI** |
| `GET` | `/faq/contexts` | 🆕 **Vector embedding ready contexts** |
| `POST` | `/faq/chat-context` | 🆕 **FAQ context for chatbot integration** |

### **Analytics & Tracking**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analytics/track` | Track user interactions |

### **System Health**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health/db` | Database health check |

**Body for `/chat/simple`:**
```json
{
  "message": "Your question about products"
}
```

**Body for `/chat/conversation`:**
```json
{
  "message": "Your question about products",
  "sessionId": "optional-session-id"
}
```

**🎯 Body for `/frontend/message` (Recommended for Frontend):**
```json
{
  "message": "Hello, I need office supplies",
  "sessionId": "optional-session-id"
}
```

**🎯 Response from `/frontend/message`:**
```json
{
  "success": true,
  "timestamp": "2026-01-28T21:13:55.433Z",
  "sessionId": "test-123",
  "response": [
    {
      "type": "message",
      "data": {
        "text": "Hello! I'm your Staples shopping assistant. How can I help you today?",
        "format": "plain"
      }
    },
    {
      "type": "suggested_prompts",
      "data": {
        "prompts": [
          {
            "id": "prompt-1",
            "text": "Find me a laptop",
            "icon": "💻"
          }
        ]
      }
    }
  ]
}
```

**Body for `/upload/image-chat` (multipart/form-data):**
- **image**: Image file (JPG, PNG, GIF - max 10MB)
- **message**: Optional text message about the image
- **sessionId**: Optional session ID for conversation continuity

## 📊 **Database Stats**
- **Products:** 9,999 loaded
- **Vendors:** 40+ unique brands
- **AI Model:** OpenAI GPT-4o-mini
- **Vector DB:** ChromaDB ready

## 🚀 **Quick Test Commands**

```bash
# Health check
curl http://localhost:3000/api/health

# Get products
curl http://localhost:3000/api/products?limit=5

# 🎯 Frontend Chat (TypeScript Compatible)
curl -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{"message": "I need office supplies", "sessionId": "quick-test"}'

# AI Chat (Legacy)
curl -X POST http://localhost:3000/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message": "I need office supplies"}'
```

## 🎯 **Status: ✅ PRODUCTION READY - Frontend Integration Ready!**

### 🚀 **Working Services:**
- **Backend API** - http://localhost:3000 (✅ Healthy)
- **PostgreSQL Database** - 9,999 products loaded (✅ Connected)
- **Redis Cache** - Port 6379 (✅ Running)  
- **ChromaDB Vector** - Port 8000 (✅ Ready)
- **OpenAI Chat** - GPT-4o-mini (✅ Connected & Working)
- **Image Upload** - Multer + File Storage (✅ Working)
- **🆕 Frontend Endpoint** - `/api/frontend/message` (✅ **TypeScript Ready**)

### 🎯 **Frontend Integration Status:**
- ✅ **Discriminated Union Responses** - Perfect for TypeScript
- ✅ **Type Definitions Available** - Copy from `src/types/chatTypes.ts`
- ✅ **Product Search Working** - Returns structured product data
- ✅ **Session Management** - Full conversation memory support
- ✅ **Error Handling** - Standardized error responses
- ✅ **Docker Compose Ready** - Single command deployment

### 📦 **Test Commands:**
```bash
# Health Check
curl http://localhost:3000/api/health

# Products (with pagination)
curl "http://localhost:3000/api/products?limit=5"

# AI Chat Assistant (with conversation memory)
curl -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "I need office supplies for my new job", "sessionId": "my-session"}'

# Image Upload & Analysis
curl -X POST http://localhost:3000/api/upload/image-chat \
  -F "image=@your-image.jpg" \
  -F "message=Help me find this type of product" \
  -F "sessionId=image-session"

# Get conversation history
curl http://localhost:3000/api/chat/history/my-session

# OpenAI Connection Test
curl http://localhost:3000/api/chat/test-openai
```

## 🧪 **Complete Frontend Testing Suite**

### **1. System Health & Status**
```bash
# Check overall system health
curl -s http://localhost:3000/api/health | jq '.'

# Check database connectivity
curl -s http://localhost:3000/api/health/db | jq '.'

# Verify OpenAI integration
curl -s http://localhost:3000/api/chat/test-openai | jq '.'
```

### **2. Product Discovery**
```bash
# Browse products with pagination
curl -s "http://localhost:3000/api/products?page=1&limit=5" | jq '.data.products[0]'

# Get specific product details
curl -s "http://localhost:3000/api/products/2933586-en-caseco-durable-skin-shield-case-with-sh" | jq '.'

# Test pagination limits
curl -s "http://localhost:3000/api/products?page=1&limit=100" | jq '.data.pagination'

# Search for office supplies (if search is implemented)
curl -s "http://localhost:3000/api/products?search=office%20chair" | jq '.data.products | length'
```

### **3. AI Chat Flows**

#### **🎯 Frontend Chat (TypeScript Compatible) - RECOMMENDED**
```bash
# Welcome response with suggested prompts
curl -s -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{"message": "hello", "sessionId": "frontend-test"}' | jq '.'

# Product search - returns structured product data
curl -s -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{"message": "show me laptops", "sessionId": "frontend-test"}' | jq '.response'

# Category browsing - returns option selection UI
curl -s -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{"message": "browse categories", "sessionId": "frontend-test"}' | jq '.response.data.options'

# Error handling
curl -s -X POST http://localhost:3000/api/frontend/message \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.error'
```

#### **Simple Chat (Stateless) - Legacy**
```bash
# Basic product inquiry
curl -s -X POST http://localhost:3000/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message": "What office chairs do you have?"}' | jq '.data.aiResponse'

# General greeting
curl -s -X POST http://localhost:3000/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me?"}' | jq '.data'

# Specific product request
curl -s -X POST http://localhost:3000/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message": "I need pens and notebooks for back to school"}' | jq '.data.aiResponse'
```

#### **Image Upload & Analysis**
```bash
# Test image upload (requires actual image file)
curl -s -X POST http://localhost:3000/api/upload/image-chat \
  -F "image=@/path/to/your/office-chair.jpg" \
  -F "message=What is this product and can you find similar items?" \
  -F "sessionId=image-test-session" | jq '.data'

# Create a test image for demo purposes
echo "Creating test image..."
convert -size 100x100 xc:lightblue -pointsize 20 -annotate +10+50 "Office Chair" test-chair.jpg 2>/dev/null || echo "ImageMagick not available - use any JPG image"

# Upload test image
curl -s -X POST http://localhost:3000/api/upload/image-chat \
  -F "image=@test-chair.jpg" \
  -F "message=Help me find this type of office chair" \
  -F "sessionId=furniture-search" | jq '.data'

# Get uploaded image (replace filename with actual filename from upload response)
curl -s http://localhost:3000/api/upload/images/image-1706038800000-123456789.jpg -o downloaded-image.jpg

# Test image upload without message
curl -s -X POST http://localhost:3000/api/upload/image-chat \
  -F "image=@test-chair.jpg" | jq '.data.aiResponse'

# Test image upload with conversation continuity
curl -s -X POST http://localhost:3000/api/upload/image-chat \
  -F "image=@test-chair.jpg" \
  -F "message=I need something like this for my home office" \
  -F "sessionId=home-office-furniture" | jq '.data'

# Continue conversation after image upload
curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "What about desks to match?", "sessionId": "home-office-furniture"}' | jq '.data.aiResponse'
```

#### **Conversation Chat (With Memory)**
```bash
# Start new conversation
curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi, I am setting up a new home office", "sessionId": "home-office-setup"}' | jq '.data'

# Follow-up in same conversation
curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a budget of $500", "sessionId": "home-office-setup"}' | jq '.data.aiResponse'

# Continue the conversation
curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "What desk would you recommend?", "sessionId": "home-office-setup"}' | jq '.data.aiResponse'

# Get full conversation history
curl -s http://localhost:3000/api/chat/history/home-office-setup | jq '.data.messages'
```

### **4. Session Management**
```bash
# Create multiple sessions
curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "I need school supplies", "sessionId": "back-to-school"}' | jq '.data.sessionId'

curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "I need business supplies", "sessionId": "new-business"}' | jq '.data.sessionId'

# Check different session histories
curl -s http://localhost:3000/api/chat/history/back-to-school | jq '.data.messages | length'
curl -s http://localhost:3000/api/chat/history/new-business | jq '.data.messages | length'

# Clear specific conversation
curl -s -X DELETE http://localhost:3000/api/chat/conversation/back-to-school | jq '.data'

# Verify deletion
curl -s http://localhost:3000/api/chat/history/back-to-school | jq '.data.messages | length'
```

### **5. Error Handling Tests**
```bash
# Test missing message
curl -s -X POST http://localhost:3000/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.error'

# Test invalid session ID
curl -s http://localhost:3000/api/chat/history/non-existent-session | jq '.data.messages'

# Test malformed JSON
curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{"message": "test"' | jq '.error'

# Test non-existent product
curl -s http://localhost:3000/api/products/invalid-product-id | jq '.error'

# Test invalid pagination
curl -s "http://localhost:3000/api/products?page=-1&limit=1000" | jq '.error // .data.pagination'

# Image upload error tests
# Test missing image file
curl -s -X POST http://localhost:3000/api/upload/image-chat \
  -F "message=test without image" | jq '.error'

# Test invalid file type (create text file)
echo "This is not an image" > test.txt
curl -s -X POST http://localhost:3000/api/upload/image-chat \
  -F "image=@test.txt" \
  -F "message=test with text file" | jq '.error'
rm test.txt

# Test non-existent image
curl -s http://localhost:3000/api/upload/images/non-existent.jpg | jq '.error'

# Test oversized file (if you have a large file)
# curl -s -X POST http://localhost:3000/api/upload/image-chat \
#   -F "image=@very-large-image.jpg" | jq '.error'
```

### **6. Real-World Scenarios**
```bash
# Scenario 1: New Employee Onboarding
echo "=== New Employee Scenario ==="
SESSION="new-employee-$(date +%s)"

curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I just started a new job and need to set up my workspace\", \"sessionId\": \"$SESSION\"}" | jq '.data.aiResponse'

curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I need a desk, chair, and basic supplies\", \"sessionId\": \"$SESSION\"}" | jq '.data.aiResponse'

curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"My budget is $800\", \"sessionId\": \"$SESSION\"}" | jq '.data.aiResponse'

# Scenario 2: Back to School Shopping
echo "=== Back to School Scenario ==="
SESSION="student-$(date +%s)"

curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I am a college student preparing for the new semester\", \"sessionId\": \"$SESSION\"}" | jq '.data.aiResponse'

curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I need notebooks, pens, and organization supplies\", \"sessionId\": \"$SESSION\"}" | jq '.data.aiResponse'

# Scenario 3: Small Business Setup  
echo "=== Small Business Scenario ==="
SESSION="business-$(date +%s)"

curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I am opening a small accounting firm and need office supplies\", \"sessionId\": \"$SESSION\"}" | jq '.data.aiResponse'

curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I need supplies for 5 employees\", \"sessionId\": \"$SESSION\"}" | jq '.data.aiResponse'
```

### **7. Performance & Load Testing**
```bash
# Quick response time test
echo "Testing response times..."
time curl -s http://localhost:3000/api/health > /dev/null
time curl -s "http://localhost:3000/api/products?limit=10" > /dev/null
time curl -s -X POST http://localhost:3000/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message": "quick test"}' > /dev/null

# Multiple concurrent requests
echo "Testing concurrent requests..."
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/api/chat/conversation \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Test message $i\", \"sessionId\": \"concurrent-test-$i\"}" &
done
wait
echo "All concurrent requests completed"
```

### **8. Integration Validation**
```bash
# Full integration test
echo "=== Full Integration Test ==="

# 1. Check system health
echo "1. System Health:"
curl -s http://localhost:3000/api/health | jq '.success'

# 2. Verify product data
echo "2. Product Data:"
curl -s "http://localhost:3000/api/products?limit=1" | jq '.data.pagination.total'

# 3. Test AI functionality
echo "3. AI Chat:"
curl -s -X POST http://localhost:3000/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' | jq '.success'

# 4. Test conversation flow
echo "4. Conversation Flow:"
SESSION="integration-test-$(date +%s)"
curl -s -X POST http://localhost:3000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"integration test\", \"sessionId\": \"$SESSION\"}" | jq '.success'

curl -s http://localhost:3000/api/chat/history/$SESSION | jq '.data.messages | length'

echo "=== Integration Test Complete ==="
```

### **9. FAQ & RAG System Testing** 🧠

#### **Standard FAQ Operations**
```bash
# Get all FAQ categories
curl -s http://localhost:3000/api/faq/categories | jq '.data.categories'

# Search for shipping information  
curl -s "http://localhost:3000/api/faq/search?q=shipping&limit=3" | jq '.data.results[].question'

# Get specific FAQ by ID
curl -s http://localhost:3000/api/faq/shipping-policy | jq '.data'

# Get FAQs by category
curl -s http://localhost:3000/api/faq/category/Services | jq '.data.results[].question'
```

#### **RAG-Optimized FAQ (AI Integration)** 🤖
```bash
# Get RAG-optimized FAQ data for AI consumption
curl -s "http://localhost:3000/api/faq/rag?q=shipping&limit=3" | jq '.data.ragData[0]'

# Get all FAQ contexts for vector embedding
curl -s http://localhost:3000/api/faq/contexts | jq '.data.contexts[0]'

# Chat context integration for conversational AI
curl -s -X POST http://localhost:3000/api/faq/chat-context \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much does shipping cost?",
    "conversationHistory": [
      {"role": "user", "content": "Hi, I want to order office supplies"},
      {"role": "assistant", "content": "Great! I can help you with that."}
    ]
  }' | jq '.data.faqs[0]'
```

#### **FAQ Response Structure**
```json
{
  "success": true,
  "data": {
    "ragData": [
      {
        "id": "shipping-policy",
        "content": "What is your shipping policy?\n\nStaples Canada offers free shipping...",
        "metadata": {
          "category": "Shipping",
          "context": "Customer inquiring about shipping costs...",
          "relatedTopics": ["orders", "delivery", "cost", "timeline"],
          "priority": 9,
          "keywords": ["shipping", "delivery", "free shipping"],
          "url": "https://help.staples.ca/hc/en-us/articles/...",
          "lastUpdated": "2024-01-23"
        }
      }
    ],
    "total": 3,
    "optimizedForAI": true
  }
}
```

## 🎯 **RAG Integration Guide**

### **For AI/Chatbot Developers**
The FAQ system is optimized for Retrieval-Augmented Generation (RAG):

1. **Use `/api/faq/rag`** for AI-ready FAQ data with semantic scoring
2. **Use `/api/faq/contexts`** to prepare vector embeddings for ChromaDB  
3. **Use `/api/faq/chat-context`** for seamless chatbot integration
4. **Priority scoring** helps rank FAQ relevance (1-10 scale)
5. **Context fields** provide semantic understanding for better AI responses

### **FAQ Categories Available**
- **Account** - Business accounts, registration, B2B features
- **Contact** - Customer support, phone numbers, hours  
- **Gift Cards** - Purchase, denominations, expiry policies
- **Pricing** - Price matching, competitive pricing
- **Returns** - 30-day policy, conditions, procedures
- **Rewards** - Points system, 5% back on ink/toner
- **Services** - Printing, binding, ink recycling
- **Shipping** - Free shipping thresholds, delivery times
- **Store Information** - Hours, locations, holiday schedules

---
**📅 Last Updated:** 2026-01-28 | **🏷️ Version:** 1.7.0 | **🎯 Frontend Integration Ready**
