import { scrapeAmazonProduct } from './amazon-scraper';
import { ParsedProduct } from '../../types';

export async function scrapeProduct(url: string, marketplace: string): Promise<Partial<ParsedProduct>> {
  switch (marketplace.toLowerCase()) {
    case 'amazon':
      return await scrapeAmazonProduct(url);
    default:
      return {
        error: 'Unsupported marketplace'
      };
  }
}

export function isSupportedMarketplace(marketplace: string): boolean {
  return ['amazon'].includes(marketplace.toLowerCase());
}

export async function isUrlSupported(url: string): Promise<boolean> {
  // Amazon URL patterns
  const amazonPattern = /amazon\.com.*\/[A-Z0-9]{10}(?:\/|\?|$)/;
  return amazonPattern.test(url);
}
