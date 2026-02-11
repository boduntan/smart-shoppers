/**
 * Backend Response Types for Staples Omni Chatbot
 * ================================================
 * 
 * This file defines the standardized response format that matches
 * the frontend expectations for chat responses.
 */

// =============================================================================
// BASE TYPES
// =============================================================================

export type ChatResponseType = 
  | 'message' 
  | 'suggested_prompts' 
  | 'options' 
  | 'products' 
  | 'comparison';

export type ProductAvailability = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Pre-Order';
export type ProductBadge = 'Best Seller' | 'Sale' | 'New' | 'Clearance' | 'Limited' | string;

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

export interface SuggestedPrompt {
  id: string;
  text: string;
  icon?: string;
}

export interface OptionItem {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | undefined;
  image: string;
  rating?: number | undefined;
  reviewCount?: number | undefined;
  url: string;
  availability: ProductAvailability;
  badge?: ProductBadge | undefined;
  sku?: string | undefined;
  brand?: string | undefined;
  category?: string | undefined;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  url: string;
  specifications: ProductSpecification[];
}

// =============================================================================
// RESPONSE DATA PAYLOADS
// =============================================================================

export interface MessageData {
  text: string;
  format?: 'plain' | 'markdown' | 'html';
}

export interface SuggestedPromptsData {
  prompts: SuggestedPrompt[];
}

export interface OptionsData {
  message: string;
  options: OptionItem[];
  allowSkip?: boolean;
}

export interface ProductsData {
  message?: string;
  products: Product[];
  totalCount?: number;
  hasMore?: boolean;
}

export interface ComparisonData {
  message?: string;
  products: ComparisonProduct[];
  highlightDifferences?: boolean;
}

// =============================================================================
// UNIFIED RESPONSE TYPES (Discriminated Union)
// =============================================================================

export interface MessageResponse {
  type: 'message';
  data: MessageData;
}

export interface SuggestedPromptsResponse {
  type: 'suggested_prompts';
  data: SuggestedPromptsData;
}

export interface OptionsResponse {
  type: 'options';
  data: OptionsData;
}

export interface ProductsResponse {
  type: 'products';
  data: ProductsData;
}

export interface ComparisonResponse {
  type: 'comparison';
  data: ComparisonData;
}

export type ChatResponse = 
  | MessageResponse 
  | SuggestedPromptsResponse 
  | OptionsResponse 
  | ProductsResponse 
  | ComparisonResponse;

// =============================================================================
// API RESPONSE WRAPPER
// =============================================================================

export interface ApiResponse {
  success: boolean;
  timestamp: string;
  sessionId?: string;
  response: ChatResponse | ChatResponse[];
  error?: {
    code: string;
    message: string;
  };
}
