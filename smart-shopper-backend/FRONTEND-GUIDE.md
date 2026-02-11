# 🎨 Frontend Developer Guide
## Staples Smart Shopper Backend API

**Backend Version:** v1.3.0 (AI-Enhanced)  
**Base URL:** `http://localhost:3000/api`  
**Status:** Production Ready with AI Chat 🤖

---

## 🚀 **Quick Start for Frontend Developers**

### **Prerequisites**
- Backend running on `http://localhost:3000`
- All Docker services healthy (run `docker-compose ps` to verify)

### **Test Backend Connection**
```bash
curl http://localhost:3000/api/health
# Should return: {"success":true,"message":"Service is healthy",...}
```

---
Nice
## 📡 **API Endpoints Reference**

### **🏥 Health & System**

#### `GET /api/health`
**Purpose:** Check if backend services are running  
**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2026-01-10T08:15:55.658Z",
  "uptime": 99.028,
  "environment": "development",
  "version": "1.0.0"
}
```

---

### **🛍️ Product Catalog**

#### `GET /api/products`
**Purpose:** Get paginated list of products  
**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10, max: 100) - Items per page

**Example Request:**
```javascript
fetch('http://localhost:3000/api/products?page=1&limit=20')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "558183-en-graphic-handicapped-parking",
        "title": "Graphic, Handicapped Parking Right Arrow, 18\" x 12\"",
        "vendor": "national_marker",
        "category": null,
        "price": null,
        "inStock": true,
        "url": "https://www.staples.ca/products/558183-en-...",
        "images": []
      }
      // ... more products
    ],
    "pagination": {
      "total": 9999,
      "page": 1,
      "limit": 20,
      "pages": 500
    }
  }
}
```

#### `GET /api/products/:id`
**Purpose:** Get specific product details  
**Example:** `GET /api/products/558183-en-graphic-handicapped-parking`

#### `GET /api/products/category/:categoryName` 🆕
**Purpose:** Get products by category (for category buttons like "Tech & Electronics")  
**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

**Available Categories:**
- `tech-electronics` - Laptops, computers, printers, monitors
- `office-supplies` - Pens, paper, notebooks, binders
- `furniture` - Chairs, desks, tables, cabinets

**Example Request:**
```javascript
// When user clicks "Tech & Electronics" button:
const getProductsByCategory = async (category, page = 1) => {
  const response = await fetch(
    `http://localhost:3000/api/products/category/${category}?page=${page}&limit=20`
  );
  return await response.json();
};

// Usage
getProductsByCategory('tech-electronics').then(data => {
  console.log('Tech products:', data.data.products);
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "laptop-123",
        "title": "HP Pavilion 15.6\" Laptop",
        "vendor": "hp", 
        "category": "Electronics",
        "price": 799.99,
        "inStock": true,
        "url": "https://www.staples.ca/products/laptop-123",
        "images": ["laptop-image.jpg"]
      }
      // ... more tech products
    ],
    "pagination": {
      "total": 1250,
      "page": 1,
      "limit": 20,
      "pages": 63
    },
    "category": "tech-electronics"
  }
}
```

#### `GET /api/products/categories/list` 🆕
**Purpose:** Get all available categories with product counts  

**Response:**
```json
{
  "success": true,
  "data": {
    "predefined": [
      {
        "name": "Tech & Electronics",
        "slug": "tech-electronics", 
        "count": 1250
      },
      {
        "name": "Office Supplies",
        "slug": "office-supplies",
        "count": 2100  
      },
      {
        "name": "Furniture", 
        "slug": "furniture",
        "count": 850
      }
    ],
    "database": [
      { "name": "Electronics", "count": 1100 },
      { "name": "Office", "count": 1950 }
    ]
  }
}
```

---

### **🤖 AI Chat System**

#### `POST /api/chat/conversation` ⭐ **RECOMMENDED**
**Purpose:** AI chat with conversation memory and session continuity  
**Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "message": "I need a good office chair for working from home",
  "sessionId": "user-123-session"  // Optional - generates UUID if not provided
}
```

