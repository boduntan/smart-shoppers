import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import faqService from './faqService';
// import { chromaService } from './chromaService'; // Temporarily disabled

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    // Check if we should use Azure OpenAI or standard OpenAI
    if (config.azureOpenaiApiKey && config.azureOpenaiEndpoint) {
      // Use Azure OpenAI Service
      this.client = new OpenAI({
        apiKey: config.azureOpenaiApiKey,
        baseURL: `${config.azureOpenaiEndpoint}/openai/deployments/${config.azureOpenaiDeploymentName}`,
        defaultQuery: { 'api-version': config.azureOpenaiApiVersion },
        defaultHeaders: {
          'api-key': config.azureOpenaiApiKey,
        },
      });
      logger.info('Using Azure OpenAI Service');
    } else if (config.openaiApiKey) {
      // Use standard OpenAI
      this.client = new OpenAI({
        apiKey: config.openaiApiKey,
      });
      logger.info('Using standard OpenAI API');
    } else {
      throw new Error('No OpenAI API key configured (Azure or standard)');
    }
  }

  async generateChatResponse(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    productContext?: any[]
  ): Promise<string> {
    try {
      // Get relevant FAQ context for the user's message
      let faqContext: any[] = [];
      try {
        faqContext = await faqService.searchFAQForRAG(message, 2);
      } catch (error) {
        logger.warn('Could not fetch FAQ context:', error);
      }
      
      const systemPrompt = this.buildSystemPrompt(productContext, faqContext);
      
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({ 
          role: msg.role, 
          content: msg.content 
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam)),
        { role: 'user', content: message }
      ];

      const completion = await this.client.chat.completions.create({
        model: config.openaiModel || 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      return response;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateProductRecommendations(
    query: string,
    products: any[],
    maxRecommendations: number = 5
  ): Promise<string> {
    try {
      const productList = products
        .slice(0, 10) // Limit context size
        .map(p => `- ${p.title} by ${p.vendor} (ID: ${p.id})`)
        .join('\n');

      const prompt = `Based on this query: "${query}"
      
Here are some relevant products from our Staples catalog:
${productList}

Please recommend the best products and explain why they match the user's needs. Be concise but helpful.`;

      const completion = await this.client.chat.completions.create({
        model: config.openaiModel || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Staples shopping assistant. Recommend products based on user needs and explain your reasoning clearly.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.6,
      });

      return completion.choices[0]?.message?.content || 'Sorry, I could not generate recommendations at this time.';
    } catch (error) {
      logger.error('OpenAI recommendation error:', error);
      throw new Error('Failed to generate product recommendations');
    }
  }

  private buildSystemPrompt(productContext?: any[], faqContext?: any[]): string {
    const basePrompt = `You are a helpful AI shopping assistant for Staples Canada. You help customers find office supplies, furniture, technology, and other products.

Key guidelines:
- Be friendly, professional, and helpful
- Focus on Staples products and services
- Provide accurate information based on available context
- Ask clarifying questions when needed
- Provide specific product recommendations when possible
- If you don't know something, say so honestly
- Keep responses concise but informative
- Always provide natural, conversational responses rather than just reading raw data`;

    let contextSections = [];

    // Add FAQ context if available
    if (faqContext && faqContext.length > 0) {
      const faqInfo = faqContext
        .slice(0, 3)
        .map(faq => `Q: ${faq.question}\nA: ${faq.answer}`)
        .join('\n\n');
      
      contextSections.push(`Relevant FAQ Information:
${faqInfo}`);
    }

    // Add product context if available
    if (productContext && productContext.length > 0) {
      const contextProducts = productContext
        .slice(0, 5)
        .map(p => `- ${p.title} by ${p.vendor} ($${p.price || 'Price available in store'})`)
        .join('\n');

      contextSections.push(`Current relevant products in our inventory:
${contextProducts}`);
    }

    if (contextSections.length > 0) {
      return `${basePrompt}

${contextSections.join('\n\n')}

Use this context to provide helpful, natural responses. Don't just read the information - interpret it and respond conversationally.`;
    }

    return basePrompt;
  }

  async testConnection(): Promise<boolean> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello, this is a connection test.' }],
        max_tokens: 10,
      });

      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  // Temporarily disabled - will re-enable when ChromaDB is working
  /*
  async generateIntelligentResponse(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{
    response: string;
    searchResults?: any[];
    recommendedProducts?: any[];
  }> {
    try {
      // First, check if the message seems to be asking about products
      const isProductQuery = await this.isProductRelatedQuery(message);
      
      let searchResults: any[] = [];
      let recommendedProducts: any[] = [];

      if (isProductQuery) {
        // Use semantic search to find relevant products
        try {
          const searchResponse = await chromaService.searchProducts(message, 8);
          searchResults = searchResponse.products;
          recommendedProducts = searchResults.slice(0, 3); // Top 3 for recommendations
          
          logger.info(`Found ${searchResults.length} relevant products for query: "${message}"`);
        } catch (error) {
          logger.error('Vector search failed, continuing without product context:', error);
        }
      }

      // Generate response with product context
      const response = await this.generateChatResponse(
        message, 
        conversationHistory, 
        searchResults
      );

      return {
        response,
        ...(searchResults.length > 0 && { searchResults }),
        ...(recommendedProducts.length > 0 && { recommendedProducts })
      };

    } catch (error) {
      logger.error('Intelligent response generation failed:', error);
      throw new Error('Failed to generate intelligent response');
    }
  }
  */

  private async isProductRelatedQuery(message: string): Promise<boolean> {
    try {
      const prompt = `Analyze this message and determine if the user is asking about products, shopping, or needs product recommendations. 

Message: "${message}"

Respond with only "YES" if it's product-related, or "NO" if it's not.

Examples:
- "I need a new office chair" -> YES
- "What printers do you have?" -> YES  
- "Hello, how are you?" -> NO
- "What's the weather like?" -> NO`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 5,
        temperature: 0.1,
      });

      const result = completion.choices[0]?.message?.content?.trim().toUpperCase();
      return result === 'YES';
    } catch (error) {
      logger.error('Product query analysis failed:', error);
      // Default to true to be safe - better to search unnecessarily than miss a product query
      return true;
    }
  }

  async generateContextualResponse(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    try {
      // This is the same as generateChatResponse but with a clear name for conversation continuity
      return await this.generateChatResponse(message, conversationHistory);
    } catch (error) {
      logger.error('Generate contextual response error:', error);
      throw error;
    }
  }

  async analyzeImageWithText(imageUrl: string, userMessage?: string): Promise<{
    analysis: string;
    productType: string;
    searchTerms: string[];
    features: string[];
  }> {
    try {
      const prompt = userMessage || "What product is this? Help me find similar items.";
      
      // Read image file and convert to base64
      const fs = await import('fs');
      const path = await import('path');
      
      // Construct full file path from URL
      const imagePath = path.default.join(process.cwd(), imageUrl);
      
      if (!fs.default.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }
      
      const imageBuffer = fs.default.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Determine mime type from extension
      const ext = path.default.extname(imagePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      const mimeType = mimeTypes[ext] || 'image/jpeg';
      
      // Call OpenAI Vision API with gpt-4o
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a product identification expert for Staples Canada. Analyze images to identify products and suggest search terms.

Respond in JSON format:
{
  "analysis": "Brief description of what you see in the image",
  "productType": "The general category (e.g., Office Chair, Printer, Laptop, Pen, Notebook)",
  "searchTerms": ["array of 3-5 search terms to find this or similar products at Staples"],
  "features": ["key features or attributes you can identify"]
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);
      
      logger.info('Image analysis completed:', { productType: result.productType, searchTerms: result.searchTerms });
      
      return {
        analysis: result.analysis || 'Unable to analyze image',
        productType: result.productType || 'Unknown',
        searchTerms: result.searchTerms || [],
        features: result.features || []
      };

    } catch (error) {
      logger.error('Image analysis error:', error);
      // Return fallback response on error
      return {
        analysis: 'I couldn\'t fully analyze this image. Please describe what you\'re looking for.',
        productType: 'Unknown',
        searchTerms: [],
        features: []
      };
    }
  }

  /**
   * Generate a structured AI response with optional choices
   * The AI decides if choices should be shown based on context
   */
  async generateStructuredResponse(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    productContext?: any[],
    shoppingPlan?: { items: string[]; selectedItems: string[] }
  ): Promise<{
    message: string;
    choices?: Array<{ label: string; value: string; icon?: string }>;
    shoppingPlan?: { items: string[]; selectedItems: string[] };
    continueWithPlan?: boolean;
  }> {
    try {
      // Get relevant FAQ context
      let faqContext: any[] = [];
      try {
        faqContext = await faqService.searchFAQForRAG(message, 2);
      } catch (error) {
        logger.warn('Could not fetch FAQ context:', error);
      }

      const systemPrompt = `You are a helpful AI shopping assistant for Staples Canada.

IMPORTANT: You MUST respond with a valid JSON object in this exact format:
{
  "message": "Your full response message here with markdown formatting",
  "choices": [
    {"label": "Choice 1", "value": "choice_1", "icon": "emoji"},
    {"label": "Choice 2", "value": "choice_2", "icon": "emoji"}
  ],
  "shoppingPlan": {
    "items": ["item1", "item2", "item3"],
    "selectedItems": []
  }
}

Rules:
1. "message" is REQUIRED - always include your full helpful response
2. "choices" is OPTIONAL - include ONLY when you're offering categories/options to explore
3. "shoppingPlan" is OPTIONAL - include when helping user plan a multi-item purchase (like setting up a home office)
4. Use appropriate emojis for icons: 💻 laptop, 🪑 chair, 🖥️ monitor, ⌨️ keyboard, 🖨️ printer, 📄 paper, 💾 storage, 🎧 headphones, 📎 supplies, 🖱️ mouse, 📦 other
5. Keep choices to 3-6 options max
6. Be conversational and helpful in your message
7. Use markdown formatting in message (bold, lists, etc.)

${shoppingPlan && shoppingPlan.items && Array.isArray(shoppingPlan.items) ? `
CURRENT SHOPPING PLAN:
- Total items planned: ${shoppingPlan.items.join(', ')}
- Already selected: ${(shoppingPlan.selectedItems || []).join(', ') || 'none'}
- Remaining: ${shoppingPlan.items.filter(i => !(shoppingPlan.selectedItems || []).includes(i)).join(', ')}
Reference this plan in your response and offer to continue with remaining items.
` : ''}

${productContext && productContext.length > 0 ? `
AVAILABLE PRODUCTS:
${productContext.slice(0, 5).map(p => `- ${p.title} by ${p.vendor} ($${p.price})`).join('\n')}
` : ''}

${faqContext.length > 0 ? `
RELEVANT FAQ:
${faqContext.slice(0, 2).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}
` : ''}

RESPOND ONLY WITH VALID JSON, NO OTHER TEXT.`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({ 
          role: msg.role, 
          content: msg.content 
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam)),
        { role: 'user', content: message }
      ];

      const completion = await this.client.chat.completions.create({
        model: config.openaiModel || 'gpt-4o-mini',
        messages,
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response generated from OpenAI');
      }

      // Parse JSON response
      try {
        const parsed = JSON.parse(responseText);
        return {
          message: parsed.message || responseText,
          choices: parsed.choices,
          shoppingPlan: parsed.shoppingPlan,
          continueWithPlan: parsed.continueWithPlan
        };
      } catch (parseError) {
        // If JSON parsing fails, return the raw message
        logger.warn('Failed to parse AI JSON response, using raw text');
        return { message: responseText };
      }
    } catch (error) {
      logger.error('OpenAI structured response error:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}

export const openaiService = new OpenAIService();
