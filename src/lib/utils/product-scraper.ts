import { ParsedProduct, Marketplace } from '../../types';
import { scrapeAmazonProduct } from './amazon-scraper';

export async function scrapeProduct(url: string, marketplace: Marketplace): Promise<Partial<ParsedProduct>> {
  console.log('Scraping product:', { url, marketplace });
  
  // Ensure marketplace is lowercase
  const normalizedMarketplace = marketplace.toLowerCase() as Marketplace;
  
  switch (normalizedMarketplace) {
    case 'amazon':
      console.log('Using Amazon scraper');
      const result = await scrapeAmazonProduct(url);
      console.log('Amazon scraper result:', result);
      return result;
    case 'aliexpress':
      console.log('AliExpress scraping not implemented yet');
      return {};
    default:
      console.log('Unknown marketplace:', marketplace);
      return {};
  }
}

// Helper function to check if a URL is from a supported marketplace
export function isSupportedMarketplace(url: string): boolean {
  const isSupported = url.includes('amazon.com') || url.includes('aliexpress.com');
  console.log('Checking if URL is supported:', { url, isSupported });
  return isSupported;
}
