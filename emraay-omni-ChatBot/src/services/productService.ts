import { apiClient } from './apiClient';
import { Product } from './chatService';

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface CategoryResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    category: string;
  };
}

export interface CategoriesListResponse {
  success: boolean;
  data: {
    predefined: Array<{
      name: string;
      slug: string;
      count: number;
    }>;
    database: Array<{
      name: string;
      count: number;
    }>;
  };
}

export interface ProductSearchParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const productService = {
  // Get paginated products
  getProducts: async (params: ProductSearchParams = {}): Promise<ProductsResponse> => {
    const { data } = await apiClient.get<ProductsResponse>('/products', { params });
    return data;
  },

  // Get product by ID
  getProductById: async (id: string): Promise<{ success: boolean; data: Product }> => {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },

  // Get products by category
  getProductsByCategory: async (
    category: string,
    params: ProductSearchParams = {}
  ): Promise<CategoryResponse> => {
    const { data } = await apiClient.get<CategoryResponse>(`/products/category/${category}`, {
      params,
    });
    return data;
  },

  // Get all available categories
  getCategoriesList: async (): Promise<CategoriesListResponse> => {
    try {
      const { data } = await apiClient.get<CategoriesListResponse>('/products/categories/list');
      return data;
    } catch (error: any) {
      // If endpoint doesn't exist or fails, return mock data
      console.warn('Categories endpoint not available, using fallback data');
      return {
        success: true,
        data: {
          predefined: [
            { name: 'Office Supplies', slug: 'office-supplies', count: 100 },
            { name: 'Tech & Electronics', slug: 'tech-electronics', count: 85 },
            { name: 'Furniture', slug: 'furniture', count: 60 },
            { name: 'Cleaning & Breakroom', slug: 'cleaning-breakroom', count: 45 },
            { name: 'School Supplies', slug: 'school-supplies', count: 70 },
            { name: 'Print & Copy', slug: 'print-copy', count: 30 }
          ],
          database: []
        }
      };
    }
  },

  // Search products (if backend supports it)
  searchProducts: async (
    searchQuery: string,
    params: ProductSearchParams = {}
  ): Promise<ProductsResponse> => {
    const { data} = await apiClient.get<ProductsResponse>('/products', {
      params: { ...params, search: searchQuery },
    });
    return data;
  },
};
