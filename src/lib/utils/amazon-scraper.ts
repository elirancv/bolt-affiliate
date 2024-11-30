import { ParsedProduct } from '../../types';
import { cacheService } from './cache-service';

interface AmazonProduct {
  title: string;
  description: string;
  price: number;
  sale_price?: number;
  image_urls: string[];
  error?: string;
}

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  const match = priceStr.match(/[\d,.]+/);
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
}

function extractAsin(url: string): string | null {
  // Handle various Amazon URL formats
  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/,
    /\/product\/([A-Z0-9]{10})(?:\/|\?|$)/,
    /\/([A-Z0-9]{10})(?:\/|\?|$)/,
    /(?:\/|\?|\&)ASIN=([A-Z0-9]{10})(?:\/|\?|&|$)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

async function fetchAmazonProduct(asin: string): Promise<AmazonProduct> {
  // Check cache first
  const cacheKey = `amazon-product-${asin}`;
  const cachedProduct = cacheService.get<AmazonProduct>(cacheKey);
  if (cachedProduct) {
    console.log('Found product in cache:', asin);
    return cachedProduct;
  }

  console.log('Fetching product from API:', asin);

  try {
    const response = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=US`,
      {
        headers: {
          'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('RapidAPI rate limit exceeded');
        return {
          title: '',
          description: '',
          price: 0,
          image_urls: [],
          error: '429'
        };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.data) {
      throw new Error('Invalid API response format');
    }

    const productData = data.data;
    const currentPrice = parsePrice(productData.product_price);
    const originalPrice = parsePrice(productData.product_original_price);
    const description = productData.about_product ? 
      productData.about_product.join('\n\n') : 
      productData.product_description || '';

    const product = {
      title: productData.product_title || '',
      description,
      price: originalPrice || currentPrice || 0,
      sale_price: currentPrice,
      image_urls: productData.product_photos || [productData.product_photo].filter(Boolean)
    };

    // Cache the successful response for 24 hours
    const ONE_DAY = 1000 * 60 * 60 * 24;
    cacheService.set(cacheKey, product, ONE_DAY);
    console.log('Cached product:', asin);

    return product;

  } catch (error: any) {
    console.error('Error fetching Amazon product:', error);
    return {
      title: '',
      description: '',
      price: 0,
      image_urls: [],
      error: error.message
    };
  }
}

export async function scrapeAmazonProduct(url: string): Promise<Partial<ParsedProduct>> {
  try {
    const asin = extractAsin(url);
    if (!asin) {
      return {
        error: 'Invalid Amazon URL - could not extract ASIN'
      };
    }

    const product = await fetchAmazonProduct(asin);

    if (product.error) {
      return {
        error: product.error
      };
    }

    return {
      name: product.title,
      description: product.description,
      price: product.price,
      sale_price: product.sale_price,
      image_urls: product.image_urls,
      product_url: url
    };
  } catch (error: any) {
    console.error('Error scraping Amazon product:', error);
    return {
      error: error.message
    };
  }
}
