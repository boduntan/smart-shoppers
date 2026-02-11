import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { openaiService } from '../services/openaiService';
import { chromaService } from '../services/chromaService';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Image upload with chat - analyzes image and searches for similar products
router.post('/image-chat', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, sessionId } = req.body;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
      return;
    }

    // Generate image URL path
    const imageUrl = `/uploads/images/${uploadedFile.filename}`;

    // Use OpenAI Vision API to analyze the image
    logger.info('Analyzing uploaded image with Vision API...');
    const imageAnalysis = await openaiService.analyzeImageWithText(
      imageUrl,
      message || "What product is this? Help me find similar items at Staples."
    );

    // Search for products based on image analysis
    let products: any[] = [];
    let searchQuery = '';
    let searchMethod = '';
    
    // Try multiple search strategies
    const searchStrategies = async (): Promise<void> => {
      // Strategy 1: Try combined search terms
      if (imageAnalysis.searchTerms && imageAnalysis.searchTerms.length > 0) {
        searchQuery = imageAnalysis.searchTerms.slice(0, 3).join(' ');
        logger.info(`Search Strategy 1 - Combined terms: "${searchQuery}"`);
        
        try {
          const searchResult = await chromaService.searchProducts(searchQuery, 6);
          if (searchResult.products.length > 0) {
            products = searchResult.products.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description,
              vendor: p.vendor,
              price: p.price,
              score: p.score,
              url: p.url
            }));
            searchMethod = 'combined_terms';
            logger.info(`Found ${products.length} products with combined terms`);
            return;
          }
        } catch (err) {
          logger.warn('Combined term search failed:', err);
        }
      }
      
      // Strategy 2: Search by product type (e.g., "Laptop", "Chair")
      if (products.length === 0 && imageAnalysis.productType) {
        searchQuery = imageAnalysis.productType;
        logger.info(`Search Strategy 2 - Product type: "${searchQuery}"`);
        
        try {
          const typeResults = await prisma.product.findMany({
            where: {
              OR: [
                { title: { contains: imageAnalysis.productType, mode: 'insensitive' } },
                { category: { contains: imageAnalysis.productType, mode: 'insensitive' } },
                { tags: { has: imageAnalysis.productType.toLowerCase() } }
              ]
            },
            take: 6,
            select: {
              id: true,
              title: true,
              bodyHtml: true,
              vendor: true,
              price: true,
              url: true,
              images: true
            }
          });
          
          if (typeResults.length > 0) {
            products = typeResults.map((p: any) => ({
              id: p.id,
              title: p.title,
              description: p.bodyHtml?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
              vendor: p.vendor,
              price: Number(p.price) || 0,
              score: 0.85,
              url: p.url,
              image: p.images?.[0] || ''
            }));
            searchMethod = 'product_type';
            logger.info(`Found ${products.length} products by product type`);
            return;
          }
        } catch (err) {
          logger.warn('Product type search failed:', err);
        }
      }
      
      // Strategy 3: Search individual terms one by one
      if (products.length === 0 && imageAnalysis.searchTerms) {
        for (const term of imageAnalysis.searchTerms) {
          logger.info(`Search Strategy 3 - Individual term: "${term}"`);
          
          try {
            const termResults = await prisma.product.findMany({
              where: {
                OR: [
                  { title: { contains: term, mode: 'insensitive' } },
                  { vendor: { contains: term, mode: 'insensitive' } }
                ]
              },
              take: 6,
              select: {
                id: true,
                title: true,
                bodyHtml: true,
                vendor: true,
                price: true,
                url: true,
                images: true
              }
            });
            
            if (termResults.length > 0) {
              products = termResults.map((p: any) => ({
                id: p.id,
                title: p.title,
                description: p.bodyHtml?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
                vendor: p.vendor,
                price: Number(p.price) || 0,
                score: 0.75,
                url: p.url,
                image: p.images?.[0] || ''
              }));
              searchQuery = term;
              searchMethod = 'individual_term';
              logger.info(`Found ${products.length} products with term "${term}"`);
              return;
            }
          } catch (err) {
            logger.warn(`Individual term search failed for "${term}":`, err);
          }
        }
      }
      
      // Strategy 4: Broad category fallback - extract main category word
      if (products.length === 0) {
        const categoryWords = ['laptop', 'computer', 'chair', 'desk', 'printer', 'monitor', 
                               'keyboard', 'mouse', 'pen', 'paper', 'notebook', 'headset',
                               'webcam', 'cable', 'storage', 'tablet', 'phone', 'speaker'];
        
        const foundCategory = categoryWords.find(cat => 
          imageAnalysis.productType?.toLowerCase().includes(cat) ||
          imageAnalysis.searchTerms?.some(t => t.toLowerCase().includes(cat))
        );
        
        if (foundCategory) {
          logger.info(`Search Strategy 4 - Category fallback: "${foundCategory}"`);
          searchQuery = foundCategory;
          
          try {
            const catResults = await prisma.product.findMany({
              where: {
                title: { contains: foundCategory, mode: 'insensitive' }
              },
              take: 6,
              orderBy: { price: 'asc' },
              select: {
                id: true,
                title: true,
                bodyHtml: true,
                vendor: true,
                price: true,
                url: true,
                images: true
              }
            });
            
            if (catResults.length > 0) {
              products = catResults.map((p: any) => ({
                id: p.id,
                title: p.title,
                description: p.bodyHtml?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
                vendor: p.vendor,
                price: Number(p.price) || 0,
                score: 0.7,
                url: p.url,
                image: p.images?.[0] || ''
              }));
              searchMethod = 'category_fallback';
              logger.info(`Found ${products.length} products in category "${foundCategory}"`);
            }
          } catch (err) {
            logger.warn('Category fallback search failed:', err);
          }
        }
      }
    };
    
    await searchStrategies();
    logger.info(`Final search result: ${products.length} products via ${searchMethod || 'none'}`);

    // Build response message
    let aiResponse = `📸 **Image Analysis**\n\n`;
    aiResponse += `I can see: **${imageAnalysis.analysis}**\n\n`;
    aiResponse += `Product Type: **${imageAnalysis.productType}**\n`;
    
    if (imageAnalysis.features && imageAnalysis.features.length > 0) {
      aiResponse += `\nKey features identified:\n`;
      imageAnalysis.features.forEach(f => {
        aiResponse += `• ${f}\n`;
      });
    }
    
    if (products.length > 0) {
      aiResponse += `\n\n🛒 **Here are ${products.length} ${imageAnalysis.productType || 'similar'} products from Staples:**`;
    } else {
      aiResponse += `\n\nI couldn't find exact matches in our inventory. Try searching for: ${imageAnalysis.searchTerms?.join(', ') || imageAnalysis.productType}`;
    }

    res.json({
      success: true,
      data: {
        sessionId: sessionId || 'new-session',
        userMessage: message || 'Image uploaded',
        imageUrl: imageUrl,
        aiResponse: aiResponse,
        imageAnalysis: {
          productType: imageAnalysis.productType,
          features: imageAnalysis.features,
          searchTerms: imageAnalysis.searchTerms
        },
        products: products,
        searchQuery: searchQuery,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Image upload chat error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) logger.error('Failed to delete uploaded file:', err);
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Serve uploaded images
router.get('/images/:filename', (req: Request, res: Response): void => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
      return;
    }
    
    const imagePath = path.join(process.cwd(), 'uploads', 'images', filename);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      res.status(404).json({
        success: false,
        error: 'Image not found'
      });
      return;
    }

    // Send the image file
    res.sendFile(imagePath);

  } catch (error) {
    logger.error('Serve image error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