**Example Request:**
```javascript
const chatWithMemory = async (message, sessionId = null) => {
  const response = await fetch('http://localhost:3000/api/chat/conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sessionId })
  });
  
  return await response.json();
};

// Usage - Maintains conversation context
let currentSession = null;

const sendMessage = async (message) => {
  const result = await chatWithMemory(message, currentSession);
  currentSession = result.data.sessionId; // Save session for continuity
  return result;
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userMessage": "I need a good office chair for working from home",
    "aiResponse": "I'd be happy to help you find a great office chair! Since you mentioned working from home, I'll focus on ergonomic options...",
    "timestamp": "2026-01-12T10:30:45.123Z"
  }
}
```

#### `GET /api/chat/history/:sessionId`
**Purpose:** Get conversation history for a session  
**Example:** `GET /api/chat/history/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "messages": [
      {
        "role": "user",
        "content": "I need a good office chair",
        "timestamp": "2026-01-12T10:30:45.123Z"
      },
      {
        "role": "assistant", 
        "content": "I'd be happy to help you find a great office chair!...",
        "timestamp": "2026-01-12T10:30:47.456Z"
      }
    ]
  }
}
```

#### `POST /api/chat/simple`
**Purpose:** Simple AI chat without conversation memory (stateless)  
**Note:** ⚠️ Use `POST /api/chat/conversation` for better user experience

#### `POST /api/upload/image-chat` 🆕
**Purpose:** Upload image and get AI product recommendations  
**Headers:** `Content-Type: multipart/form-data`

**Request Body (FormData):**
```javascript
const uploadImageChat = async (imageFile, message = "", sessionId = null) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('message', message || 'What product is this? Help me find similar items.');
  if (sessionId) formData.append('sessionId', sessionId);

  const response = await fetch('http://localhost:3000/api/upload/image-chat', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};

// Usage
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    uploadImageChat(file, "What is this product?", currentSessionId)
      .then(result => {
        console.log('AI Analysis:', result.data.aiResponse);
        console.log('Image URL:', result.data.imageUrl);
      });
  }
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userMessage": "What product is this?",
    "imageUrl": "/api/upload/images/image-1705234567890-123456789.jpg",
    "aiResponse": "I can see you've uploaded an image. While I don't have full image analysis capabilities yet, I can help you find products at Staples Canada based on your description...",
    "timestamp": "2026-01-12T10:35:12.789Z"
  }
}
```

#### `DELETE /api/chat/conversation/:sessionId`
**Purpose:** Clear conversation history for a session  
**Use case:** Reset chat or start fresh conversation

#### `GET /api/chat/test-openai`
**Purpose:** Test OpenAI connection status  
**Use case:** Verify AI features are working before enabling chat UI

---

## 🎨 **Frontend Implementation Examples**

### **React Product Listing Component**

