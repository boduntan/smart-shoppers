import express from 'express';
import { PrismaClient } from '@prisma/client';
import { openaiService } from '../services/openaiService';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { 
  Product, 
  ProductAvailability, 
  ChatResponse, 
  ApiResponse,
  MessageResponse,
  SuggestedPromptsResponse,
  OptionsResponse,
  ProductsResponse
} from '../types/chatTypes';

const router = express.Router();
const prisma = new PrismaClient();

// Base URL for serving images - use environment variable or default to localhost
const getImageBaseUrl = () => {
  return process.env.IMAGE_BASE_URL || `http://localhost:${config.port}`;
};

// In-memory session storage for shopping plans (in production, use Redis)
const sessionPlans: Map<string, { items: string[]; selectedItems: string[] }> = new Map();

// Product adapter function with proper typing
function adaptProduct(dbProduct: any): Product {
  const availability: ProductAvailability = dbProduct.inStock ? 'In Stock' : 'Out of Stock';
  
  // Build full image URL - if it's a relative path, prepend the base URL
  let imageUrl = 'https://www.staples.ca/images/default-product.jpg';
  if (dbProduct.images && dbProduct.images[0]) {
    const img = dbProduct.images[0];
    // Check if it's already a full URL or a relative path
    if (img.startsWith('http://') || img.startsWith('https://')) {
      imageUrl = img;
    } else {
      // Prepend base URL for relative paths
      imageUrl = `${getImageBaseUrl()}${img}`;
    }
  }
  
  return {
    id: dbProduct.id,
    name: dbProduct.title,
    price: Number(dbProduct.price) || 0,
    compareAtPrice: dbProduct.originalPrice ? Number(dbProduct.originalPrice) : undefined,
    image: imageUrl,
    rating: dbProduct.rating,
    reviewCount: dbProduct.reviewCount,
    url: dbProduct.url,
    availability,
    sku: dbProduct.id,
    brand: dbProduct.vendor,
    category: dbProduct.category
  };
}

