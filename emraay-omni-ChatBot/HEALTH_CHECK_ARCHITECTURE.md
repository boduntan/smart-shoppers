# Health Check Architecture

## Overview
The application now implements a centralized health check architecture that runs once on app load to prevent cascading failures from broken API calls.

## Architecture Components

### 1. ApiHealthContext (`src/context/ApiHealthContext.tsx`)

**Purpose**: Centralized API health management that runs health check once on app initialization.

**Key Features**:
- **Single Health Check**: Runs automatically on app mount via `useEffect`
- **Mode-Aware**: Behaves differently in mock vs live mode
- **Global State**: Provides health status to all components via Context API
- **Timeout Protection**: 5-second timeout for live API health checks

**API**:
```typescript
interface ApiHealthContextType {
  isHealthy: boolean;      // Overall API health status
  isChecking: boolean;     // Health check in progress
  error: string | null;    // Error message if health check failed
  apiMode: 'mock' | 'live'; // Current API mode
  recheckHealth: () => Promise<void>; // Manual recheck function
}
```

**Behavior**:
- **Mock Mode**: Always returns healthy immediately (no actual API call)
- **Live Mode**: Fetches `/health` endpoint with 5s timeout

### 2. Health Check Flow

```
App Loads
    ↓
ApiHealthProvider Mounts
    ↓
useEffect Triggers (once)
    ↓
┌─────────────────────────┐
│  Check config.apiMode   │
└─────────────────────────┘
    ↓                ↓
Mock Mode         Live Mode
    ↓                ↓
Set Healthy    Fetch /health
              (5s timeout)
                ↓
         Success? ✅ / ❌
                ↓
         Update Context
```

### 3. App.tsx Integration

```tsx
<ApiHealthProvider>      {/* 👈 Health check runs here */}
  <ChatProvider>
    <div className="app">
      <Header />
      <HealthCheck />     {/* 👈 Reads from context */}
      <ChatInterface />
      <ProductSearch />
    </div>
  </ChatProvider>
</ApiHealthProvider>
```

### 4. Component Usage

Any component can access health status:

```tsx
import { useApiHealth } from '@/context/ApiHealthContext';

const MyComponent = () => {
  const { isHealthy, isChecking, error, apiMode } = useApiHealth();

  const makeApiCall = async () => {
    // Check health before making API calls
    if (!isHealthy && apiMode === 'live') {
      console.warn('API not healthy - skipping call');
      return;
    }

    // Proceed with API call...
  };
};
```

### 5. HealthCheck Component

**Updated Behavior**:
- No longer runs its own health check
- Reads health status from `useApiHealth()` hook
- Displays mode indicator: 🎭 Mock Mode or 🌐 Live Mode
- Shows helpful hint if API fails in live mode: "Switch to Mock Mode in .env"

## Configuration

### Environment Variables (.env)

```env
VITE_API_BASE_URL=https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api
VITE_API_MODE=mock    # or 'live'
```

### Mode Switching

**Mock Mode** (`VITE_API_MODE=mock`):
- ✅ No backend required
- ✅ All API calls return mock data instantly
- ✅ Health check always returns healthy
- ✅ Perfect for development without backend

**Live Mode** (`VITE_API_MODE=live`):
- 🌐 Connects to real API
- 🔍 Health check pings `/health` endpoint
- ⚠️ Requires backend to be running
- 💡 Shows helpful error if backend unavailable

## Benefits

### 1. **Prevents Cascading Failures**
- Single point of failure detection
- Components can check health before making calls
- Graceful degradation instead of error spam

### 2. **Better User Experience**
- Clear visual indicators (mock vs live)
- Helpful hints when things go wrong
- No confusing error messages

### 3. **Developer Experience**
- Easy mode switching (just change .env)
- Mock mode works without backend
- Console logs show health check status

### 4. **Performance**
- Health check runs once, not on every component mount
- Mock mode has zero network overhead
- Timeout protection prevents hanging

## Testing

### Unit Tests
Tests wrap components with `ApiHealthProvider`:

```tsx
import { ApiHealthProvider } from '@/context/ApiHealthContext';

render(
  <ApiHealthProvider>
    <HealthCheck />
  </ApiHealthProvider>
);
```

### Integration Testing
1. **Mock Mode**: `VITE_API_MODE=mock`
   - Should show "🎭 Mock Mode - No Backend Required"
   - All features should work without backend

2. **Live Mode with Backend**: `VITE_API_MODE=live`
   - Should show "🌐 Live API Mode"
   - Should connect to real API

3. **Live Mode without Backend**: `VITE_API_MODE=live` (backend down)
   - Should show error message
   - Should display hint: "Switch to Mock Mode"
   - Components should skip API calls

## Console Output

### Mock Mode
```
🔧 Staples Omni ChatBot Configuration
📍 API Base URL: https://api.dev.aks.staplescan.com/...
🎭 MOCK API MODE ENABLED - All API calls will return mock data

🎭 Mock mode enabled - skipping health check
```

### Live Mode (Healthy)
```
🔧 Staples Omni ChatBot Configuration
📍 API Base URL: https://api.dev.aks.staplescan.com/...
🌐 LIVE API MODE - Connecting to real backend

🔍 Checking API health...
✅ API health check passed
```

### Live Mode (Unhealthy)
```
🔧 Staples Omni ChatBot Configuration
📍 API Base URL: https://api.dev.aks.staplescan.com/...
🌐 LIVE API MODE - Connecting to real backend

🔍 Checking API health...
❌ API health check failed: Failed to fetch
```

## Future Improvements

1. **Retry Logic**: Auto-retry health check after X seconds
2. **Background Polling**: Periodic health checks in live mode
3. **Circuit Breaker**: Automatic fallback to mock mode if API fails
4. **Service-Level Health**: Individual health checks per service (chat, products, etc.)
5. **Status Dashboard**: More detailed health status visualization

## Troubleshooting

### Problem: App always shows unhealthy
**Solution**: Check `VITE_API_MODE` in .env. If set to `mock`, health check should always pass.

### Problem: Health check timeout
**Solution**: Check if backend URL is correct in .env. Try increasing timeout in ApiHealthContext.tsx.

### Problem: Tests failing with "useApiHealth must be used within ApiHealthProvider"
**Solution**: Wrap test components with `<ApiHealthProvider>`.

### Problem: Changes not reflected
**Solution**: Restart dev server (`npm run dev`) after changing .env file.

## Summary

The health check architecture provides:
- ✅ **Single health check on app load**
- ✅ **Prevents broken API calls**
- ✅ **Mode-aware behavior (mock/live)**
- ✅ **Helpful error messages**
- ✅ **Easy testing and development**
- ✅ **Better user experience**

This architecture ensures the app works reliably in both development (mock) and production (live) modes, with graceful failure handling and clear user feedback.
