# 🎭 API Mode Configuration Guide

## Current Setup

The app is configured with:
- **API URL**: `https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api`
- **Mode**: `MOCK` (using mock data for testing)

## How to Switch Modes

### Option 1: Mock Mode (Current - Testing/Demo)

**Best for**: Development, demos, testing without backend

```env
# .env file
VITE_API_MODE=mock
VITE_API_BASE_URL=https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api
```

**Features**:
- ✅ Works without any backend
- ✅ Realistic mock data
- ✅ Intelligent chat responses
- ✅ Fast (no network delays)
- ✅ Perfect for demos

**Restart after changing**: `npm run dev`

### Option 2: Live Mode (Production)

**Best for**: Production, connecting to real hosted API

```env
# .env file
VITE_API_MODE=live
VITE_API_BASE_URL=https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api
```

**Requirements**:
- ✅ Backend API must be running
- ✅ Network access to the API URL
- ✅ Valid API authentication (if required)

**Restart after changing**: `npm run dev`

## Quick Switch Commands

```bash
# Switch to MOCK mode
echo "VITE_API_MODE=mock" >> .env

# Switch to LIVE mode  
echo "VITE_API_MODE=live" >> .env

# Restart dev server
npm run dev
```

## Verification

After starting the app, check the browser console:

### Mock Mode:
```
🎭 MOCK API MODE ENABLED
✅ Using mock data - No backend connection required
```

### Live Mode:
```
🌐 LIVE API MODE
🔗 Connecting to: https://api.dev.aks.staplescan.com/...
```

## Visual Indicators

**In the app**:
- Health Check component shows current mode
- Yellow badge = Mock Mode 🎭
- Green badge = Live Mode 🌐

## Troubleshooting

### Mock Mode Not Working?
1. Check `.env` file: `VITE_API_MODE=mock`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Hard refresh browser: `Ctrl+Shift+R`
4. Check console for mode confirmation

### Live Mode Not Working?
1. Verify backend is accessible: 
   ```bash
   curl https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api/health
   ```
2. Check network/firewall settings
3. Verify API authentication
4. Check console for error messages

## Current Status

✅ **Hosted API URL configured**
✅ **Mock mode enabled for testing**
✅ **Ready to switch to live mode when backend is ready**

**To use real API**: Change `VITE_API_MODE=live` in `.env` and restart

---

**Updated**: January 26, 2026
