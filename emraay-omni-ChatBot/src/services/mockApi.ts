// Mock API responses for testing without backend
export const mockResponses = {
  health: {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'up',
      database: 'mock',
      redis: 'mock',
    },
  },

  chatSimple: {
    success: true,
    data: {
      message: "Hello! I'm your Emraay-Solutions shopping assistant. How can I help you find the perfect office supplies today?",
      sessionId: 'mock-session-' + Date.now(),
      timestamp: new Date().toISOString(),
    },
  },

  products: {
    success: true,
    data: {
      products: [
        {
          id: '1',
          name: 'Staples® Premium Multi-Purpose Paper, 8.5" x 11", Case',
          description: 'High-quality multipurpose paper for all your printing needs',
          price: 49.99,
          category: 'Paper & Stationery',
          imageUrl: 'https://via.placeholder.com/200x200?text=Paper',
          inStock: true,
        },
        {
          id: '2',
          name: 'Staples® Ergonomic Mesh Office Chair',
          description: 'Comfortable ergonomic chair with lumbar support',
          price: 299.99,
          category: 'Furniture',
          imageUrl: 'https://via.placeholder.com/200x200?text=Chair',
          inStock: true,
        },
        {
          id: '3',
          name: 'HP OfficeJet Pro 9015e Wireless All-in-One Printer',
          description: 'Fast, efficient all-in-one printer for your office',
          price: 199.99,
          category: 'Technology',
          imageUrl: 'https://via.placeholder.com/200x200?text=Printer',
          inStock: true,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      },
    },
  },

  faqSearch: {
    success: true,
    data: {
      results: [
        {
          id: '1',
          question: 'What is your return policy?',
          answer: 'We accept returns within 30 days of purchase with a valid receipt.',
          category: 'Returns & Exchanges',
        },
        {
          id: '2',
          question: 'Do you offer free shipping?',
          answer: 'Yes! Free shipping on orders over $50.',
          category: 'Shipping',
        },
      ],
    },
  },

  analytics: {
    success: true,
    data: {
      message: 'Event tracked successfully',
      eventId: 'evt-' + Date.now(),
    },
  },

  categoriesList: {
    success: true,
    data: {
      predefined: [
        { name: 'Office Supplies', slug: 'office-supplies', count: 100 },
        { name: 'Tech & Electronics', slug: 'tech-electronics', count: 85 },
        { name: 'Furniture', slug: 'furniture', count: 60 },
        { name: 'Cleaning & Breakroom', slug: 'cleaning-breakroom', count: 45 },
        { name: 'School Supplies', slug: 'school-supplies', count: 70 },
        { name: 'Print & Copy', slug: 'print-copy', count: 30 },
      ],
      database: [],
    },
  },
};

// Generate dynamic chat responses
export const generateChatResponse = (message: string, sessionId?: string) => {
  const lowerMessage = message.toLowerCase();
  
  let aiResponse = "I'm here to help you find the perfect office supplies!";
  const products = [];

  if (lowerMessage.includes('chair') || lowerMessage.includes('furniture') || lowerMessage.includes('office supplies')) {
    aiResponse = "Great choice! I found some excellent office chairs and furniture for you. The Staples® Ergonomic Mesh Office Chair is very popular and offers excellent lumbar support for all-day comfort.";
    products.push(mockResponses.products.data.products[1]);
  } else if (lowerMessage.includes('paper') || lowerMessage.includes('print') || lowerMessage.includes('stationery')) {
    aiResponse = "For your printing needs, I recommend our premium multi-purpose paper. It's high-quality and perfect for all your documents and presentations.";
    products.push(mockResponses.products.data.products[0]);
  } else if (lowerMessage.includes('printer') || lowerMessage.includes('technology') || lowerMessage.includes('laptop')) {
    aiResponse = "I have some great technology products for you! The HP OfficeJet Pro 9015e is an excellent all-in-one solution perfect for any office environment.";
    products.push(mockResponses.products.data.products[2]);
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    aiResponse = "Hello! 👋 I'm your Emraay-Solutions AI shopping assistant. I can help you find office chairs, paper, printers, and more. What are you looking for today?";
  } else {
    aiResponse = `I understand you're looking for products related to "${message}". Let me show you some of our popular items that might be perfect for your needs!`;
    products.push(...mockResponses.products.data.products);
  }

  return {
    success: true,
    data: {
      message: message,
      sessionId: sessionId || 'mock-session-' + Date.now(),
      aiResponse: aiResponse,
      timestamp: new Date().toISOString(),
      products: products.length > 0 ? products : undefined,
    },
  };
};