// POST /api/frontend/message - Main chat endpoint following frontend spec
router.post('/message', async (req: express.Request, res: express.Response) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      const errorResponse: ApiResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        response: {} as ChatResponse, // Will be ignored due to success: false
        error: { code: 'INVALID_REQUEST', message: 'Message is required' }
      };
      return res.status(400).json(errorResponse);
    }
    
    const userMessage = message.toLowerCase().trim();
    
    // Welcome response
    if (userMessage.includes('hello') || userMessage.includes('hi')) {
      const welcomeResponse: ApiResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        sessionId,
        response: [
          {
            type: 'message',
            data: {
              text: 'Hello! I\'m your Staples shopping assistant. How can I help you today?',
              format: 'plain'
            }
          } as MessageResponse,
          {
            type: 'suggested_prompts',
            data: {
              prompts: [
                { id: 'prompt-1', text: 'Find me a laptop', icon: '💻' },
                { id: 'prompt-2', text: 'Show me office chairs', icon: '🪑' },
                { id: 'prompt-3', text: 'Browse categories', icon: '📋' }
              ]
            }
          } as SuggestedPromptsResponse
        ]
      };
      return res.json(welcomeResponse);
    }
    
    // Product search terms
    const searchTerms = ['laptop', 'chair', 'printer', 'paper', 'pen', 'mouse'];
    const brandTerms = ['dell', 'lenovo', 'acer', 'hp', 'apple', 'microsoft', 'lg', 'samsung'];
    
    // Product comparison - AI-powered (check first before basic search)
    if (userMessage.includes('compare') || userMessage.includes('comparison') || userMessage.includes('vs')) {
      // Extract category from comparison request
      const categoryMatch = searchTerms.find(term => userMessage.toLowerCase().includes(term));
      
      // Extract brands from comparison request
      const brandMatches = brandTerms.filter(brand => userMessage.toLowerCase().includes(brand));
      
      let productsToCompare: any[] = [];
      
      // Brand-specific comparison (e.g., "compare dell and lenovo" or "compare dell laptop vs lenovo laptop")
      if (brandMatches.length >= 2) {
        // Get one product from each brand, prioritizing category if specified
        for (const brand of brandMatches.slice(0, 3)) { // Limit to 3 brands
          let brandProduct;
          
          // If category is mentioned, try to find products in that category first
          if (categoryMatch) {
            brandProduct = await prisma.product.findFirst({
              where: {
                AND: [
                  { vendor: { contains: brand, mode: 'insensitive' } },
                  { category: { equals: categoryMatch, mode: 'insensitive' } },
                  { price: { not: null } }
                ]
              },
              select: {
                id: true,
                title: true,
                price: true,
                originalPrice: true,
                specifications: true,
                images: true,
                url: true,
                vendor: true,
                category: true
              },
              orderBy: { price: 'asc' }
            });
          }
          
          // Fallback to any product from the brand if no category match found
          if (!brandProduct) {
            brandProduct = await prisma.product.findFirst({
              where: {
                AND: [
                  { vendor: { contains: brand, mode: 'insensitive' } },
                  { price: { not: null } }
                ]
              },
              select: {
                id: true,
                title: true,
                price: true,
                originalPrice: true,
                specifications: true,
                images: true,
                url: true,
                vendor: true,
                category: true
              },
              orderBy: { price: 'asc' }
            });
          }
          
          if (brandProduct) {
            productsToCompare.push(brandProduct);
          }
        }
      }
      // Category-specific comparison (e.g., "compare laptops")
      else if (categoryMatch) {
        productsToCompare = await prisma.product.findMany({
          where: {
            AND: [
              { category: { equals: categoryMatch, mode: 'insensitive' } },
              { price: { not: null } }
            ]
          },
          select: {
            id: true,
            title: true,
            price: true,
            originalPrice: true,
            specifications: true,
            images: true,
            url: true,
            vendor: true,
            category: true
          },
          orderBy: { price: 'asc' },
          take: 3 // Compare top 3 products
        });
      }

      if (productsToCompare.length >= 2) {
        const imageBaseUrl = getImageBaseUrl();
        const comparisonProducts = productsToCompare.map((product: any) => {
          // Build full image URL for comparison products
          let imageUrl = `${imageBaseUrl}/uploads/images/categories/default.jpg`;
          if (product.images && product.images[0]) {
            const img = product.images[0];
            imageUrl = img.startsWith('http://') || img.startsWith('https://') 
              ? img 
              : `${imageBaseUrl}${img}`;
          }
          return {
            id: product.id,
            name: product.title,
            price: Number(product.price) || 0,
            ...(product.originalPrice ? { compareAtPrice: Number(product.originalPrice) } : {}),
            image: imageUrl,
            url: product.url,
            brand: product.vendor || 'Unknown',
            category: product.category || 'Product',
            specifications: Object.entries(product.specifications as Record<string, any> || {})
              .filter(([key, value]) => value && key !== 'type')
              .map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value: String(value)
              }))
          };
        });

        const comparisonType = brandMatches.length >= 2 ? 'brand' : 'category';
        const comparisonSubject = brandMatches.length >= 2 ? brandMatches.join(' vs ') : categoryMatch;

        const comparisonResponse: ApiResponse = {
          success: true,
          timestamp: new Date().toISOString(),
          sessionId,
          response: {
            type: 'comparison',
            data: {
              message: `Here's a comparison of ${comparisonSubject} products:`,
              products: comparisonProducts,
              highlightDifferences: true
            }
          }
        };
        return res.json(comparisonResponse);
      }

      // Fallback if no products found for comparison
      const noComparisonResponse: ApiResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        sessionId,
        response: {
          type: 'message',
          data: {
            text: 'I can compare products for you! Try asking "compare laptops" or "compare dell and lenovo".',
            format: 'plain'
          }
        } as MessageResponse
      };
      return res.json(noComparisonResponse);
    }
    
    // Basic product search 
    const foundTerm = searchTerms.find((term: string) => userMessage.includes(term));
    
    if (foundTerm) {
      const products = await prisma.product.findMany({
        where: {
          AND: [
            { url: { contains: 'staples.ca' } },
            { category: { equals: foundTerm, mode: 'insensitive' } },
            { price: { not: null } }
          ]
        },
        select: {
          id: true,
          title: true,
          price: true,
          originalPrice: true,
          inStock: true,
          vendor: true,
          url: true,
          rating: true,
          reviewCount: true,
          images: true,
          category: true
        },
        orderBy: { price: 'asc' },
        take: 4
      });
      
      if (products.length > 0) {
        const productsResponse: ApiResponse = {
          success: true,
          timestamp: new Date().toISOString(),
          sessionId,
          response: {
            type: 'products',
            data: {
              message: `I found ${products.length} ${foundTerm} products for you:`,
              products: products.map(adaptProduct),
              totalCount: products.length,
              hasMore: false
            }
          } as ProductsResponse
        };
        return res.json(productsResponse);
      }
    }
    
    // Category options
    if (userMessage.includes('category') || userMessage.includes('browse')) {
      const optionsResponse: ApiResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        sessionId,
        response: {
          type: 'options',
          data: {
            message: 'What type of products are you looking for?',
            options: [
              { label: 'Office Supplies', value: 'office', icon: '📎' },
              { label: 'Technology', value: 'tech', icon: '💻' },
              { label: 'Furniture', value: 'furniture', icon: '🪑' },
              { label: 'Printers', value: 'printers', icon: '🖨️' }
            ],
            allowSkip: true
          }
        } as OptionsResponse
      };
      return res.json(optionsResponse);
    }
    
    // AI-powered response for everything else
    try {
      logger.info(`AI request: "${message}"`);
      
      // Get or create shopping plan for this session
      const currentPlan = sessionPlans.get(sessionId || 'default');
      
      // Search for relevant products using keywords from message
      const keywords = message.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      let products: any[] = [];
      
      if (keywords.length > 0) {
        products = await prisma.product.findMany({
          where: {
            OR: [
              { title: { contains: keywords[0], mode: 'insensitive' } },
              { category: { contains: keywords[0], mode: 'insensitive' } },
              { bodyHtml: { contains: keywords[0], mode: 'insensitive' } }
            ]
          },
          take: 10
        });
      }
      
      // Generate structured AI response (AI decides if choices should be shown)
      const aiResult = await openaiService.generateStructuredResponse(
        message, 
        [],
        products.length > 0 ? products : undefined,
        currentPlan
      );
      
      // Save shopping plan if AI created one
      if (aiResult.shoppingPlan && aiResult.shoppingPlan.items && Array.isArray(aiResult.shoppingPlan.items) && sessionId) {
        sessionPlans.set(sessionId, aiResult.shoppingPlan);
        logger.info(`Shopping plan created for session ${sessionId}: ${aiResult.shoppingPlan.items.join(', ')}`);
      }
      
      // Build response array
      const responseArray: ChatResponse[] = [];
      
      // Always add the full AI message first
      responseArray.push({
        type: 'message',
        data: {
          text: aiResult.message,
          format: 'markdown'
        }
      } as MessageResponse);
      
      // Add choices if AI provided them
      if (aiResult.choices && aiResult.choices.length > 0) {
        responseArray.push({
          type: 'options',
          data: {
            message: 'Select an option to continue:',
            options: aiResult.choices,
            allowSkip: true
          }
        } as OptionsResponse);
      }
      
      // If we found products, add them too
      if (products.length > 0) {
        responseArray.push({
          type: 'products',
          data: {
            message: '',
            products: products.slice(0, 6).map((p: any) => ({
              id: p.id,
              name: p.title || p.name,
              price: Number(p.price) || 0,
              compareAtPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
              image: p.images?.[0] || '/uploads/images/categories/default.jpg',
              rating: p.rating,
              reviewCount: p.reviewCount,
              url: p.url,
              availability: p.inStock ? 'In Stock' : 'Out of Stock',
              brand: p.vendor,
              category: p.category
            })),
            totalCount: products.length,
            hasMore: products.length > 6
          }
        } as ProductsResponse);
      }
      
      // Ensure we have at least one response
      let responseData: ChatResponse | ChatResponse[];
      if (responseArray.length === 0) {
        responseData = { type: 'message', data: { text: aiResult.message, format: 'markdown' } } as MessageResponse;
      } else if (responseArray.length === 1) {
        responseData = responseArray[0]!;
      } else {
        responseData = responseArray;
      }
      
      const finalResponse: ApiResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        sessionId,
        response: responseData
      };
      return res.json(finalResponse);
      
    } catch (aiError: any) {
      logger.error('AI service error:', aiError);
      // Fallback to static response if AI fails
      const defaultResponse: ApiResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        sessionId,
        response: {
          type: 'message',
          data: {
            text: `I'm having trouble processing your request right now. Try asking about specific products like "show me laptops" or say "browse categories".`,
            format: 'plain'
          }
        } as MessageResponse
      };
      return res.json(defaultResponse);
    }
    
  } catch (error: any) {
    const errorResponse: ApiResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      response: {} as ChatResponse, // Will be ignored due to success: false
      error: { code: 'SERVER_ERROR', message: error.message }
    };
    return res.status(500).json(errorResponse);
  }
});

