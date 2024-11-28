import { ParsedProduct } from '../../types';

interface AmazonProduct {
  title: string;
  description: string;
  price: number;
  sale_price?: number;
  image_urls: string[];
}

function parsePrice(price: string | undefined | null): number | undefined {
  if (!price) return undefined;
  const numericPrice = price.replace(/[^0-9.]/g, '');
  return numericPrice ? parseFloat(numericPrice) : undefined;
}

async function fetchAmazonProduct(asin: string): Promise<AmazonProduct> {
  try {
    console.log('Fetching Amazon product with ASIN:', asin);
    
    const response = await fetch(`https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=US`, {
      headers: {
        'X-RapidAPI-Key': 'ec293bc8ebmsh61570366fa86a53p1caa36jsnbd0009216967',
        'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Raw API response:', JSON.stringify(data, null, 2));
    
    if (!data.data) {
      throw new Error('Invalid API response format');
    }

    const productData = data.data;
    console.log('Product data:', productData);

    // Parse prices
    const currentPrice = parsePrice(productData.product_price);
    const originalPrice = parsePrice(productData.product_original_price);
    
    console.log('Parsed prices:', {
      currentPrice,
      originalPrice,
      raw_current: productData.product_price,
      raw_original: productData.product_original_price
    });

    // Create description from about_product bullet points
    const description = productData.about_product ? 
      productData.about_product.join('\n\n') : 
      productData.product_description || '';

    // Original price is the main price, current price is the sale price
    const price = originalPrice || 0;  // Use original price as main price
    const sale_price = currentPrice;   // Use current price as sale price

    console.log('Final prices:', {
      price,
      sale_price,
      comparison: `original: ${originalPrice}, current: ${currentPrice}`
    });

    return {
      title: productData.product_title || '',
      description: description,
      price,
      sale_price,
      image_urls: productData.product_photos || [productData.product_photo].filter(Boolean)
    };

  } catch (error) {
    console.error('Error fetching Amazon product:', error);
    return {
      title: '',
      description: '',
      price: 0,
      image_urls: []
    };
  }
}

export async function scrapeAmazonProduct(url: string): Promise<Partial<ParsedProduct>> {
  try {
    console.log('Scraping Amazon URL:', url);
    
    // Extract ASIN from URL
    const asinMatch = url.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
    if (!asinMatch) {
      throw new Error('Invalid Amazon URL - could not extract ASIN');
    }

    const asin = asinMatch[1];
    console.log('Extracted ASIN:', asin);
    
    const product = await fetchAmazonProduct(asin);
    console.log('Final product data:', product);

    return {
      name: product.title,
      description: product.description,
      price: product.price,
      sale_price: product.sale_price,
      image_urls: product.image_urls
    };
  } catch (error) {
    console.error('Error in scrapeAmazonProduct:', error);
    throw error;
  }
}
