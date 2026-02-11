# Emraay Omni Chatbot

Modern React + TypeScript integration application that connects the Staples Smart Shopper UI component with the backend API.

## 🏗️ Architecture

**Tech Stack:**
- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS with modular architecture
- **HTTP Client**: Axios
- **State Management**: React Context API
- **UI Component**: staples-hk (Web Component)
- **Testing**: Jest + React Testing Library
- **Code Quality**: ESLint + TypeScript strict mode

## 📁 Project Structure

```
Emraay-omni-chatbot/
├── src/
│   ├── components/           # React components
│   │   └── ChatWidget/      # Chat widget integration
│   ├── context/             # React context providers
│   │   └── ChatContext.tsx  # Chat state management
│   ├── services/            # API service layers
│   │   ├── apiClient.ts     # Axios configuration
│   │   ├── chatService.ts   # Chat API methods
│   │   ├── healthService.ts # Health check methods
│   │   └── productService.ts# Product API methods
│   ├── config/              # App configuration
│   ├── styles/              # Global SCSS styles
│   │   ├── variables.scss   # SCSS variables
│   │   └── global.scss      # Global styles
│   ├── __tests__/           # Test files
│   ├── App.tsx              # Main App component
│   └── main.tsx             # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── jest.config.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` if needed (defaults to hosted backend):
```env
VITE_API_BASE_URL=https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api
VITE_APP_TITLE=Staples Smart Shopper
VITE_APP_LOCALE=en-CA
```

### Development

```bash
# Start development server (opens at http://localhost:3001)
npm run dev

# Type checking
npm run type-check

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

### Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔌 API Integration

The app connects to the hosted Staples ChatBot backend:

**Base URL:** `https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api`

### Available Services

- **chatService**: Send messages, manage conversations
- **productService**: Fetch products, search, categories
- **healthService**: Check API health status

### Example Usage

```typescript
import { chatService } from '@/services/chatService';

const response = await chatService.sendMessage({
  message: 'Show me office chairs',
  sessionId: 'optional-session-id',
});
```

## 🎨 Styling Architecture

Uses SCSS with centralized variables for consistency:

```scss
// Import variables in any component
@import "@/styles/variables.scss";

.my-component {
  color: $primary-color;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Build

```bash
npm run build
```

Output will be in `dist/` directory, optimized for production.

## 🔗 Related Projects

- **Emraay-hk**: UI component library (web components)
- **Emraay-ChatBot**: Backend API service

## 👨‍💻 Author

**Hemant Kapoor**

## 📄 License

MIT
