import { z } from 'zod';

interface ParsedProduct {
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  originalUrl?: string;
}

interface MarketplaceParser {
  name: string;
  pattern: RegExp;
  extractOriginalUrl: (url: string) => string | null;
}

const marketplaces: MarketplaceParser[] = [
  {
    name: 'amazon',
    pattern: /amazon\./i,
    extractOriginalUrl: (url: string) => {
      // Extract ASIN and reconstruct original URL
      console.log('Extracting Amazon ASIN from:', url);
      const asinMatch = url.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
      console.log('ASIN match:', asinMatch);
      if (asinMatch) {
        const asin = asinMatch[1];
        return `https://www.amazon.com/dp/${asin}`;
      }
      return null;
    }
  },
  {
    name: 'aliexpress',
    pattern: /aliexpress\.com|ali\.ski/i,
    extractOriginalUrl: (url: string) => {
      // Extract original URL from AliExpress affiliate link
      const match = url.match(/aliexpress\.com\/item\/[\d-]+\.html/);
      if (match) return `https://${match[0]}`;
      return null;
    }
  }
];

export function detectMarketplace(url: string): string | null {
  for (const marketplace of marketplaces) {
    if (marketplace.pattern.test(url)) {
      return marketplace.name;
    }
  }
  return null;
}

export function extractOriginalUrl(affiliateUrl: string): string | null {
  for (const marketplace of marketplaces) {
    if (marketplace.pattern.test(affiliateUrl)) {
      const originalUrl = marketplace.extractOriginalUrl(affiliateUrl);
      if (originalUrl) return originalUrl;
    }
  }
  return null;
}

export const urlSchema = z.object({
  affiliateUrl: z.string().url('Must be a valid URL'),
  originalUrl: z.string().url('Must be a valid URL').optional(),
  marketplace: z.string().optional()
});

export type AffiliateUrlData = z.infer<typeof urlSchema>;

export function parseAffiliateUrl(url: string): AffiliateUrlData {
  console.log('Parsing affiliate URL:', url);
  const marketplace = detectMarketplace(url)?.toLowerCase();
  console.log('Detected marketplace:', marketplace);
  const originalUrl = marketplace ? extractOriginalUrl(url) : undefined;
  console.log('Extracted original URL:', originalUrl);

  return {
    affiliateUrl: url,
    originalUrl: originalUrl || url,
    marketplace: marketplace || undefined
  };
}
