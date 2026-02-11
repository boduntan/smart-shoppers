# CORS Issue Resolution Guide

## Problem

The hosted API at `https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api` has a CORS configuration issue:

```
Access-Control-Allow-Origin header contains multiple values 'http://localhost:3000,http://localhost:3001', but only one is allowed
```

## What is CORS?

CORS (Cross-Origin Resource Sharing) is a security feature in browsers that restricts web pages from making requests to a different domain than the one serving the page.

## The Issue

The backend is incorrectly sending:
```
Access-Control-Allow-Origin: http://localhost:3000,http://localhost:3001
```

This is **invalid**. The header can only contain ONE value.

## Backend Fix Required

The backend needs to be updated to handle CORS properly. Here are the correct approaches:

### Option 1: Allow Specific Origin (Recommended for Production)

```javascript
// Backend should check the request origin and respond with only that origin
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://your-production-domain.com'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);  // Single value only!
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

### Option 2: Allow All Origins (Development Only)

```javascript
// For development/testing - NOT for production
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

### Option 3: Using Express CORS Package

```javascript
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://your-production-domain.com'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

## Frontend Workaround (Temporary)

Until the backend is fixed, the frontend can work in **Mock Mode**:

### .env Configuration

```env
VITE_API_MODE=mock
```

This allows testing all features without the actual backend.

### Switch to Live Mode (After Backend Fix)

```env
VITE_API_MODE=live
```

## Testing the Fix

After the backend CORS is fixed, test with:

```bash
# Test from command line
curl -I -X OPTIONS https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api/health \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: GET"
```

Expected headers in response:
```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Current Status

- ✅ Frontend fully implemented with all API features
- ✅ Mock mode working perfectly for development
- ⚠️ Backend CORS needs fixing for live mode
- ⚠️ Backend should return only ONE origin value, not comma-separated list

## Files to Update on Backend

Check these backend files:
- `src/app.ts` or `src/server.ts` - Main Express app setup
- `src/middleware/cors.ts` - If CORS is in a separate middleware
- `azure-pipeline.yml` - Check if CORS is configured at deployment level

## Contact Backend Team

Share this information with the backend team:
- **Issue**: Multiple CORS origin values in single header
- **Location**: https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api
- **Fix**: Implement proper CORS middleware (see solutions above)
- **Test Endpoint**: `/api/health`
- **Affected Origins**: `http://localhost:3001` (and possibly others)
