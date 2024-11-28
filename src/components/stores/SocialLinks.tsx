import React from 'react';
import { 
  Facebook, 
  Instagram,
  MessageCircle,
  MapPin,
  Phone,
  MessagesSquare,
} from 'lucide-react';
import type { SocialLinks as SocialLinksType } from '../../types';

interface SocialLinksProps {
  links: SocialLinksType;
  className?: string;
  variant?: 'light' | 'dark';
}

const SOCIAL_PLATFORMS = [
  { 
    key: 'facebook', 
    icon: Facebook, 
    color: '#1877F2', 
    label: 'Facebook',
    formatUrl: (url: string) => url
  },
  { 
    key: 'messenger', 
    icon: MessagesSquare, 
    color: '#00B2FF', 
    label: 'Facebook Messenger',
    formatUrl: (url: string) => url
  },
  { 
    key: 'instagram', 
    icon: Instagram, 
    color: '#E4405F', 
    label: 'Instagram',
    formatUrl: (url: string) => url
  },
  { 
    key: 'whatsapp', 
    icon: Phone, 
    color: '#25D366', 
    label: 'WhatsApp',
    formatUrl: (url: string) => {
      // If it's already a wa.me link, return as is
      if (url.includes('wa.me')) return url;
      // Otherwise, format the phone number into a wa.me link
      const phone = url.replace(/\D/g, '');
      return `https://wa.me/${phone}`;
    }
  },
  { 
    key: 'google_maps', 
    icon: MapPin, 
    color: '#4285F4', 
    label: 'Google Maps',
    formatUrl: (url: string) => url
  },
] as const;

export default function SocialLinks({ links, className = '' }: SocialLinksProps) {
  const hasSocialLinks = Object.values(links).some(link => !!link);

  if (!hasSocialLinks) return null;

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {SOCIAL_PLATFORMS.map(({ key, icon: Icon, label, formatUrl }) => {
        const link = links[key as keyof SocialLinksType];
        if (!link) return null;

        const formattedLink = formatUrl(link);

        return (
          <a
            key={key}
            href={formattedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-900 transition-colors duration-200 flex items-center gap-2"
            aria-label={label}
            title={label}
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}