```jsx
import React, { useState, useEffect } from 'react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/products?page=${page}&limit=20`
        );
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.data.products);
          setTotalPages(data.data.pagination.pages);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page]);

  return (
    <div className="product-list">
      <h2>Staples Products ({totalPages * 20} total)</h2>
      
      {loading ? (
        <div>Loading products...</div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.title}</h3>
              <p>Vendor: {product.vendor}</p>
              <p>Price: {product.price || 'Contact for pricing'}</p>
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                View on Staples.ca
              </a>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      <div className="pagination">
        <button 
          disabled={page === 1} 
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button 
          disabled={page === totalPages} 
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductList;
```

### **React AI Chat Component with Conversation Memory**

```jsx
import React, { useState, useEffect } from 'react';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Load conversation history on component mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      loadConversationHistory(savedSessionId);
    }
  }, []);

  const loadConversationHistory = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/chat/history/${sessionId}`);
      const data = await response.json();
      
      if (data.success && data.data.messages.length > 0) {
        setMessages(data.data.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })));
        setSessionId(sessionId);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return;

    const userMessage = {
      role: 'user',
      content: inputMessage || 'Image uploaded',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      let response;
      
      if (selectedFile) {
        // Handle image upload
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('message', inputMessage || 'What product is this?');
        if (sessionId) formData.append('sessionId', sessionId);

        response = await fetch('http://localhost:3000/api/upload/image-chat', {
          method: 'POST',
          body: formData
        });
      } else {
        // Handle text message with conversation memory
        response = await fetch('http://localhost:3000/api/chat/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: inputMessage,
            sessionId: sessionId 
          })
        });
      }

      const data = await response.json();

      if (data.success) {
        // Save session ID for continuity
        const newSessionId = data.data.sessionId;
        setSessionId(newSessionId);
        localStorage.setItem('chatSessionId', newSessionId);

        const aiMessage = {
          role: 'assistant',
          content: data.data.aiResponse,
          timestamp: data.data.timestamp,
          imageUrl: data.data.imageUrl // For image uploads
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || 'AI response failed');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setInputMessage('');
      setSelectedFile(null);
    }
  };

  const clearConversation = async () => {
    if (sessionId) {
      try {
        await fetch(`http://localhost:3000/api/chat/conversation/${sessionId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to clear conversation:', error);
      }
    }
    
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem('chatSessionId');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      alert('Please select an image file');
    }
  };

  return (
    <div className="chatbot">
      <div className="chat-header">
        <h3>🤖 Staples Shopping Assistant</h3>
        <p>Ask me about products, upload images, or browse by category!</p>
        <button onClick={clearConversation} className="clear-btn">
          🗑️ Clear Chat
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <strong>{message.role === 'user' ? 'You' : 'AI Assistant'}:</strong>
            <div className="message-content">
              {message.content}
              {message.imageUrl && (
                <img 
                  src={`http://localhost:3000${message.imageUrl}`}
                  alt="Uploaded product"
                  style={{ maxWidth: '200px', marginTop: '10px' }}
                />
              )}
            </div>
            <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <strong>AI Assistant:</strong>
            <div className="typing-indicator">Analyzing your request...</div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <div className="input-row">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about products or describe what you need..."
            disabled={loading}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload" className="upload-btn">
            📷 Upload Image
          </label>
          <button 
            onClick={sendMessage} 
            disabled={loading || (!inputMessage.trim() && !selectedFile)}
          >
            Send
          </button>
        </div>
        {selectedFile && (
          <div className="selected-file">
            📎 Selected: {selectedFile.name}
            <button onClick={() => setSelectedFile(null)}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBot;
```

### **React Category Selection Component** 🆕

```jsx
import React, { useState, useEffect } from 'react';

const CategorySelector = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products/categories/list');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.predefined);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const selectCategory = async (categorySlug, categoryName) => {
    setSelectedCategory({ slug: categorySlug, name: categoryName });
    setPage(1);
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:3000/api/products/category/${categorySlug}?page=1&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setTotalPages(data.data.pagination.pages);
        
        // Notify parent component
        if (onCategorySelect) {
          onCategorySelect(categorySlug, data.data.products);
        }
      }
    } catch (error) {
      console.error('Failed to load category products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async (newPage) => {
    if (!selectedCategory) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/category/${selectedCategory.slug}?page=${newPage}&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setPage(newPage);
      }
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-selector">
      <div className="category-buttons">
        <h3>What are you looking for today?</h3>
        <div className="button-grid">
          {categories.map(category => (
            <button
              key={category.slug}
              onClick={() => selectCategory(category.slug, category.name)}
              className={`category-btn ${selectedCategory?.slug === category.slug ? 'active' : ''}`}
            >
              {category.name}
              <span className="count">({category.count} items)</span>
            </button>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <div className="category-results">
          <h2>{selectedCategory.name}</h2>
          
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <>
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.id} className="product-card">
                    <h4>{product.title}</h4>
                    <p className="vendor">{product.vendor}</p>
                    <p className="price">
                      {product.price ? `$${product.price}` : 'Contact for pricing'}
                    </p>
                    <p className={`stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                      {product.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                    </p>
                    <a 
                      href={product.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-product-btn"
                    >
                      View on Staples.ca
                    </a>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    disabled={page === 1 || loading} 
                    onClick={() => loadMoreProducts(page - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button 
                    disabled={page === totalPages || loading} 
                    onClick={() => loadMoreProducts(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
```

```vue
<template>
  <div class="product-search">
    <h2>Search Staples Products</h2>
    
    <!-- Simple Search (coming soon: advanced search with filters) -->
    <div class="search-box">
      <input 
        v-model="searchQuery" 
        @keyup.enter="searchProducts"
        placeholder="Search for office supplies..."
      />
      <button @click="searchProducts" :disabled="loading">
        {{ loading ? 'Searching...' : 'Search' }}
      </button>
    </div>

    <!-- Results -->
    <div v-if="products.length > 0" class="results">
      <h3>Found {{ products.length }} products</h3>
      <div class="products">
        <div v-for="product in products" :key="product.id" class="product">
          <h4>{{ product.title }}</h4>
          <p>{{ product.vendor }}</p>
          <a :href="product.url" target="_blank">View Product</a>
        </div>
      </div>
    </div>

    <!-- No results -->
    <div v-if="searchPerformed && products.length === 0" class="no-results">
      No products found. Try different keywords or ask our AI assistant!
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductSearch',
  data() {
    return {
      searchQuery: '',
      products: [],
      loading: false,
      searchPerformed: false
    };
  },
  methods: {
    async searchProducts() {
      if (!this.searchQuery.trim()) return;
      
      this.loading = true;
      this.searchPerformed = true;

      try {
        // Note: Basic search endpoint coming soon
        // For now, filter products by title/vendor
        const response = await fetch(
          `http://localhost:3000/api/products?limit=100`
        );
        const data = await response.json();
        
        if (data.success) {
          // Client-side filtering (temporary until search API is ready)
          this.products = data.data.products.filter(product => 
            product.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            product.vendor.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
      } catch (error) {
        console.error('Search failed:', error);
        this.products = [];
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## 🔧 **Error Handling**

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Brief error description",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Resource not found
- `500` - Internal server error

**Frontend Error Handling Pattern:**
```javascript
const handleAPICall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || data.error);
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    // Show user-friendly error message
    showErrorToast(error.message);
    throw error;
  }
};
```

---

## 📊 **Data Models**

### **Product Object**
```typescript
interface Product {
  id: string;                    // Unique identifier
  title: string;                 // Product name
  vendor: string;                // Brand/manufacturer
  category: string | null;       // Product category
  price: number | null;          // Price (may be null)
  inStock: boolean;              // Availability
  url: string;                   // Staples.ca link
  images: string[];              // Product images
  description?: string;          // Product description
}
```

### **Chat Message Object**
```typescript
interface ChatMessage {
  role: 'user' | 'assistant';    // Who sent the message
  content: string;               // Message text
  timestamp: string;             // ISO timestamp
}
```

---

## 🚀 **Performance Tips**

1. **Pagination**: Always use pagination for product lists (max 100 per request)
2. **Debouncing**: Debounce search inputs to avoid excessive API calls
3. **Caching**: Cache product details and chat responses when appropriate
4. **Loading States**: Always show loading indicators for better UX
5. **Error Boundaries**: Implement error boundaries for robust error handling

---

## 🔮 **Coming Soon (In Development)**

- **Advanced Search API**: `POST /api/search/basic` with filters
- **Vector Search**: Semantic product search with ChromaDB
- **Product Recommendations**: `GET /api/products/:id/similar`
- **Shopping Cart**: Session-based cart management
- **User Authentication**: Login/signup system
- **Enhanced Chat**: Conversation history and product context

---

## 📞 **Support**

- **Backend Health**: `GET /api/health`
- **OpenAI Status**: `GET /api/chat/test-openai`
- **Database Stats**: View pgAdmin at `http://localhost:5050`
- **Service Status**: Run `docker-compose ps` in backend directory

**Current Version:** v1.3.0 (AI-Enhanced) 🤖  
**Last Updated:** January 10, 2026

---

### **Category Selector CSS**

```css
.category-selector {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.category-buttons h3 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.category-btn {
  background: linear-gradient(135deg, #FF6B35, #F7931E);
  color: white;
  border: none;
  padding: 15px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.category-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.category-btn.active {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  transform: scale(1.05);
}

.category-btn .count {
  display: block;
  font-size: 0.8rem;
  opacity: 0.9;
  margin-top: 5px;
}

.category-results h2 {
  color: #333;
  border-bottom: 3px solid #FF6B35;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.product-card h4 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  line-height: 1.4;
}

.product-card .vendor {
  color: #666;
  font-size: 0.9rem;
  margin: 5px 0;
}

.product-card .price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #FF6B35;
  margin: 10px 0;
}

.product-card .stock.in-stock {
  color: #4CAF50;
  font-weight: 600;
}

.product-card .stock.out-of-stock {
  color: #f44336;
  font-weight: 600;
}

.view-product-btn {
  display: inline-block;
  background: #FF6B35;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-top: 10px;
  transition: background-color 0.3s ease;
}

.view-product-btn:hover {
  background: #e55a2b;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.pagination button {
  background: #FF6B35;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.pagination button:not(:disabled):hover {
  background: #e55a2b;
  transform: translateY(-2px);
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  color: #666;
}
```
