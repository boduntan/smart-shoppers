import { useState } from 'react';
import { productService } from '@/services/productService';
import { chatService } from '@/services/chatService';
import { imageService } from '@/services/imageService';
import { useApiHealth } from '@/context/ApiHealthContext';
import './FeatureShowcase.scss';

export const FeatureShowcase = () => {
  const { isHealthy, apiMode } = useApiHealth();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'chat' | 'image'>('products');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Product Search
  const testProductListing = async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts({ page: 1, limit: 5 });
      setResult(response);
      console.log('📦 Products fetched:', response);
    } catch (error) {
      console.error('❌ Product fetch failed:', error);
      setResult({ error: 'Failed to fetch products' });
    } finally {
      setLoading(false);
    }
  };

  // Category Listing
  const testCategories = async () => {
    setLoading(true);
    try {
      const response = await productService.getCategoriesList();
      setResult(response);
      console.log('📂 Categories fetched:', response);
    } catch (error) {
      console.error('❌ Categories fetch failed:', error);
      setResult({ error: 'Failed to fetch categories' });
    } finally {
      setLoading(false);
    }
  };

  // Category Products
  const testCategoryProducts = async (categorySlug: string) => {
    setLoading(true);
    try {
      const response = await productService.getProductsByCategory(categorySlug, { limit: 5 });
      setResult(response);
      console.log(`📂 ${categorySlug} products:`, response);
    } catch (error) {
      console.error('❌ Category products fetch failed:', error);
      setResult({ error: 'Failed to fetch category products' });
    } finally {
      setLoading(false);
    }
  };

  // AI Chat
  const testChat = async (message: string) => {
    setLoading(true);
    try {
      const response = await chatService.sendMessage({ message });
      setResult(response);
      console.log('💬 Chat response:', response);
    } catch (error) {
      console.error('❌ Chat failed:', error);
      setResult({ error: 'Failed to send chat message' });
    } finally {
      setLoading(false);
    }
  };

  // Image Upload
  const testImageUpload = async (file: File) => {
    setLoading(true);
    try {
      const response = await imageService.uploadImageChat(file, 'Image upload test');
      setResult(response);
      console.log('🖼️ Image uploaded:', response);
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      setResult({ error: 'Failed to upload image' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      testImageUpload(file);
    }
  };

  if (!isHealthy && apiMode === 'live') {
    return (
      <div className="feature-showcase">
        <div className="feature-showcase__error">
          <h3>⚠️ Backend API Not Available</h3>
          <p>Cannot test features - API connection failed</p>
          <p>Switch to Mock Mode in .env: VITE_API_MODE=mock</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-showcase">
      <h3>🎯 API Feature Showcase</h3>
      <p className="feature-showcase__subtitle">
        Test all backend API endpoints | Mode: {apiMode === 'mock' ? '🎭 Mock' : '🌐 Live'}
      </p>

      <div className="feature-showcase__tabs">
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          📦 Products
        </button>
        <button
          className={activeTab === 'categories' ? 'active' : ''}
          onClick={() => setActiveTab('categories')}
        >
          📂 Categories
        </button>
        <button
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          💬 AI Chat
        </button>
        <button
          className={activeTab === 'image' ? 'active' : ''}
          onClick={() => setActiveTab('image')}
        >
          🖼️ Image Upload
        </button>
      </div>

      <div className="feature-showcase__content">
        {activeTab === 'products' && (
          <div className="feature-tab">
            <h4>Product Catalog Endpoints</h4>
            <div className="button-group">
              <button onClick={testProductListing} disabled={loading}>
                GET /api/products
              </button>
            </div>
            <p className="hint">Fetch paginated product listing</p>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="feature-tab">
            <h4>Category Endpoints</h4>
            <div className="button-group">
              <button onClick={testCategories} disabled={loading}>
                GET /api/products/categories/list
              </button>
              <button onClick={() => testCategoryProducts('tech-electronics')} disabled={loading}>
                GET Tech & Electronics
              </button>
              <button onClick={() => testCategoryProducts('office-supplies')} disabled={loading}>
                GET Office Supplies
              </button>
              <button onClick={() => testCategoryProducts('furniture')} disabled={loading}>
                GET Furniture
              </button>
            </div>
            <p className="hint">Browse products by category</p>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="feature-tab">
            <h4>AI Chat with Conversation Memory</h4>
            <div className="button-group">
              <button onClick={() => testChat('I need an office chair')} disabled={loading}>
                💬 "I need an office chair"
              </button>
              <button onClick={() => testChat('Show me laptops under $1000')} disabled={loading}>
                💬 "Show me laptops under $1000"
              </button>
              <button onClick={() => testChat('What printers do you recommend?')} disabled={loading}>
                💬 "What printers do you recommend?"
              </button>
            </div>
            <p className="hint">POST /api/chat/conversation - AI responses with session memory</p>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="feature-tab">
            <h4>Image Upload & AI Analysis</h4>
            <div className="button-group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={loading}
                style={{ display: 'none' }}
                id="image-upload-test"
              />
              <label htmlFor="image-upload-test" className={`button-label ${loading ? 'disabled' : ''}`}>
                📷 Upload Product Image
              </label>
            </div>
            <p className="hint">POST /api/upload/image-chat - Upload image for AI recommendations</p>
          </div>
        )}

        {loading && (
          <div className="feature-showcase__loading">
            <div className="spinner"></div>
            <p>Testing API endpoint...</p>
          </div>
        )}

        {result && !loading && (
          <div className="feature-showcase__result">
            <h4>API Response:</h4>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