// POST /api/frontend/product-clicked - Handle when user opens a product detail page
// This allows the AI to remind user of remaining items in their shopping plan
router.post('/product-clicked', async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId, productId, productName, productCategory } = req.body;
    
    if (!sessionId) {
      return res.json({ success: true, hasReminder: false });
    }
    
    const currentPlan = sessionPlans.get(sessionId);
    
    if (!currentPlan || currentPlan.items.length === 0) {
      return res.json({ success: true, hasReminder: false });
    }
    
    // Try to match the product to a planned item
    const categoryLower = (productCategory || productName || '').toLowerCase();
    const matchedItem = currentPlan.items.find(item => 
      categoryLower.includes(item.toLowerCase()) || item.toLowerCase().includes(categoryLower.split(' ')[0])
    );
    
    if (matchedItem && !currentPlan.selectedItems.includes(matchedItem)) {
      // Mark this item as selected
      currentPlan.selectedItems.push(matchedItem);
      sessionPlans.set(sessionId, currentPlan);
      
      // Get remaining items
      const remainingItems = currentPlan.items.filter(item => !currentPlan.selectedItems.includes(item));
      
      if (remainingItems.length > 0) {
        // Create reminder message with options
        const reminderResponse = {
          success: true,
          timestamp: new Date().toISOString(),
          sessionId,
          hasReminder: true,
          response: [
            {
              type: 'message',
              data: {
                text: `Great choice on the **${matchedItem}**! 🎉\n\nYou still have **${remainingItems.length}** more items to complete your setup:\n${remainingItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\nWould you like to continue with your shopping plan?`,
                format: 'markdown'
              }
            } as MessageResponse,
            {
              type: 'options',
              data: {
                message: 'Continue with:',
                options: remainingItems.slice(0, 4).map(item => ({
                  label: `Show me ${item}`,
                  value: item.toLowerCase().replace(/\s+/g, '_'),
                  icon: getCategoryIcon(item)
                })),
                allowSkip: true
              }
            } as OptionsResponse
          ]
        };
        return res.json(reminderResponse);
      } else {
        // All items completed!
        const completionResponse = {
          success: true,
          timestamp: new Date().toISOString(),
          sessionId,
          hasReminder: true,
          response: {
            type: 'message',
            data: {
              text: `🎊 **Congratulations!** You've completed your shopping list!\n\nYou've selected items for: ${currentPlan.items.join(', ')}.\n\nIs there anything else I can help you with?`,
              format: 'markdown'
            }
          } as MessageResponse
        };
        // Clear the plan
        sessionPlans.delete(sessionId);
        return res.json(completionResponse);
      }
    }
    
    return res.json({ success: true, hasReminder: false });
    
  } catch (error: any) {
    logger.error('Product clicked error:', error);
    return res.json({ success: true, hasReminder: false });
  }
});

// Helper function to get category icon
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    desk: '🪑', desks: '🪑',
    chair: '🪑', chairs: '🪑',
    laptop: '💻', laptops: '💻', computer: '💻',
    monitor: '🖥️', monitors: '🖥️',
    keyboard: '⌨️', keyboards: '⌨️',
    mouse: '🖱️',
    printer: '🖨️', printers: '🖨️',
    storage: '💾',
    stationery: '📎', supplies: '📎',
    technology: '💻', tech: '💻',
    furniture: '🪑',
    headphones: '🎧',
    webcam: '📷'
  };
  
  const lowerCategory = category.toLowerCase();
  for (const [key, icon] of Object.entries(icons)) {
    if (lowerCategory.includes(key)) return icon;
  }
  return '📦';
}

export default router;
