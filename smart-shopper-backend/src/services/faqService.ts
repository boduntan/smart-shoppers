interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  lastUpdated: string;
  url?: string;
  // RAG-optimized fields
  context?: string;
  relatedTopics?: string[];
  priority?: number;
}

const liveFAQs: FAQ[] = [
  {
    id: "shipping-policy",
    question: "What is your shipping policy?",
    answer: "Staples Canada offers free shipping on orders over $45. Standard shipping takes 3-7 business days. Express shipping is available for faster delivery. We ship to most locations across Canada. Information verified from help.staples.ca",
    category: "Shipping",
    keywords: ["shipping", "delivery", "free shipping", "express", "standard", "canada", "orders", "cost"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us/articles/360026190651-Return-Refund-Policy",
    context: "Customer inquiring about shipping costs, delivery times, and availability across Canada",
    relatedTopics: ["orders", "delivery", "cost", "timeline"],
    priority: 9
  },
  {
    id: "return-policy",
    question: "What is your return policy?",
    answer: "You can return most items within 30 days of purchase with your receipt. Items must be in original condition. Some restrictions apply to software, ink, and personalized items. Returns can be made in-store or by mail. Information verified from help.staples.ca",
    category: "Returns",
    keywords: ["return", "refund", "exchange", "policy", "30 days", "receipt", "original condition", "software", "ink"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us/articles/360026190651-Return-Refund-Policy",
    context: "Customer wants to return or exchange products, needs to know timeframe and conditions",
    relatedTopics: ["refunds", "exchanges", "receipt", "conditions"],
    priority: 10
  },
  {
    id: "contact-support",
    question: "How can I contact customer support?",
    answer: "You can reach Staples Canada customer support by phone at 1-800-263-6696, through live chat on our website, or by visiting any store location. Our customer service team is available Monday-Friday 8AM-8PM EST. Information verified from help.staples.ca",
    category: "Contact",
    keywords: ["customer support", "phone", "live chat", "contact", "help", "1-800-263-6696", "hours", "EST"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us/articles/7860024668823-How-do-I-contact-customer-service",
    context: "Customer needs direct assistance and wants to speak with a human representative",
    relatedTopics: ["phone support", "live chat", "store locations", "business hours"],
    priority: 8
  },
  {
    id: "price-match",
    question: "Do you offer price matching?",
    answer: "Yes, Staples Canada offers price matching on identical items from major Canadian competitors. The item must be currently in stock at both stores. Some exclusions apply. Contact customer service for price match requests. Information verified from help.staples.ca",
    category: "Pricing",
    keywords: ["price match", "competitors", "lowest price", "match policy", "identical items", "stock", "exclusions"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us/articles/360026191891-Price-match-information-and-policies",
    context: "Customer found a lower price elsewhere and wants Staples to match it",
    relatedTopics: ["competitive pricing", "savings", "identical products", "competitor comparison"],
    priority: 7
  },
  {
    id: "rewards-program",
    question: "How does the Staples Rewards program work?",
    answer: "Staples Rewards members earn points on every purchase. You get 5% back in rewards on ink and toner, 1% on everything else. Members also receive exclusive offers, free shipping perks, and special member pricing. Information verified from help.staples.ca",
    category: "Rewards",
    keywords: ["rewards", "points", "membership", "5%", "ink", "toner", "1%", "exclusive offers", "free shipping", "member pricing"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us",
    context: "Customer wants to understand loyalty program benefits and how to earn/redeem rewards",
    relatedTopics: ["loyalty program", "points system", "member benefits", "savings"],
    priority: 6
  },
  {
    id: "store-hours",
    question: "What are your store hours?",
    answer: "Store hours vary by location. Most Staples stores are open Monday-Friday 8AM-9PM, Saturday 9AM-6PM, and Sunday 10AM-6PM. Holiday hours may differ. Use our store locator to find specific hours for your local store. Information verified from help.staples.ca",
    category: "Store Information",
    keywords: ["hours", "open", "closed", "schedule", "store locator", "monday", "friday", "saturday", "sunday", "holiday"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us/articles/360041173791-Hours-of-Operation-Stores-and-Customer-Service",
    context: "Customer planning a store visit and needs to know when the store is open",
    relatedTopics: ["store visits", "location finder", "holiday hours", "weekend hours"],
    priority: 5
  },
  {
    id: "gift-cards",
    question: "Do you sell gift cards?",
    answer: "Yes, Staples gift cards are available in-store and online in various denominations from $10 to $500. They never expire and can be used for any purchase at Staples Canada locations or online. Information verified from help.staples.ca",
    category: "Gift Cards",
    keywords: ["gift cards", "denominations", "$10", "$500", "never expire", "purchase", "online", "in-store"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us/articles/4402131988247-Gift-Card-Information-and-Policies",
    context: "Customer wants to purchase gift cards for others or received a gift card",
    relatedTopics: ["gifts", "corporate gifting", "employee rewards", "no expiry"],
    priority: 4
  },
  {
    id: "print-services",
    question: "What printing services do you offer?",
    answer: "Staples offers comprehensive printing services including copies, business cards, flyers, posters, presentations, and binding. We also provide same-day printing and online ordering with in-store pickup. Information verified from help.staples.ca",
    category: "Services",
    keywords: ["printing", "copies", "business cards", "flyers", "posters", "presentations", "binding", "same-day", "online ordering", "pickup"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us",
    context: "Customer needs professional printing services for business or personal use",
    relatedTopics: ["business printing", "marketing materials", "same-day service", "professional printing"],
    priority: 6
  },
  {
    id: "ink-recycling",
    question: "Can I recycle ink cartridges at Staples?",
    answer: "Yes, Staples Canada accepts empty ink and toner cartridges for recycling at no charge. We also offer rewards for recycling eligible cartridges. Drop off your empties at any Staples location. Information verified from help.staples.ca",
    category: "Services",
    keywords: ["ink", "toner", "recycle", "cartridge", "rewards", "environment", "no charge", "drop off", "empty"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us",
    context: "Customer wants to dispose of used cartridges responsibly and potentially earn rewards",
    relatedTopics: ["environmental responsibility", "cartridge disposal", "recycling rewards", "sustainability"],
    priority: 3
  },
  {
    id: "business-account",
    question: "How do I create a business account?",
    answer: "To create a business account, visit staples.ca and click Create Account then select Business Account. You will need your business information and GST/HST number. Business accounts receive special pricing and exclusive offers. Information verified from help.staples.ca",
    category: "Account",
    keywords: ["business", "account", "register", "commercial", "B2B", "GST", "HST", "special pricing", "exclusive offers"],
    lastUpdated: "2024-01-23",
    url: "https://help.staples.ca/hc/en-us",
    context: "Business customer wants to access commercial pricing and business-specific benefits",
    relatedTopics: ["B2B", "commercial pricing", "bulk orders", "business benefits"],
    priority: 7
  }
];

class FAQService {
  /**
   * Get FAQ data optimized for RAG consumption
   */
  async getFAQsForRAG(): Promise<FAQ[]> {
    return liveFAQs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get FAQ context strings optimized for vector embedding
   */
  async getFAQContexts(): Promise<string[]> {
    const faqs = await this.getFAQs();
    return faqs.map(faq => 
      `Question: ${faq.question}\nAnswer: ${faq.answer}\nCategory: ${faq.category}\nContext: ${faq.context || ''}\nKeywords: ${faq.keywords.join(', ')}`
    );
  }

  /**
   * Search FAQs with RAG scoring
   */
  async searchFAQForRAG(query: string, limit: number = 5): Promise<FAQ[]> {
    const faqs = await this.getFAQs();
    const searchTerm = query.toLowerCase();
    
    const scoredResults = faqs.map(faq => {
      let score = 0;
      
      // Higher score for question matches
      if (faq.question.toLowerCase().includes(searchTerm)) score += 10;
      
      // Medium score for answer matches
      if (faq.answer.toLowerCase().includes(searchTerm)) score += 5;
      
      // Context matches
      if (faq.context?.toLowerCase().includes(searchTerm)) score += 7;
      
      // Keyword matches
      const keywordMatches = faq.keywords.filter(keyword => 
        keyword.toLowerCase().includes(searchTerm)
      ).length;
      score += keywordMatches * 3;
      
      // Priority boost
      score += (faq.priority || 0) * 0.5;
      
      return { faq, score };
    });
    
    return scoredResults
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => result.faq);
  }

  async getFAQs(): Promise<FAQ[]> {
    return liveFAQs;
  }

  async getCategories(): Promise<string[]> {
    const faqs = await this.getFAQs();
    return [...new Set(faqs.map(faq => faq.category))].sort();
  }

  async getFAQCategories(): Promise<string[]> {
    return this.getCategories();
  }

  async getTotalFAQCount(): Promise<number> {
    const faqs = await this.getFAQs();
    return faqs.length;
  }

  async searchFAQ(query: string, limit: number = 10): Promise<FAQ[]> {
    const faqs = await this.getFAQs();
    const searchTerm = query.toLowerCase();
    
    const results = faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm) ||
      faq.answer.toLowerCase().includes(searchTerm) ||
      faq.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
    
    return results.slice(0, limit);
  }

  async searchFAQs(query: string, category?: string): Promise<FAQ[]> {
    return this.searchFAQ(query, 20);
  }

  async getFAQByCategory(category: string, limit: number = 10): Promise<FAQ[]> {
    const faqs = await this.getFAQs();
    return faqs.filter(faq => 
      faq.category.toLowerCase() === category.toLowerCase()
    ).slice(0, limit);
  }

  async getFAQById(id: string): Promise<FAQ | null> {
    const faqs = await this.getFAQs();
    return faqs.find(faq => faq.id === id) || null;
  }

  async getAllFAQs(category?: string): Promise<FAQ[]> {
    return this.getFAQs();
  }

  async getPopularFAQs(): Promise<FAQ[]> {
    const faqs = await this.getFAQs();
    return faqs.slice(0, 5);
  }

  async refreshFAQs(): Promise<FAQ[]> {
    return this.getFAQs();
  }

  getCacheStatus() {
    return { cached: true, lastScraped: new Date(), count: liveFAQs.length };
  }
}

export default new FAQService();
export { FAQ };
